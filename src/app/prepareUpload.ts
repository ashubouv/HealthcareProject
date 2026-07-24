/**
 * Prepare a picked/captured file for upload. Full-resolution phone photos can
 * exceed the vision model's per-image size/dimension limits (and are slow to
 * upload), so downscale images to a sane max edge and re-encode as JPEG. PDFs
 * and anything non-image pass through untouched. Any failure falls back to the
 * original file so the flow never breaks.
 */
const MAX_EDGE = 1600
const SIZE_LIMIT = 4 * 1024 * 1024 // leave small photos alone

export async function prepareUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file // PDFs, etc.
  if (file.type === 'image/gif') return file // may be animated — don't flatten

  try {
    const bitmap = await createImageBitmap(file)
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, MAX_EDGE / longest)

    // Already small enough (and a format Claude accepts) — send as-is.
    if (scale === 1 && file.size <= SIZE_LIMIT && file.type !== 'image/heic' && file.type !== 'image/heif') {
      bitmap.close?.()
      return file
    }

    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) return file

    const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file // e.g. a format the browser can't decode — let the server try
  }
}
