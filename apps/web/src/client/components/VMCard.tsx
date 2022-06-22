import type {Status} from 'types'

import {SimpleGrid, Group, Button, Text} from '@mantine/core'
import {setVMCPU, setVMRAM, sendCommand} from '../lib/remoteExec'
import camelToTitle from '../lib/utils'
import {MetricRing, MetricText} from './metrics'

export function VMCard({status, vm}: {status: Status, vm: Status['vms'][number]}) {
	return (
		<>
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
		</>
	)
}
