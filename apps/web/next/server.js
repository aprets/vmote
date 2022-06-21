/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express')
const http = require('http')
const EventEmitter = require('events')
const next = require('next')
const socketio = require('socket.io')
const {v4: uuidv4} = require('uuid')
const wol = require('wake_on_lan')
const {ping} = require('@network-utils/tcp-ping')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({dev})
const nextHandle = nextApp.getRequestHandler()
const eventEmitter = new EventEmitter()

let actions = []

async function wakeHost(uuid) {
	console.log('waking up host!')
	let tries = 0
	let alive = false
	while (!alive && tries <= 100) {
		tries += 1
		wol.wake(process.env.HOST_MAC_ADDR)
		// eslint-disable-next-line no-await-in-loop
		const r = await ping({address: process.env.NEXT_PUBLIC_HOST_ADDR, attempts: 1, port: 80, timeout: 1000})
		alive = r.minimumLatency < Infinity
	}
	eventEmitter.emit(uuid, !alive)
}

nextApp.prepare().then(() => {
	const app = express()
	app.use(express.json())

	const server = http.createServer(app)

	const io = socketio(server)
	const agentTimeout = () => io.emit('agentOffline')
	const agentOfflineTimer = setTimeout(agentTimeout, 3000)

	io.on('connection', (socket) => {
		socket.on('disconnect', () => {
			console.log('client disconnected')
		})
	})

	// POST method route
	app.post('/status', (req, res) => {
		const {status, completedActions, failedActions} = req.body
		agentOfflineTimer.refresh()
		io.emit('status', status)

		completedActions.forEach((uuid) => {
			eventEmitter.emit(uuid)
		})
		failedActions.forEach((uuid) => {
			eventEmitter.emit(uuid, true)
		})

		res.json(actions)
		actions = []
	})

	app.post('/execute', async (req, res) => {
		const uuid = uuidv4()
		const action = {uuid, ...req.body}
		try {
			if (action.action !== 'wakeHost') {
				actions.push(action)
			} else {
				wakeHost(uuid)
			}

			await new Promise((resolve, reject) => {
				eventEmitter.on(uuid, (didError) => {
					if (didError) { reject() } else { resolve() }
				})
			})
		} catch {
			res.status(500).send()
		}
		res.send()
	})

	app.all('*', (req, res) => nextHandle(req, res))

	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`)
	})
})
