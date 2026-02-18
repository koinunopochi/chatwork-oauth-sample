import type { SessionData } from "./types.js"

const sessions = new Map<string, SessionData>()

export function createSession(data: SessionData): string {
  const id = crypto.randomUUID()
  sessions.set(id, data)
  return id
}

export function getSession(id: string): SessionData | undefined {
  return sessions.get(id)
}

export function updateSession(id: string, data: Partial<SessionData>): void {
  const existing = sessions.get(id)
  if (existing) {
    sessions.set(id, { ...existing, ...data })
  }
}

export function deleteSession(id: string): void {
  sessions.delete(id)
}
