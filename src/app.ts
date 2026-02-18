import { Hono } from "hono"
import { getCookie } from "hono/cookie"
import { logger } from "hono/logger"
import { getSession } from "./lib/session.js"
import { apiRoutes } from "./routes/api.js"
import { authRoutes } from "./routes/auth.js"

const app = new Hono()

app.use("*", logger())

app.route("/", authRoutes)
app.route("/api", apiRoutes)

app.get("/", (c) => {
  const sessionId = getCookie(c, "session_id")
  const session = sessionId ? getSession(sessionId) : undefined
  const isAuthenticated = !!session?.accessToken

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chatwork OAuth Sample</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    a { color: #1a73e8; }
    .btn { display: inline-block; padding: 0.5rem 1rem; background: #1a73e8; color: white; text-decoration: none; border-radius: 4px; }
    .btn-danger { background: #dc3545; }
    #result { margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Chatwork OAuth Sample</h1>
  ${
    isAuthenticated
      ? `
    <p>Authenticated</p>
    <p>
      <button class="btn" onclick="fetchRooms()">GET /rooms</button>
      <button class="btn" onclick="fetchMe()">GET /me</button>
      <a href="/logout" class="btn btn-danger">Logout</a>
    </p>
    <pre id="result">Click a button to call the API.</pre>
    <script>
      async function fetchRooms() {
        const res = await fetch('/api/rooms')
        const data = await res.json()
        document.getElementById('result').textContent = JSON.stringify(data, null, 2)
      }
      async function fetchMe() {
        const res = await fetch('/api/me')
        const data = await res.json()
        document.getElementById('result').textContent = JSON.stringify(data, null, 2)
      }
    </script>
  `
      : `
    <p>Not authenticated.</p>
    <a href="/login" class="btn">Login with Chatwork</a>
  `
  }
</body>
</html>`

  return c.html(html)
})

export default app
