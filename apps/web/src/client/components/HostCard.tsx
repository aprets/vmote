import type {Status} from 'types'

import {SimpleGrid, Group, Button, Select} from '@mantine/core'
import {useState} from 'react'
import {sendCommand} from '../lib/remoteExec'
import {MetricRing, MetricText} from './metrics'

export default function HostCard({status}: {status: Status}) {
	const [switchScreenInput, setSwitchScreenInout] = useState<'internal' | 'external' | 'clone' | ''>('')
	return (
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
				<Select
					placeholder='Switch Active Screen'
					data={[
						{value: 'internal', label: 'Show on Internal (First)'},
						{value: 'external', label: 'Show on External (Second)'},
						{value: 'clone', label: 'Clone Screens'},
					]}
					value={switchScreenInput}
					onChange={(mode: 'internal' | 'external' | 'clone') => {
						sendCommand({action: 'switchHostDisplay', mode})
					}}
				/>
			</Group>
		</>
	)
}
