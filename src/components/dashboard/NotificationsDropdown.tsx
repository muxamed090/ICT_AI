"use client"

import React, { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { Notification } from '@/types/database'
import { markNotificationRead, deleteNotification } from '@/actions/notificationActions'
import { createClient } from '@/lib/supabase/client'

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch notifications on first open
  const fetchNotifications = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (data) {
        setNotifications(data as Notification[])
      }
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (open && !loaded) {
      fetchNotifications()
    }
  }, [open, loaded, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationRead(id)
      if (result.success && result.data) {
        setNotifications((prev) => prev.map((n) => n.id === id ? result.data! : n))
      }
    })
  }

  function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read)
    startTransition(async () => {
      for (const n of unread) {
        const result = await markNotificationRead(n.id)
        if (result.success && result.data) {
          setNotifications((prev) => prev.map((old) => old.id === n.id ? result.data! : old))
        }
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    })
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-white/[0.03] transition-colors"
        aria-label="View notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-3.5 w-3.5 bg-blue-500 text-[7px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
        {unreadCount === 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto glass-panel rounded-xl border border-white/[0.06] shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={isPending}
                className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 font-bold disabled:opacity-40 transition-colors">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {!loaded ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 items-start transition-colors ${!n.read ? 'bg-blue-500/[0.03]' : ''}`}>
                  <div className="pt-1 shrink-0">
                    <div className={`h-2 w-2 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-white/[0.06]'}`} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-[10px] font-bold text-white leading-tight truncate">{n.title}</p>
                    <p className="text-[9px] text-slate-400 leading-snug line-clamp-2">{n.message}</p>
                    <p className="text-[8px] text-slate-600 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n.id)} disabled={isPending}
                        className="text-slate-600 hover:text-blue-400 transition-colors disabled:opacity-30" aria-label="Mark read">
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)} disabled={isPending}
                      className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30" aria-label="Delete notification">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
