import { customAlphabet } from 'nanoid'

// Generate 6-character alphanumeric codes
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

export function generateLobbyCode(): string {
  return nanoid()
}
