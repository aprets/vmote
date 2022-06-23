import type {ActionName, CheckinRequestBody, Status, UnknownActionBody, UnknownRawActionBody} from 'types'

import http from 'http'
import EventEmitter from 'events'
import path from 'path'

import {Server as SocketioServer} from 'socket.io'
import {v4 as uuidv4} from 'uuid'
import ping from 'ping'
import dotenv from 'dotenv'
import express from 'express'
import wol from 'wake_on_lan'
import ah from 'express-async-handler'

dotenv.config({path: '.env.local'})

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001

const eventEmitter = new EventEmitter()

const noResponseActions: ActionName[] = ['wakeHost', 'shutdownHost', 'suspendHost', 'restartHost', 'updateAgent']

let actions: UnknownActionBody[] = []

const app = express()
app.use(express.json())

const server = http.createServer(app)

const io = new SocketioServer(server)

async function wakeHost(uuid: string) {
	console.log(`waking up host ${process.env.HOST_ADDR}`)
	let tries = 0
	let alive = false
	while (!alive && tries <= 25) {
		console.log(`try ${tries}`)
		tries += 1
		wol.wake(process.env.HOST_MAC_ADDR)
		// eslint-disable-next-line no-await-in-loop
		const r = await ping.promise.probe(process.env.HOST_ADDR)
		alive = r.alive
	}
	console.dir({uuid, alive})
	eventEmitter.emit(uuid)
	if (!alive) {
		io.emit('error', 'Failed to wake host')
	}
}

const agentOfflineTimer = setTimeout(() => io.emit('agentOffline'), 3000)

io.on('connection', (socket) => {
	socket.on('disconnect', () => {
		console.log('client disconnected')
	})
})

app.post('/checkin', (req, res) => {
	agentOfflineTimer.refresh()

	const {status, completedIds, errors}: CheckinRequestBody = req.body
	io.emit('status', status)

	completedIds.forEach((uuid) => {
		eventEmitter.emit(uuid)
	})
	errors.forEach((error) => {
		io.emit('error', error)
	})

	res.json(actions)
	actions = []
})

app.post('/execute', ah(async (req, res) => {
	const uuid = uuidv4()
	const actionBody = {uuid, ...req.body as UnknownRawActionBody}
	try {
		if (actionBody.action !== 'wakeHost') {
			actions.push(actionBody)
		} else {
			wakeHost(uuid)
		}

		if (!noResponseActions.includes(actionBody.action)) {
			await new Promise((resolve) => {
				eventEmitter.on(uuid, resolve)
			})
		}
	} catch {
		res.status(500).send()
	}
	res.send()
}))

app.use(express.static('dist/client'))

// Handle client routing, return all requests to the app
app.get('*', (_req, res) => {
	res.sendFile(path.join(__dirname, 'client/index.html'))
})

server.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`> Ready on http://localhost:${port}`)
})
