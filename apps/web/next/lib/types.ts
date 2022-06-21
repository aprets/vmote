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
	updateAgent: Record<string, unknown>,
	shutdownHost: Record<string, unknown>,
	suspendHost: Record<string, unknown>,
	restartHost: Record<string, unknown>,
	restartHostParsec: Record<string, unknown>,
	startVM: VMIdentification,
	stopVM: VMIdentification,
	setVMCPU: VMIdentification & {
		value: number
	},
	setVMRAM: VMIdentification & {
		value: number
	},
}

export type ActionName = keyof ActionsMap

export type ActionBody<A extends ActionName> = {
	action: A
} & ActionsMap[A]
