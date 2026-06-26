import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileRepository } from '@/lib/repositories/ProfileRepository'
import PageTitle from '@/components/widgets/PageTitle'
import ProfileForm from '@/components/dashboard/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRepo = new ProfileRepository(supabase)
  let profile = await profileRepo.getById(user.id)

  if (!profile) {
    profile = await profileRepo.create({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Trader',
      avatar_url: null,
      timezone: 'UTC',
      language: 'en',
    })
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Profile"
        subtitle="Manage your trading identity, timezone preferences, and account information."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar & Info */}
        <div className="glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6 flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold ring-4 ring-blue-500/20 uppercase">
            {profile.full_name ? profile.full_name.charAt(0) : profile.email?.charAt(0) ?? 'U'}
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white">{profile.full_name ?? 'Unnamed Trader'}</p>
            <p className="text-[10px] text-slate-500 font-mono">{profile.email}</p>
          </div>

          <div className="w-full space-y-2 pt-4 border-t border-white/[0.04]">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Timezone</span>
              <span className="text-slate-300 font-mono">{profile.timezone}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Language</span>
              <span className="text-slate-300 font-mono">{profile.language.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Member Since</span>
              <span className="text-slate-300 font-mono">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Last Updated</span>
              <span className="text-slate-300 font-mono">{new Date(profile.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-white/[0.04] bg-slate-950/20 p-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Edit Profile</p>
          <ProfileForm profile={profile} />
        </div>
      </div>
    </div>
  )
}
