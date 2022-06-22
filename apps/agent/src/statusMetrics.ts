import os from 'os'

import 'loadavg-windows'
import humanizeDuration from 'humanize-duration'
import {PowerShell} from 'node-powershell'

import {hypervVMStates, getWindowsNvidiaSmiPath} from './utils'

const nvidiaSmiPath = getWindowsNvidiaSmiPath()

let ps: PowerShell

if (process.platform === 'win32') {
	ps = new PowerShell({
		executableOptions: {
			'-ExecutionPolicy': 'Bypass',
			'-NoProfile': true,
		},
	})
	ps.invoke('echo started')
} else {
	// eslint-disable-next-line no-console
	console.warn('WARNING Metrics can only be collected on Windows, using undefined instead')
}

async function runPS(psCommand: string) {
	const result = await ps.invoke(psCommand)
	return result.raw
}

async function runJPS(psCommand: string) {
	return JSON.parse(await runPS(psCommand))
}

const cores = os.cpus().length

let currentPowerPlan: string

export async function calculateStatus() {
	if (process.platform !== 'win32') {
		return undefined
	}

	const cpuUsage = Math.round((os.loadavg()[0] * 100) / cores)

	const ramUsage = Math.round(100 - ((os.freemem() / os.totalmem()) * 100))
	const activeRam = Math.round((os.totalmem() - os.freemem()) / (1024 ** 3 * 10)) / 10
	const totalRam = Math.round((os.totalmem()) / (1024 ** 3 * 10)) / 10

	const [rawTotalVRAM, rawFreeVRAM, rawGPUUsage] = (await runPS(`${nvidiaSmiPath} --query-gpu=memory.total,memory.free,utilization.gpu --format=csv,noheader,nounits`)).split(', ')

	const gpuUsage = parseInt(rawGPUUsage, 10)
	const vramUsage = Math.round(100 - (parseInt(rawFreeVRAM, 10) / (parseInt(rawTotalVRAM, 10) * 100)))

	const rawPsOutput = await runJPS('Get-VM | Select Name,Id,State,Uptime,CPUUsage,MemoryAssigned,MemoryDemand,ProcessorCount,MemoryStartup | sort Name | ConvertTo-Json')

	const psOutput = Array.isArray(rawPsOutput) ? rawPsOutput : [rawPsOutput]
	const vms = psOutput.map(
		(rawVm) => ({
			name: rawVm.Name,
			id: rawVm.Id,
			state: hypervVMStates[rawVm.State - 1],
			cpuUsage: rawVm.cpuUsage,
			uptime: humanizeDuration(rawVm.Uptime.TotalMilliseconds, {round: true}),
			processorCount: rawVm.processorCount,
			ram: Math.round(rawVm.MemoryStartup / (1024 ** 3 * 10)) / 10,
			ramUsage: Math.round((rawVm.MemoryDemand / rawVm.MemoryAssigned) * 100) || 0,
			activeRam: Math.round(rawVm.MemoryDemand / (1024 ** 3 * 10)) / 10,
			totalRam: Math.round(rawVm.MemoryAssigned / (1024 ** 3 * 10)) / 10,

		}),
	)

	const hasActiveVMs = vms.some((vm) => !['Off', 'Paused'].includes(vm.state))
	const desiredPowerPlan = hasActiveVMs ? process.env.NORMAL_POWER_PLAN_GUID : process.env.SLEEPY_POWER_PLAN_GUID
	if (desiredPowerPlan !== currentPowerPlan) runPS(`powercfg /S ${desiredPowerPlan}`)

	return {
		cores,
		cpuUsage,
		ramUsage,
		activeRam,
		totalRam,
		gpuUsage,
		vramUsage,
		vms,
	}
}
