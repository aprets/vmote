export interface Status {
	cores: number,
	cpuUsage: number,
	ramUsage: number,
	activeRam: number,
	totalRam: number,
	gpuUsage: number,
	vramUsage: number,
	vms: {
		name: string,
		id: string,
		state: string,
		cpuUsage: number,
		processorCount: number,
		uptime: string,
		ram: number,
		ramUsage: number,
		activeRam: number,
		totalRam: number,
	}[]
}

type VMIdentification = {
	vmName: string
}

interface ActionsMap {
	shutDownHost: Record<string, unknown>,
	setCPU: VMIdentification & {
		value: number
	},
	other: {
		a: number[]
	}
}

export type ActionName = keyof ActionsMap

export type ActionBody<A extends ActionName> = {
	action: A
} & ActionsMap[A]

const test = <A extends ActionName>(o: ActionBody<A>) => {}

test({
	action: 'shutDownHost',
})

type AgentCommand = 'shutdownHost' | 'suspendHost' | 'restartHost' | 'restartHostParsec' | 'setCPU' | 'setRAM' | 'update' | 'start' | 'stop'
