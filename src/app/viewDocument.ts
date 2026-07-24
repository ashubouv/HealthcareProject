import { getToken } from '../api/client'
import { ApiError } from '../api/client'

/**
 * Open a saved original file (PDF or image) for viewing. The tab is opened
 * synchronously inside the click gesture so popup blockers don't kill it, then
 * pointed at a real URL carrying a short-lived one-time ticket. A real URL (not
 * a blob in an iframe) hands the file to the browser's NATIVE viewer — which on
 * phones is the only way multi-page PDFs show every page.
 */
export async function viewDocument(documentId: string): Promise<void> {
  const tab = window.open('', '_blank')
  try {
    const token = getToken()
    const res = await fetch(`/api/documents/${documentId}/ticket`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new ApiError(body.error || res.statusText, res.status)
    }
    const { ticket } = (await res.json()) as { ticket: string }
    const url = `/api/documents/${documentId}/file?t=${ticket}`
    if (tab) tab.location.href = url
    else window.open(url, '_blank')
  } catch (err) {
    tab?.close()
    throw err
  }
}
