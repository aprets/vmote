import type {ActionName, ActionBody, AgentActionHandlerMap, UnknownActionBody, AgentUnknownActionBody, AgentActionName} from 'types'

import dotenv from 'dotenv'

import {performance} from 'perf_hooks'

import axios from 'axios'

import {PowerShell} from 'node-powershell'

import {calculateStatus} from './statusMetrics'
import {startUpdate} from './updater'

dotenv.config({path: '.env.local'})

const runOneOffPowerShell = (command: string) => PowerShell.invoke(command, {executableOptions: {'-ExecutionPolicy': 'Bypass', '-NoProfile': true}})

let completedActions: string[] = []
let failedActions: string[] = []

const actionHandlers: AgentActionHandlerMap = {
	updateAgent: async ({zipUrl, zipPath}) => {
		startUpdate(zipUrl, zipPath)
	},
	shutdownHost: async () => {
		runOneOffPowerShell('Stop-Computer -Force')
	},
	suspendHost: async () => {
		runOneOffPowerShell('rundll32.exe powrprof.dll,SetSuspendState 0,1,0')
	},
	restartHost: async () => {
		runOneOffPowerShell('Restart-Computer -Force')
	},
	restartHostParsec: async () => {
		await runOneOffPowerShell('sc.exe control Parsec 200 ; Stop-Process -Name parsecd -Force ; Restart-Service -Name Parsec -Force')
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
	completedActions.push(uuid)
}

async function checkin() {
	try {
		const status = await calculateStatus()
		const response = await axios.post(
			process.env.CHECKIN_POST_URL,
			{status, completedActions, failedActions},
			{
				timeout: 3000,
			},
		)
		completedActions = []
		failedActions = []
		console.log(response.data)
		// eslint-disable-next-line no-restricted-syntax
		for (const actionBody of response.data) {
			try {
				// eslint-disable-next-line no-await-in-loop
				await actionRouter(actionBody)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				// eslint-disable-next-line no-console
				console.error(e.toString())
				failedActions.push(actionBody.uuid)
			}
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

statusLoop()
