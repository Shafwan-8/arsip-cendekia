import type { LiteratureResult } from './literature'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content?: string
  results?: LiteratureResult[]
  createdAt: number
}
