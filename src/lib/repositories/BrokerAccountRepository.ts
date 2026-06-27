import { SupabaseClient } from '@supabase/supabase-js'
import { BrokerAccount, Database } from '@/types/database'
import { SecurityService } from '@/lib/services/broker/SecurityService'

type BrokerAccountInsert = Database['public']['Tables']['broker_accounts']['Insert']

export class BrokerAccountRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAll(userId: string): Promise<BrokerAccount[]> {
    const { data, error } = await this.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as BrokerAccount[]
  }

  async getById(id: string): Promise<BrokerAccount | null> {
    const { data, error } = await this.supabase
      .from('broker_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as BrokerAccount | null
  }

  async getActive(userId: string): Promise<BrokerAccount | null> {
    const { data, error } = await this.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data as BrokerAccount | null
  }

  async create(
    userId: string,
    input: Omit<BrokerAccountInsert, 'user_id' | 'encrypted_credentials'> & {
      credentials: Record<string, string>
    }
  ): Promise<BrokerAccount> {
    const encrypted = SecurityService.encrypt(input.credentials)

    const insertPayload: BrokerAccountInsert = {
      ...input,
      user_id: userId,
      encrypted_credentials: encrypted,
    }

    const { data, error } = await this.supabase
      .from('broker_accounts')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error
    return data as BrokerAccount
  }

  async setActive(userId: string, accountId: string): Promise<void> {
    // First deactivate all
    await this.supabase
      .from('broker_accounts')
      .update({ is_active: false })
      .eq('user_id', userId)

    // Then activate the selected one
    const { error } = await this.supabase
      .from('broker_accounts')
      .update({ is_active: true })
      .eq('id', accountId)
      .eq('user_id', userId)

    if (error) throw error
  }

  async updateConnectionStatus(
    id: string,
    status: 'connected' | 'disconnected' | 'error',
    accountData?: { balance?: number; equity?: number; margin_used?: number; free_margin?: number }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('broker_accounts')
      .update({
        connection_status: status,
        last_ping_at: new Date().toISOString(),
        ...accountData,
      })
      .eq('id', id)

    if (error) throw error
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('broker_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }
}
