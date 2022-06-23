import type {Status} from 'types'
import {useEffect, useState} from 'react'

import {io} from 'socket.io-client'

export function useStatus(): [boolean, Status] {
	const [connected, setConnected] = useState(false)
	const [status, setStatus] = useState<Status>()

	useEffect(() => {
		const socket = io()

		socket.on('connect', () => {
			setConnected(true)
		})

		socket.on('status', (updatedStatus) => {
			console.dir(updatedStatus)
			setStatus(updatedStatus)
		})

		socket.on('disconnect', () => {
			setConnected(false)
			setStatus(undefined)
		})

		socket.on('agentOffline', () => {
			setStatus(undefined)
		})

		return () => { socket.close() }
	}, [])

	// loading, latestStatus
	return [!connected, status as Status]
}
