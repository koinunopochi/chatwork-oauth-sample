import type { ChatworkRoom } from "./types.js"
import { ChatworkApiError } from "./types.js"

const BASE_URL = "https://api.chatwork.com/v2"

export class ChatworkApiClient {
  constructor(private accessToken: string) {}

  async getRooms(): Promise<ChatworkRoom[]> {
    return this.request<ChatworkRoom[]>("/rooms")
  }

  async getMe(): Promise<unknown> {
    return this.request("/me")
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options?.headers,
      },
    })

    if (!res.ok) {
      let body: unknown
      try {
        body = await res.json()
      } catch {
        body = await res.text()
      }
      throw new ChatworkApiError(res.status, body)
    }

    return (await res.json()) as T
  }
}
