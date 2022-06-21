import {useEffect, useRef, useState} from 'react'

import {MdOutlinePowerSettingsNew} from 'react-icons/md'

import {Title, Text, Container, Card, RingProgress, SimpleGrid, Box, Group, Button, Skeleton, ActionIcon} from '@mantine/core'

import {io, Socket} from 'socket.io-client'

import {Status} from '../lib/types'
import {setVMCPU, setVMRAM, sendCommand, wakeHost} from '../lib/remoteExec'
import camelToTitle from '../lib/utils'

function MetricRing({label, value}: {label: string, value: number}) {
	return (
		<Group position='center' direction='column' spacing='xs'>
			<Text color='blue' weight={500} align='center' size='md' mb={-20}>
				{label}
			</Text>

			<RingProgress
				sections={[{value, color: 'blue'}]}
				label={(
					<Text color='blue' weight={700} align='center' size='xl'>
						{value}%
					</Text>
				)}
			/>
		</Group>
	)
}

function MetricText({label, value}: {label: string, value: string | number}) {
	return (
		<Group position='center' direction='column' spacing='xs'>
			<Text color='blue' weight={500} align='center' size='md' mb={-20}>
				{label}
			</Text>
			<Box sx={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
				<Text color='blue' weight={700} align='center' size='xl'>
					{value}
				</Text>
			</Box>
		</Group>
	)
}

export default function HomePage(): React.ReactElement {
	const [connected, setConnected] = useState(false)
	const [status, setStatus] = useState<Status>()
	const socketRef = useRef<Socket>()

	useEffect(() => {
		const socket = io()
		socketRef.current = socket

		socket.on('connect', () => {
			setConnected(true)
		})

		socket.on('status', (updatedStatus) => {
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

	console.log(status)

	const reconnectSocket = () => {
		socketRef.current?.disconnect()
		socketRef.current?.connect()
	}

	return (
		<>
			<Title sx={{fontSize: 30, fontWeight: 300}} align='center' mt={10}>
				VMote
				<Text inherit variant='gradient' component='span' sx={{verticalAlign: 'super', fontSize: 20, letterSpacing: 0}}>
					Beta
				</Text>

			</Title>
			<Container mt='xl'>

				<Card
					shadow='sm'
					padding='xl'
				>
					<Text weight={500} size='xl' mb={10}>
						Host (
						{connected && status && <Text inherit color='green' component='span'>Running</Text>}
						{(!connected || !status) && <Text inherit color='red' component='span'>Offline</Text>}
						)
					</Text>

					{status && (
						<>
							<SimpleGrid cols={5} spacing='xs'>
								<MetricRing label='CPU Usage' value={status.cpuUsage} />
								<MetricRing label='RAM Usage' value={status.ramUsage} />
								<MetricText label='RAM Amount' value={`${status.activeRam} / ${status.totalRam} GB`} />
								<MetricRing label='GPU Usage' value={status.gpuUsage} />
								<MetricRing label='VRAM Usage' value={status.vramUsage} />
							</SimpleGrid>
							<Group position='left' spacing='xs' mt={10}>
								<Button variant='light' color='red' onClick={() => { sendCommand({action: 'restartHostParsec'}) }}>
									Restart Host Parsec
								</Button>
								<Button variant='light' color='red' onClick={() => { sendCommand({action: 'suspendHost'}) }}>
									Suspend Host
								</Button>
								<Button variant='light' color='red' onClick={() => { sendCommand({action: 'restartHost'}) }}>
									Restart Host
								</Button>
								<Button variant='light' color='red' onClick={() => { sendCommand({action: 'shutdownHost'}) }}>
									Shutdown Host
								</Button>
								<Button variant='light' color='blue' onClick={() => { sendCommand({action: 'updateAgent'}) }}>
									Update Repo
								</Button>
								<Button variant='light' color='grape' component='a' href={process.env.NEXT_PUBLIC_HOST_PARSEC_URL} target='_blank'>
									Open In Parsec
								</Button>
							</Group>
						</>
					)}

					{connected && !status && (
						<Skeleton height={200} />
					)}

					{(!connected || !status) && (
						<Group direction='column' align='center'>
							<ActionIcon
								size={100}
								variant='transparent'
								onClick={() => { wakeHost().then(reconnectSocket) }}
							>
								<MdOutlinePowerSettingsNew size='100px' color='#f03e3e' />
							</ActionIcon>
						</Group>
					)}

				</Card>

				{connected && !status && (
					<Skeleton height='100vh' mt={10} />
				)}

				{status && status.vms && (
					<>
						{status.vms.map((vm) => (

							<Card
								shadow='sm'
								padding='xl'
								mt={10}
								key={vm.id}
							>

								<Text weight={500} size='xl' mb={10}>
									{vm.name}{' '}
									(
									<Text inherit variant='link' component='span' sx={{cursor: 'pointer'}} onClick={() => { setVMCPU(vm.name, vm.processorCount, status.cores) }}>{vm.processorCount}CPU</Text>,{' '}
									<Text inherit variant='link' component='span' sx={{cursor: 'pointer'}} onClick={() => { setVMRAM(vm.name, vm.ram, status.totalRam) }}>{vm.ram}GB RAM</Text>
									)
								</Text>

								{vm.state === 'Running' && (
									<SimpleGrid cols={4} spacing='xs'>
										<MetricRing label='CPU Usage' value={vm.cpuUsage} />
										<MetricRing label='RAM Usage' value={vm.ramUsage} />
										<MetricText label='RAM Amount' value={`${vm.activeRam} / ${vm.totalRam} GB`} />
										<MetricText label='Uptime' value={vm.uptime} />
									</SimpleGrid>
								)}

								{vm.state !== 'Running' && (
									<Text color='red'>{camelToTitle(vm.state)}</Text>
								)}

								<Group position='left' spacing='xs' mt={10}>
									<Button variant='light' color='green' onClick={() => { sendCommand({action: 'startVM', vmName: vm.name}) }}>
										Start
									</Button>
									<Button variant='light' color='red' onClick={() => { sendCommand({action: 'stopVM', vmName: vm.name}) }}>
										Stop
									</Button>
								</Group>

							</Card>

						))}
					</>
				)}
			</Container>
		</>
	)
}
