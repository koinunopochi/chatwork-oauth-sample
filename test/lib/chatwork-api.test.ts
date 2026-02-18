import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatworkApiClient } from "../../src/lib/chatwork-api.js"
import { ChatworkApiError } from "../../src/lib/types.js"

describe("ChatworkApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("getRooms", () => {
    it("calls GET /rooms with bearer token", async () => {
      const mockRooms = [
        { room_id: 1, name: "Test Room", type: "group" },
        { room_id: 2, name: "Direct Chat", type: "direct" },
      ]

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockRooms),
        }),
      )

      const client = new ChatworkApiClient("test-token")
      const rooms = await client.getRooms()

      expect(rooms).toEqual(mockRooms)

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toBe("https://api.chatwork.com/v2/rooms")
      const headers = (fetchCall[1] as RequestInit).headers as Record<string, string>
      expect(headers.Authorization).toBe("Bearer test-token")
    })
  })

  describe("getMe", () => {
    it("calls GET /me with bearer token", async () => {
      const mockMe = { account_id: 123, name: "Test User" }

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockMe),
        }),
      )

      const client = new ChatworkApiClient("test-token")
      const me = await client.getMe()

      expect(me).toEqual(mockMe)

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toBe("https://api.chatwork.com/v2/me")
    })
  })

  describe("error handling", () => {
    it("throws ChatworkApiError on non-200 response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ errors: ["Invalid token"] }),
        }),
      )

      const client = new ChatworkApiClient("bad-token")

      try {
        await client.getRooms()
        expect.unreachable("Should have thrown")
      } catch (e) {
        expect(e).toBeInstanceOf(ChatworkApiError)
        expect((e as ChatworkApiError).status).toBe(401)
      }
    })
  })
})
