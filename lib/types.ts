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
	wakeHost: Record<string, unknown>,
	update: Record<string, unknown>,
	shutDownHost: Record<string, unknown>,
	suspendHost: Record<string, unknown>,
	restartHost: Record<string, unknown>,
	restartHostParsec: Record<string, unknown>,
	start: VMIdentification,
	stop: VMIdentification,
	setCPU: VMIdentification & {
		value: number
	},
	setRAM: VMIdentification & {
		value: number
	},
}

export type ActionName = keyof ActionsMap

export type ActionBody<A extends ActionName> = {
	action: A
} & ActionsMap[A]
