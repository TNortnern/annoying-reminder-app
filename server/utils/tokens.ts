import { randomBytes } from 'crypto'

export function generateAcknowledgeToken(): string {
  return randomBytes(32).toString('hex')
}
