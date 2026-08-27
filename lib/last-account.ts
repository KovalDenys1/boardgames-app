import { readLocal, writeLocal } from '@/lib/safe-storage'
const KEY = 'boardly_last_account'

export interface LastAccount {
  email: string
  name: string | null
  image: string | null
}

export function getLastAccount(): LastAccount | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = readLocal(KEY)
    if (!raw) return null
    return JSON.parse(raw) as LastAccount
  } catch {
    return null
  }
}

export function saveLastAccount(data: LastAccount): void {
  writeLocal(KEY, JSON.stringify(data))
}
