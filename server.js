/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express')
const next = require('next')
const socketio = require('socket.io')
const http = require('http')
const EventEmitter = require('events')
const {v4: uuidv4} = require('uuid')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({dev})
const nextHandle = nextApp.getRequestHandler()
const eventEmitter = new EventEmitter()

let actions = []

nextApp.prepare().then(() => {
	const app = express()
	app.use(express.json())

	const server = http.createServer(app)

	const io = socketio(server)

	io.on('connection', (socket) => {
		socket.on('disconnect', () => {
			console.log('client disconnected')
		})
	})

	// POST method route
	app.post('/status', (req, res) => {
		const {status, completedActions, failedActions} = req.body
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
		actions.push(action)

		try {
			await new Promise((resolve, reject) => {
				eventEmitter.on(uuid, (didError) => {
					if (didError) { reject() } else { resolve() }
				})
			})
		} catch {
			res.status(500).send()
		}
		// wait until complete
		res.send()
	})

	app.all('*', (req, res) => nextHandle(req, res))

	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`)
	})
})
