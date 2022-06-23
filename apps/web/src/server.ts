import type {ActionName, AgentUnknownActionBody, CheckinRequestBody, Status, UnknownActionBody, UnknownRawActionBody} from 'types'

import http from 'http'
import EventEmitter from 'events'
import path from 'path'

import {Server as SocketioServer} from 'socket.io'
import {v4 as uuidv4} from 'uuid'
import dotenv from 'dotenv'
import express from 'express'
import wol from 'wake_on_lan'
import ah from 'express-async-handler'

dotenv.config({path: '.env.local'})

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001

const eventEmitter = new EventEmitter()

const agentDisconnectActions: ActionName[] = ['shutdownHost', 'suspendHost', 'restartHost']

let actions: AgentUnknownActionBody[] = []

const app = express()
app.use(express.json())

const server = http.createServer(app)

const io = new SocketioServer(server)

let isAgentOnline = false

async function wakeHost() {
	let tries = 0
	while (!isAgentOnline && tries <= 60) {
		tries += 1
		wol.wake(process.env.HOST_MAC_ADDR)
		// eslint-disable-next-line no-await-in-loop
		await new Promise((resolve) => { setTimeout(resolve, 1000) })
	}
	if (!isAgentOnline) {
		io.emit('error', 'Failed to wake host')
	}
}

async function waitAgentOffline() {
	let tries = 0
	while (isAgentOnline && tries <= 60) {
		tries += 1
		// eslint-disable-next-line no-await-in-loop
		await new Promise((resolve) => { setTimeout(resolve, 1000) })
	}
	if (isAgentOnline) {
		io.emit('error', 'The host is still online for an unknown reason')
	}
}

const agentOfflineTimer = setTimeout(() => {
	io.emit('agentOffline')
	isAgentOnline = false
}, 3000)

const logAgentCheckin = () => {
	agentOfflineTimer.refresh()
	isAgentOnline = true
}

app.post('/checkin', (req, res) => {
	logAgentCheckin()

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
		const isUpdateAgent = actionBody.action === 'updateAgent'
		const isWakeHost = actionBody.action === 'wakeHost'
		if (!isWakeHost) {
			actions.push(actionBody)
		} else {
			await wakeHost()
		}

		if (agentDisconnectActions.includes(actionBody.action)) {
			await waitAgentOffline()
		} else if (!isWakeHost && !isUpdateAgent) {
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
	// eslint-disable-next-line no-console
	console.log(`USING HOST MAC=${process.env.HOST_MAC_ADDR}`)
})
