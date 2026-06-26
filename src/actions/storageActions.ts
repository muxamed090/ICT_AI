"use server"

import { createClient } from '@/lib/supabase/server'
import { StorageService, StorageBucket } from '@/lib/services/StorageService'
import { ActionResult } from '@/lib/services/types'
import { handleActionError } from '@/lib/services/errorHandler'

interface UploadResponse {
  path: string
  publicUrl: string
}

export async function uploadScreenshot(formData: FormData): Promise<ActionResult<UploadResponse>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: { type: 'validation', message: 'No file provided.' } }
    }

    const bucketName = (formData.get('bucket') as string | null) ?? 'trade-screenshots'
    const bucket = bucketName as StorageBucket

    const storageService = new StorageService(supabase)
    const result = await storageService.upload(bucket, user.id, file)

    return { success: true, data: result }
  } catch (err) {
    return handleActionError<UploadResponse>(err)
  }
}

export async function deleteStorageFile(bucket: StorageBucket, path: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: { type: 'auth', message: 'Unauthorized. User session not found.' } }
    }

    const storageService = new StorageService(supabase)
    await storageService.delete(bucket, path)

    return { success: true }
  } catch (err) {
    return handleActionError<void>(err)
  }
}
