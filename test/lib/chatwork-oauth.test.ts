import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildAuthorizationUrl,
  exchangeCode,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  refreshAccessToken,
} from "../../src/lib/chatwork-oauth.js"

describe("chatwork-oauth", () => {
  describe("generateCodeVerifier", () => {
    it("returns a URL-safe base64 string", () => {
      const verifier = generateCodeVerifier()
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it("generates different values each time", () => {
      const a = generateCodeVerifier()
      const b = generateCodeVerifier()
      expect(a).not.toBe(b)
    })
  })

  describe("generateCodeChallenge", () => {
    it("returns a URL-safe base64 string", async () => {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it("produces consistent output for the same input", async () => {
      const verifier = "test-verifier-value"
      const a = await generateCodeChallenge(verifier)
      const b = await generateCodeChallenge(verifier)
      expect(a).toBe(b)
    })

    it("produces different output for different input", async () => {
      const a = await generateCodeChallenge("verifier-a")
      const b = await generateCodeChallenge("verifier-b")
      expect(a).not.toBe(b)
    })
  })

  describe("generateState", () => {
    it("returns a UUID format string", () => {
      const state = generateState()
      expect(state).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })
  })

  describe("buildAuthorizationUrl", () => {
    it("builds a correct authorization URL", () => {
      const url = buildAuthorizationUrl({
        clientId: "test-client-id",
        redirectUri: "https://127.0.0.1:8000/callback",
        scope: "rooms.all:read_write",
        state: "test-state",
        codeChallenge: "test-challenge",
      })

      const parsed = new URL(url)
      expect(parsed.origin + parsed.pathname).toBe(
        "https://www.chatwork.com/packages/oauth2/login.php",
      )
      expect(parsed.searchParams.get("response_type")).toBe("code")
      expect(parsed.searchParams.get("client_id")).toBe("test-client-id")
      expect(parsed.searchParams.get("redirect_uri")).toBe("https://127.0.0.1:8000/callback")
      expect(parsed.searchParams.get("scope")).toBe("rooms.all:read_write")
      expect(parsed.searchParams.get("state")).toBe("test-state")
      expect(parsed.searchParams.get("code_challenge")).toBe("test-challenge")
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256")
    })
  })

  describe("exchangeCode", () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it("exchanges code for tokens", async () => {
      const mockResponse = {
        access_token: "test-access-token",
        token_type: "Bearer",
        expires_in: 900,
        refresh_token: "test-refresh-token",
        scope: "rooms.all:read_write",
      }

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      )

      const result = await exchangeCode({
        code: "auth-code",
        redirectUri: "https://127.0.0.1:8000/callback",
        codeVerifier: "test-verifier",
        clientId: "client-id",
        clientSecret: "client-secret",
      })

      expect(result).toEqual(mockResponse)

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toBe("https://oauth.chatwork.com/token")

      const requestInit = fetchCall[1] as RequestInit
      expect(requestInit.method).toBe("POST")
      expect(requestInit.headers).toHaveProperty("Authorization")
    })

    it("throws on error response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: () => Promise.resolve("Bad Request"),
        }),
      )

      await expect(
        exchangeCode({
          code: "bad-code",
          redirectUri: "https://127.0.0.1:8000/callback",
          codeVerifier: "test-verifier",
          clientId: "client-id",
          clientSecret: "client-secret",
        }),
      ).rejects.toThrow("Token exchange failed (400)")
    })
  })

  describe("refreshAccessToken", () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it("refreshes access token", async () => {
      const mockResponse = {
        access_token: "new-access-token",
        token_type: "Bearer",
        expires_in: 900,
        refresh_token: "new-refresh-token",
        scope: "rooms.all:read_write",
      }

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      )

      const result = await refreshAccessToken({
        refreshToken: "old-refresh-token",
        clientId: "client-id",
        clientSecret: "client-secret",
      })

      expect(result).toEqual(mockResponse)
    })
  })
})
