import { Hono } from "hono"
import { getCookie } from "hono/cookie"
import { ChatworkApiClient } from "../lib/chatwork-api.js"
import { refreshAccessToken } from "../lib/chatwork-oauth.js"
import { getSession, updateSession } from "../lib/session.js"

const SESSION_COOKIE = "session_id"

function getConfig() {
  const clientId = process.env.CHATWORK_CLIENT_ID
  const clientSecret = process.env.CHATWORK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("CHATWORK_CLIENT_ID and CHATWORK_CLIENT_SECRET must be set")
  }
  return { clientId, clientSecret }
}

async function getAccessToken(sessionId: string): Promise<string | null> {
  const session = getSession(sessionId)
  if (!session?.accessToken || !session.refreshToken) {
    return null
  }

  if (session.expiresAt && session.expiresAt < Date.now()) {
    const { clientId, clientSecret } = getConfig()
    const tokenResponse = await refreshAccessToken({
      refreshToken: session.refreshToken,
      clientId,
      clientSecret,
    })

    updateSession(sessionId, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    })

    return tokenResponse.access_token
  }

  return session.accessToken
}

export const apiRoutes = new Hono()

apiRoutes.use("*", async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    return c.json({ error: "Not authenticated. Visit /login to authorize." }, 401)
  }

  const accessToken = await getAccessToken(sessionId)
  if (!accessToken) {
    return c.json({ error: "Not authenticated. Visit /login to authorize." }, 401)
  }

  c.set("chatworkClient" as never, new ChatworkApiClient(accessToken))
  await next()
})

apiRoutes.get("/rooms", async (c) => {
  const client = c.get("chatworkClient" as never) as ChatworkApiClient
  const rooms = await client.getRooms()
  return c.json(rooms)
})

apiRoutes.get("/me", async (c) => {
  const client = c.get("chatworkClient" as never) as ChatworkApiClient
  const me = await client.getMe()
  return c.json(me)
})
