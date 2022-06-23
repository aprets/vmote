import type {Status} from 'types'
import {useEffect, useState} from 'react'

import {io} from 'socket.io-client'
import {showError} from './remoteExec'

export function useStatus(): [boolean, Status] {
	const [loading, setLoading] = useState(true)
	const [status, setStatus] = useState<Status>()

	useEffect(() => {
		const socket = io()

		socket.on('connect', () => {
			setLoading(false)
		})

		socket.on('status', (updatedStatus) => {
			setStatus(updatedStatus)
		})

		socket.on('error', (error) => {
			showError(error)
		})

		socket.on('disconnect', () => {
			setLoading(true)
			setStatus(undefined)
		})

		socket.on('agentOffline', () => {
			setStatus(undefined)
		})

		return () => { socket.close() }
	}, [])

	// loading, latestStatus
	return [loading, status as Status]
}
