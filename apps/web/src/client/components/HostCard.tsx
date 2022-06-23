import type {Status} from 'types'

import {SimpleGrid, Group, Button} from '@mantine/core'
import {sendCommand} from '../lib/remoteExec'
import {MetricRing, MetricText} from './metrics'

export default function HostCard({status}: {status: Status}) {
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
			</Group>
		</>
	)
}
