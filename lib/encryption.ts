/**
 * Client-side encryption using Web Crypto API
 * 
 * Security model:
 * - Uses AES-GCM for authenticated encryption
 * - Each session gets a unique encryption key
 * - Key is stored in the share URL (fragment), never sent to server
 * - Server only sees encrypted data
 * - Even if database is compromised, data remains encrypted
 */

// Generate a random encryption key
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(exportedKey)
}

// Encrypt text with a key
export async function encryptText(text: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64)
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encryptedData), iv.length)
  
  return arrayBufferToBase64(combined.buffer)
}

// Decrypt text with a key
export async function decryptText(encryptedBase64: string, keyBase64: string): Promise<string> {
  try {
    const key = await importKey(keyBase64)
    const combined = base64ToArrayBuffer(encryptedBase64)
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encryptedData = combined.slice(12)
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Unable to decrypt data. The encryption key may be invalid.')
  }
}

// Import a base64 key string to CryptoKey
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyBase64)
  return crypto.subtle.importKey(
    'raw',
    keyBuffer.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Helper: ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper: base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Encrypt sensitive response data
export async function encryptResponseData(data: {
  situation: string
  feelings: string
  emotions: string[]
}, keyBase64: string): Promise<{
  situation_encrypted: string
  feelings_encrypted: string
  emotions_encrypted: string
}> {
  return {
    situation_encrypted: await encryptText(data.situation, keyBase64),
    feelings_encrypted: await encryptText(data.feelings, keyBase64),
    emotions_encrypted: await encryptText(JSON.stringify(data.emotions), keyBase64)
  }
}

// Decrypt response data
export async function decryptResponseData(data: {
  situation_encrypted: string
  feelings_encrypted: string
  emotions_encrypted: string
}, keyBase64: string): Promise<{
  situation: string
  feelings: string
  emotions: string[]
}> {
  return {
    situation: await decryptText(data.situation_encrypted, keyBase64),
    feelings: await decryptText(data.feelings_encrypted, keyBase64),
    emotions: JSON.parse(await decryptText(data.emotions_encrypted, keyBase64))
  }
}

