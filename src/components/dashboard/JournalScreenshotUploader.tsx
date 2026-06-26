"use client"

import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { uploadScreenshot } from '@/actions/storageActions'
import { StorageService } from '@/lib/services/StorageService'

interface JournalScreenshotUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
}

export default function JournalScreenshotUploader({ value, onChange }: JournalScreenshotUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    // Client-side validation before hitting the server
    const validationError = StorageService.validateImageFile(file)
    if (validationError) {
      setError(validationError.message)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('bucket', 'trade-screenshots')

      const result = await uploadScreenshot(formData)
      if (result.success && result.data) {
        onChange(result.data.publicUrl)
      } else {
        setError(result.error?.message ?? 'Upload failed.')
      }
    } catch {
      setError('An unexpected error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        Screenshot
      </label>

      {value ? (
        /* Preview */
        <div className="relative group rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Trade screenshot"
            className="w-full h-40 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove screenshot"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed transition-all ${
            dragOver
              ? 'border-blue-500/60 bg-blue-500/5'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
          } ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-[10px] text-blue-400 font-semibold">Uploading…</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <Upload className="h-4 w-4 text-slate-500" />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                Drop image or click to browse
              </span>
              <span className="text-[8px] text-slate-600 font-mono">
                PNG, JPEG, WebP · Max 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
