import { ref } from 'firebase/storage'

const extractStoragePathFromDownloadUrl = (downloadUrl) => {
  if (!downloadUrl || typeof downloadUrl !== 'string') {
    return null
  }

  try {
    const parsedUrl = new URL(downloadUrl)
    const pathName = parsedUrl.pathname || ''

    // Legacy Firebase format: /v0/b/<bucket>/o/<encodedPath>
    const legacyMarker = '/o/'
    const legacyIndex = pathName.indexOf(legacyMarker)
    if (legacyIndex !== -1) {
      const encodedPath = pathName.slice(legacyIndex + legacyMarker.length)
      if (encodedPath) {
        return decodeURIComponent(encodedPath)
      }
    }

    // Modern format: /<bucket>/<path> (for storage.googleapis.com style links)
    const normalizedPath = pathName.replace(/^\/+/, '')
    const segments = normalizedPath.split('/').filter(Boolean)
    if (segments.length >= 2) {
      return decodeURIComponent(segments.slice(1).join('/'))
    }
  } catch {
    // Not a valid URL, fallback below.
  }

  // Fallback for any old or partially malformed URL containing /o/.
  const objectIndex = downloadUrl.indexOf('/o/')
  if (objectIndex !== -1) {
    const objectStart = objectIndex + '/o/'.length
    const objectAndQuery = downloadUrl.slice(objectStart)
    const [encodedPath] = objectAndQuery.split('?')
    if (encodedPath) {
      return decodeURIComponent(encodedPath)
    }
  }

  return null
}

export const getStorageRefFromUrlOrPath = (storageInstance, urlOrPath) => {
  if (!storageInstance || !urlOrPath) {
    return null
  }

  if (urlOrPath.startsWith('gs://')) {
    return ref(storageInstance, urlOrPath)
  }

  const extractedPath = extractStoragePathFromDownloadUrl(urlOrPath)
  if (extractedPath) {
    return ref(storageInstance, extractedPath)
  }

  return ref(storageInstance, urlOrPath)
}
