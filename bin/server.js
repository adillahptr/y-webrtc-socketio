#!/usr/bin/env node

import ws from 'ws'
import https from 'https'
import * as map from 'lib0/map'
import { readFileSync } from "node:fs";
import { Server } from "socket.io";

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

const pingTimeout = 30000

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000

const key = readFileSync("./bin/key.pem");
const cert = readFileSync("./bin/cert.pem");

const server = https.createServer({key, cert},(request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

const io = new Server(server);

/**
 * Setup a new client
 * @param {any} conn
 */
const onconnection = conn => {
  conn.on('message', /** @param {object} message */ message => {
    if (typeof message === 'string') {
      message = JSON.parse(message)
    }
    if (message && message.type && !closed) {
      switch (message.type) {
        case 'subscribe':
          /** @type {Array<string>} */ (message.topics || []).forEach(topicName => {
            if (typeof topicName === 'string') {
              conn.join(topicName)
            }
          })
          break
        case 'unsubscribe':
          /** @type {Array<string>} */ (message.topics || []).forEach(topicName => {
            conn.leave(topicName)
          })
          break
        case 'publish':
          if (message.topic) {
            io.to(message.topic).emit("message",message)
          }
          break
        case 'ping':
          send(conn, { type: 'pong' })
      }
    }
  })
}

io.on('connection', onconnection)

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
})