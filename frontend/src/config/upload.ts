export const ACCEPTED_MIME_TYPES_AND_EXTENSIONS: string[] = [
  // MIME types
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/tiff',
  'application/pdf',

  // File extensions
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.tif',
  '.tiff',
  '.pdf',
]

function getMaxUploadBytes(): number {
  const env = (import.meta as unknown as { env?: { VITE_MAX_UPLOAD_MB?: string } }).env
  const fromEnv: string | undefined = env?.VITE_MAX_UPLOAD_MB

  const mb: number = Number.parseFloat(fromEnv ?? '25')
  const safeMb: number = Number.isFinite(mb) && mb > 0 ? mb : 25
  return Math.floor(safeMb * 1024 * 1024)
}

export const MAX_FILE_SIZE_BYTES: number = getMaxUploadBytes()
