import crypto from 'crypto'

export class SecurityService {
  private static ALGORITHM = 'aes-256-gcm'
  private static KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || 'ICT-TRADER-SECRET-DEFAULT-KEY-32BYTES')
    .digest()

  /**
   * Encrypts a record structure using AES-256-GCM.
   * Returns a colon-separated string: "iv:ciphertext:tag"
   */
  static encrypt(data: Record<string, string>): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv) as crypto.CipherGCM
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag().toString('hex')
    
    return `${iv.toString('hex')}:${encrypted}:${tag}`
  }

  /**
   * Decrypts an encrypted credential string using AES-256-GCM.
   */
  static decrypt(encryptedPayload: string): Record<string, string> {
    try {
      const parts = encryptedPayload.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload structure.')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const ciphertext = parts[1]
      const tag = Buffer.from(parts[2], 'hex')

      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv) as crypto.DecipherGCM
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return JSON.parse(decrypted)
    } catch (err) {
      throw new Error(`Credential decryption failure: ${(err as Error).message}`)
    }
  }
}
