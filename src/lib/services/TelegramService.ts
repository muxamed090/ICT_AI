import { TelegramRepository } from '@/lib/repositories/TelegramRepository'
import { SettingsRepository } from '@/lib/repositories/SettingsRepository'
import {
  TelegramEventType,
  TelegramSignalPayload,
  TelegramOrderPayload,
  TelegramSummaryPayload,
  TelegramStatusResult,
  NotificationLog,
  NotificationQueueItem,
} from '@/types/database'

// ── Telegram Message Templates ──────────────────────────────

function formatSignalMessage(eventType: TelegramEventType, payload: TelegramSignalPayload): string {
  const icon = eventType === 'buy_signal' ? '🟢 BUY' : '🔴 SELL'
  return [
    `📊 *${icon} Signal*`,
    ``,
    `Pair: \`${payload.pair}\``,
    `Entry: \`${payload.entry.toFixed(5)}\``,
    `Stop Loss: \`${payload.stopLoss.toFixed(5)}\``,
    `Take Profit: \`${payload.takeProfit.toFixed(5)}\``,
    `Risk: \`${payload.risk.toFixed(2)}%\``,
    `Confidence: \`${payload.confidence.toFixed(1)}%\``,
    ``,
    `_ICT AI Trader — ${new Date().toISOString()}_`,
  ].join('\n')
}

function formatOrderMessage(eventType: TelegramEventType, payload: TelegramOrderPayload): string {
  const statusIcon =
    eventType === 'order_executed' ? '✅' :
    eventType === 'order_filled' ? '🏁' :
    eventType === 'stop_loss_hit' ? '🛑' :
    eventType === 'take_profit_hit' ? '🎯' : '📋'

  return [
    `${statusIcon} *${eventType.replace(/_/g, ' ').toUpperCase()}*`,
    ``,
    `Pair: \`${payload.pair}\``,
    `Direction: \`${payload.direction.toUpperCase()}\``,
    `Executed Price: \`${payload.executedPrice.toFixed(5)}\``,
    `Lot Size: \`${payload.lotSize.toFixed(2)}\``,
    ``,
    `_ICT AI Trader — ${new Date().toISOString()}_`,
  ].join('\n')
}

function formatSummaryMessage(eventType: TelegramEventType, payload: TelegramSummaryPayload): string {
  const period = eventType === 'daily_summary' ? 'Daily' : 'Weekly'
  const pnlEmoji = payload.netPnl >= 0 ? '📈' : '📉'

  return [
    `${pnlEmoji} *${period} Summary*`,
    ``,
    `Total Trades: \`${payload.totalTrades}\``,
    `Win Rate: \`${payload.winRate.toFixed(1)}%\``,
    `Net PnL: \`${payload.netPnl >= 0 ? '+' : ''}$${payload.netPnl.toFixed(2)}\``,
    `Profit Factor: \`${payload.profitFactor.toFixed(2)}\``,
    ``,
    `_ICT AI Trader — ${new Date().toISOString()}_`,
  ].join('\n')
}

function formatGenericMessage(eventType: TelegramEventType, messageText: string): string {
  const iconMap: Record<string, string> = {
    risk_warning: '⚠️',
    emergency_stop: '🚨',
    broker_offline: '🔌',
    ml_high_confidence: '🧠',
    ai_decision: '🤖',
    economic_event: '📅',
    test: '🔔',
  }
  const icon = iconMap[eventType] ?? '📬'

  return [
    `${icon} *${eventType.replace(/_/g, ' ').toUpperCase()}*`,
    ``,
    messageText,
    ``,
    `_ICT AI Trader — ${new Date().toISOString()}_`,
  ].join('\n')
}

// ── Telegram API Call ────────────────────────────────────────

interface TelegramApiResult {
  success: boolean
  messageId: number | null
  error: string | null
}

async function callTelegramApi(
  botToken: string,
  chatId: string,
  text: string
): Promise<TelegramApiResult> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    const json = await res.json()

    if (json.ok) {
      return { success: true, messageId: json.result?.message_id ?? null, error: null }
    } else {
      return { success: false, messageId: null, error: json.description ?? 'Unknown Telegram API error' }
    }
  } catch (err) {
    return {
      success: false,
      messageId: null,
      error: err instanceof Error ? err.message : 'Network error calling Telegram API',
    }
  }
}

// ── TelegramService ──────────────────────────────────────────
// IMPORTANT: This service NEVER accesses Supabase directly.
// All database access goes through TelegramRepository and SettingsRepository.

export class TelegramService {
  constructor(
    private telegramRepo: TelegramRepository,
    private settingsRepo: SettingsRepository
  ) {}

  /**
   * Build a formatted message string from an event type + optional payload.
   */
  buildMessage(
    eventType: TelegramEventType,
    payload?: TelegramSignalPayload | TelegramOrderPayload | TelegramSummaryPayload | string
  ): string {
    if (eventType === 'buy_signal' || eventType === 'sell_signal') {
      return formatSignalMessage(eventType, payload as TelegramSignalPayload)
    }
    if (['order_executed', 'order_filled', 'stop_loss_hit', 'take_profit_hit'].includes(eventType)) {
      return formatOrderMessage(eventType, payload as TelegramOrderPayload)
    }
    if (eventType === 'daily_summary' || eventType === 'weekly_summary') {
      return formatSummaryMessage(eventType, payload as TelegramSummaryPayload)
    }
    return formatGenericMessage(eventType, typeof payload === 'string' ? payload : 'Notification event triggered.')
  }

  /**
   * Send a Telegram notification.
   * Reads chatId from user settings. Reads botToken from env.
   * Logs the result. Queues for retry on failure.
   */
  async send(
    userId: string,
    eventType: TelegramEventType,
    messageText: string
  ): Promise<{ success: boolean; logEntry: NotificationLog }> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      const logEntry = await this.telegramRepo.createLog({
        user_id: userId,
        event_type: eventType,
        channel: 'telegram',
        message_text: messageText,
        status: 'skipped',
        error_message: 'TELEGRAM_BOT_TOKEN not configured in environment variables.',
      })
      return { success: false, logEntry }
    }

    // Read chat_id from user settings (never hardcoded)
    const settings = await this.settingsRepo.getById(userId)
    if (!settings || !settings.telegram_enabled) {
      const logEntry = await this.telegramRepo.createLog({
        user_id: userId,
        event_type: eventType,
        channel: 'telegram',
        message_text: messageText,
        status: 'skipped',
        error_message: 'Telegram is not enabled in user settings.',
      })
      return { success: false, logEntry }
    }

    const chatId = settings.telegram_chat_id
    if (!chatId) {
      const logEntry = await this.telegramRepo.createLog({
        user_id: userId,
        event_type: eventType,
        channel: 'telegram',
        message_text: messageText,
        status: 'skipped',
        error_message: 'telegram_chat_id is not set in user settings.',
      })
      return { success: false, logEntry }
    }

    // Call the Telegram Bot API
    const result = await callTelegramApi(botToken, chatId, messageText)

    if (result.success) {
      const logEntry = await this.telegramRepo.createLog({
        user_id: userId,
        event_type: eventType,
        channel: 'telegram',
        chat_id: chatId,
        message_text: messageText,
        status: 'sent',
        telegram_msg_id: result.messageId,
      })
      return { success: true, logEntry }
    } else {
      // Log the failure
      const logEntry = await this.telegramRepo.createLog({
        user_id: userId,
        event_type: eventType,
        channel: 'telegram',
        chat_id: chatId,
        message_text: messageText,
        status: 'failed',
        error_message: result.error,
      })

      // Queue for retry
      await this.telegramRepo.enqueue({
        user_id: userId,
        event_type: eventType,
        channel: 'telegram',
        chat_id: chatId,
        message_text: messageText,
      })

      return { success: false, logEntry }
    }
  }

  /**
   * Send a test message to verify the Telegram connection.
   */
  async sendTest(userId: string): Promise<{ success: boolean; logEntry: NotificationLog }> {
    const testMessage = this.buildMessage('test', '🔔 Test notification from ICT AI Trader.\nYour Telegram integration is working correctly!')
    return this.send(userId, 'test', testMessage)
  }

  /**
   * Process pending retry queue items for a given user.
   */
  async processQueue(userId: string): Promise<{ processed: number; succeeded: number; failed: number }> {
    const pendingItems = await this.telegramRepo.getPendingQueue(userId)
    let processed = 0
    let succeeded = 0
    let failed = 0

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    for (const item of pendingItems) {
      processed++
      await this.telegramRepo.advanceQueueStatus(item.id, 'processing')

      const result = await callTelegramApi(botToken, item.chat_id, item.message_text)

      if (result.success) {
        succeeded++
        // Log successful retry
        await this.telegramRepo.createLog({
          user_id: userId,
          event_type: item.event_type,
          channel: 'telegram',
          chat_id: item.chat_id,
          message_text: item.message_text,
          status: 'sent',
          telegram_msg_id: result.messageId,
        })
        // Remove from queue
        await this.telegramRepo.deleteQueueItem(item.id)
      } else {
        failed++
        await this.telegramRepo.incrementQueueRetry(
          item.id,
          result.error ?? 'Unknown error during retry',
          item.max_retries
        )
      }
    }

    return { processed, succeeded, failed }
  }

  /**
   * Get the Telegram integration status for the dashboard.
   */
  async getStatus(userId: string): Promise<TelegramStatusResult> {
    const settings = await this.settingsRepo.getById(userId)
    const botConfigured = !!process.env.TELEGRAM_BOT_TOKEN
    const chatIdConfigured = !!settings?.telegram_chat_id
    const telegramEnabled = !!settings?.telegram_enabled

    const [todayMessageCount, pendingQueueCount, failedQueueCount, lastMessageAt] = await Promise.all([
      this.telegramRepo.getTodayLogCount(userId),
      this.telegramRepo.getPendingCount(userId),
      this.telegramRepo.getFailedCount(userId),
      this.telegramRepo.getLastMessageTimestamp(userId),
    ])

    return {
      botConfigured,
      chatIdConfigured,
      telegramEnabled,
      todayMessageCount,
      pendingQueueCount,
      failedQueueCount,
      lastMessageAt,
    }
  }

  /**
   * Get recent notification logs for the user.
   */
  async getRecentLogs(userId: string, limit = 50): Promise<NotificationLog[]> {
    return this.telegramRepo.getLogsByUser(userId, limit)
  }

  /**
   * Get queue items by status.
   */
  async getQueueItems(userId: string, status: NotificationQueueItem['status']): Promise<NotificationQueueItem[]> {
    return this.telegramRepo.getQueueByStatus(userId, status)
  }
}
