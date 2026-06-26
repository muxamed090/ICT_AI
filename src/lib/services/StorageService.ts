import { SupabaseClient } from '@supabase/supabase-js'

export type StorageBucket = 'avatars' | 'trade-screenshots' | 'journal-images'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export interface UploadResult {
  path: string
  publicUrl: string
}

export interface StorageValidationError {
  field: string
  message: string
}

function validateFile(file: File): StorageValidationError | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      field: 'type',
      message: `Invalid file type: ${file.type}. Allowed: PNG, JPEG, WebP.`,
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      field: 'size',
      message: `File too large: ${sizeMb} MB. Maximum: 5 MB.`,
    }
  }

  return null
}

function buildFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${timestamp}_${sanitized}`
}

export class StorageService {
  private readonly supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async upload(
    bucket: StorageBucket,
    userId: string,
    file: File,
  ): Promise<UploadResult> {
    const validationError = validateFile(file)
    if (validationError) {
      throw new Error(validationError.message)
    }

    const path = buildFilePath(userId, file.name)

    const { error: uploadError } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return {
      path,
      publicUrl: urlData.publicUrl,
    }
  }

  async delete(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }

  static validateImageFile(file: File): StorageValidationError | null {
    return validateFile(file)
  }
}
