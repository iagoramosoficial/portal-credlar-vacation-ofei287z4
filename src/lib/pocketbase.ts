import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || ''

if (!pbUrl && typeof window !== 'undefined') {
  console.warn('VITE_POCKETBASE_URL is not set')
}

export const pb = new PocketBase(pbUrl)
pb.autoCancellation(false)

export default pb
