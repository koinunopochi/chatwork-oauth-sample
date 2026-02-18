import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import {
  buildAuthorizationUrl,
  exchangeCode,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "../lib/chatwork-oauth.js"
import { createSession, deleteSession, getSession, updateSession } from "../lib/session.js"

const SESSION_COOKIE = "session_id"
const DEFAULT_SCOPE = "rooms.all:read_write users.profile.me:read offline_access"

function getConfig() {
  const clientId = process.env.CHATWORK_CLIENT_ID
  const clientSecret = process.env.CHATWORK_CLIENT_SECRET
  const redirectUri = process.env.CHATWORK_REDIRECT_URI ?? "https://127.0.0.1:8000/callback"
  if (!clientId || !clientSecret) {
    throw new Error("CHATWORK_CLIENT_ID and CHATWORK_CLIENT_SECRET must be set")
  }
  return { clientId, clientSecret, redirectUri }
}

export const authRoutes = new Hono()

authRoutes.get("/login", async (c) => {
  const { clientId, redirectUri } = getConfig()

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  const sessionId = createSession({
    oauthState: {
      state,
      codeVerifier,
      createdAt: Date.now(),
    },
  })

  setCookie(c, SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  })

  const url = buildAuthorizationUrl({
    clientId,
    redirectUri,
    scope: DEFAULT_SCOPE,
    state,
    codeChallenge,
  })

  return c.redirect(url)
})

authRoutes.get("/callback", async (c) => {
  const { clientId, clientSecret, redirectUri } = getConfig()

  const code = c.req.query("code")
  const returnedState = c.req.query("state")

  if (!code || !returnedState) {
    return c.text("Missing code or state parameter", 400)
  }

  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    return c.text("No session found. Please start from /login", 400)
  }

  const session = getSession(sessionId)
  if (!session?.oauthState) {
    return c.text("Invalid session. Please start from /login", 400)
  }

  if (session.oauthState.state !== returnedState) {
    return c.text("State mismatch. Possible CSRF attack.", 400)
  }

  const tokenResponse = await exchangeCode({
    code,
    redirectUri,
    codeVerifier: session.oauthState.codeVerifier,
    clientId,
    clientSecret,
  })

  updateSession(sessionId, {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    oauthState: undefined,
  })

  return c.redirect("/")
})

authRoutes.get("/logout", (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (sessionId) {
    deleteSession(sessionId)
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" })
  return c.redirect("/")
})
