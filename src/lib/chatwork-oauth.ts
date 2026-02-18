import type { ChatworkTokenResponse } from "./types.js"

const AUTHORIZATION_URL = "https://www.chatwork.com/packages/oauth2/login.php"
const TOKEN_URL = "https://oauth.chatwork.com/token"

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64UrlEncode(new Uint8Array(digest))
}

export function generateState(): string {
  return crypto.randomUUID()
}

export function buildAuthorizationUrl(params: {
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
}): string {
  const url = new URL(AUTHORIZATION_URL)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", params.clientId)
  url.searchParams.set("redirect_uri", params.redirectUri)
  url.searchParams.set("scope", params.scope)
  url.searchParams.set("state", params.state)
  url.searchParams.set("code_challenge", params.codeChallenge)
  url.searchParams.set("code_challenge_method", "S256")
  return url.toString()
}

export async function exchangeCode(params: {
  code: string
  redirectUri: string
  codeVerifier: string
  clientId: string
  clientSecret: string
}): Promise<ChatworkTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  })

  const credentials = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64")

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${errorBody}`)
  }

  return (await res.json()) as ChatworkTokenResponse
}

export async function refreshAccessToken(params: {
  refreshToken: string
  clientId: string
  clientSecret: string
}): Promise<ChatworkTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  })

  const credentials = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64")

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${errorBody}`)
  }

  return (await res.json()) as ChatworkTokenResponse
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
