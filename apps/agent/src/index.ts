import type {AgentActionHandlerMap, AgentUnknownActionBody, CheckinRequestBody} from 'types'

import dotenv from 'dotenv'

import {performance} from 'perf_hooks'

import axios from 'axios'

import {PowerShell} from 'node-powershell'

import {calculateStatus} from './statusMetrics'
import {startUpdate} from './updater'

dotenv.config({path: '.env.local'})

const runOneOffPowerShell = (command: string) => PowerShell.invoke(command, {executableOptions: {'-ExecutionPolicy': 'Bypass', '-NoProfile': true}})

let completedIds: string[] = []
let errors: string[] = []

const actionHandlers: AgentActionHandlerMap = {
	updateAgent: async ({zipUrl, zipPath}) => {
		await startUpdate(zipUrl, zipPath)
	},
	shutdownHost: async () => {
		await runOneOffPowerShell('Stop-Computer -Force')
	},
	suspendHost: async () => {
		await runOneOffPowerShell('rundll32.exe powrprof.dll,SetSuspendState 0,1,0')
	},
	restartHost: async () => {
		await runOneOffPowerShell('Restart-Computer -Force')
	},
	restartHostParsec: async () => {
		await runOneOffPowerShell('sc.exe control Parsec 200 ; Stop-Process -Name parsecd -Force ; Restart-Service -Name Parsec -Force')
	},
	switchHostDisplay: async ({mode}) => {
		if (mode === 'internal') {
			await runOneOffPowerShell('DisplaySwitch.exe /internal')
		} else if (mode === 'external') {
			await runOneOffPowerShell('DisplaySwitch.exe /external')
		} else {
			await runOneOffPowerShell('DisplaySwitch.exe /clone')
		}
	},
	startVM: async ({vmName}) => {
		await runOneOffPowerShell(`Start-VM -Name "${vmName}"`)
	},
	stopVM: async ({vmName}) => {
		await runOneOffPowerShell(`Stop-VM -Name "${vmName}" -Force`)
	},
	setVMCPU: async ({vmName, value}) => {
		await runOneOffPowerShell(`Set-VMProcessor "${vmName}" -Count ${value}`)
	},
	setVMRAM: async ({vmName, value}) => {
		await runOneOffPowerShell(`Set-VMMemory "${vmName}" -StartupBytes ${value}GB -AlignProperties`)
	},
}

async function actionRouter(actionBody: AgentUnknownActionBody) {
	const {uuid, action} = actionBody
	await actionHandlers[action](actionBody as never)
}

async function checkin() {
	try {
		const status = await calculateStatus()
		const requestBody: CheckinRequestBody = {status, completedIds, errors}
		const response = await axios.post(
			process.env.CHECKIN_POST_URL,
			requestBody,
			{
				timeout: 3000,
			},
		)
		const responseData: AgentUnknownActionBody[] = response.data
		completedIds = []
		errors = []
		if (responseData.length) {
			// eslint-disable-next-line no-console
			console.dir(responseData)
		}
		// eslint-disable-next-line no-restricted-syntax
		for (const actionBody of responseData) {
			try {
				// eslint-disable-next-line no-await-in-loop
				await actionRouter(actionBody)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				// eslint-disable-next-line no-console
				console.error(e.toString())
				errors.push(e.toString())
			}
			completedIds.push(actionBody.uuid)
		}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error(e?.toString())
	}
}

async function statusLoop() {
	const start = performance.now()
	await checkin()
	const elapsed = performance.now() - start
	const delay = Math.max(0, 900 - elapsed)
	setTimeout(statusLoop, delay)
}

// eslint-disable-next-line no-console
console.log(`Starting agent calling ${process.env.CHECKIN_POST_URL} at ${new Date()}`)
statusLoop()
