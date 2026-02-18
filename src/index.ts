import fs from "node:fs"
import { createServer } from "node:https"
import { serve } from "@hono/node-server"
import app from "./app.js"

const port = Number(process.env.PORT) || 8000

serve({
  fetch: app.fetch,
  port,
  createServer,
  serverOptions: {
    key: fs.readFileSync("certs/server.key"),
    cert: fs.readFileSync("certs/server.crt"),
  },
})

console.log(`Server running at https://127.0.0.1:${port}`)
