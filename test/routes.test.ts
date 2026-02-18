import { beforeEach, describe, expect, it, vi } from "vitest"
import app from "../src/app.js"

describe("routes", () => {
  describe("GET /", () => {
    it("shows login link when not authenticated", async () => {
      const res = await app.request("/")
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toContain("Login with Chatwork")
      expect(body).toContain("/login")
    })
  })

  describe("GET /login", () => {
    beforeEach(() => {
      vi.stubEnv("CHATWORK_CLIENT_ID", "test-client-id")
      vi.stubEnv("CHATWORK_CLIENT_SECRET", "test-client-secret")
      vi.stubEnv("CHATWORK_REDIRECT_URI", "https://127.0.0.1:8000/callback")
    })

    it("redirects to Chatwork authorization URL", async () => {
      const res = await app.request("/login")
      expect(res.status).toBe(302)
      const location = res.headers.get("Location")
      expect(location).toContain("https://www.chatwork.com/packages/oauth2/login.php")
      expect(location).toContain("response_type=code")
      expect(location).toContain("client_id=test-client-id")
      expect(location).toContain("code_challenge_method=S256")
    })
  })

  describe("GET /callback", () => {
    it("returns 400 when code is missing", async () => {
      const res = await app.request("/callback")
      expect(res.status).toBe(400)
    })

    it("returns 400 when session is missing", async () => {
      const res = await app.request("/callback?code=test&state=test")
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/rooms", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await app.request("/api/rooms")
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toContain("Not authenticated")
    })
  })

  describe("GET /api/me", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await app.request("/api/me")
      expect(res.status).toBe(401)
    })
  })
})
