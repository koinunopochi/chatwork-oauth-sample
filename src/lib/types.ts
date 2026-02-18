export interface ChatworkTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

export interface ChatworkRoom {
  room_id: number
  name: string
  type: "my" | "direct" | "group"
  role: "admin" | "member" | "readonly"
  sticky: boolean
  unread_num: number
  mention_num: number
  mytask_num: number
  message_num: number
  file_num: number
  task_num: number
  icon_path: string
  last_update_time: number
}

export interface OAuthState {
  state: string
  codeVerifier: string
  createdAt: number
}

export interface SessionData {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  oauthState?: OAuthState
}

export class ChatworkApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Chatwork API error: ${status}`)
    this.name = "ChatworkApiError"
  }
}
