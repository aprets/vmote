/* eslint-disable @typescript-eslint/ban-types */
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
	wakeHost: {},
	shutdownHost: {},
	suspendHost: {},
	restartHost: {},
	restartHostParsec: {},
	updateAgent: {
		zipUrl: string,
		zipPath: string,
	},
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

export type AgentActionName = Exclude<ActionName, 'wakeHost'>

export type RawActionBody<A extends ActionName> = {
	action: A
} & ActionsMap[A]

export type ActionBody<A extends ActionName> = {
	uuid: string
} & RawActionBody<A>

export type UnknownRawActionBody = RawActionBody<ActionName>

export type UnknownActionBody = ActionBody<ActionName>

export type AgentUnknownActionBody = ActionBody<AgentActionName>

export type AgentActionHandlerMap = {
	[k in AgentActionName]: (actionBody: ActionBody<k>) => Promise<void | string>
}
