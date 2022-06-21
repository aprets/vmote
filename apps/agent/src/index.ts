import dotenv from 'dotenv'

import {performance} from 'perf_hooks'

import axios from 'axios'

import AutoGitUpdate from 'auto-git-update'
import {PowerShell} from 'node-powershell'

import {calculateStatus} from './statusMetrics'

dotenv.config({path: '.env.local'})

const runOneOffPowerShell = (command: string) => PowerShell.invoke(command, {executableOptions: {'-ExecutionPolicy': 'Bypass', '-NoProfile': true}})

const updater = new AutoGitUpdate({
	repository: process.env.GIT_REPO_URL,
	branch: process.env.GIT_BRANCH,
	tempLocation: '../tmp-update',
	exitOnComplete: true,
})

let completedActions: string[] = []
let failedActions: string[] = []

const actionHandlers = {
	updateAgent: async () => {
		updater.forceUpdate()
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
	startVM: async ({vmName}: {vmName: string}) => {
		await runOneOffPowerShell(`Start-VM -Name "${vmName}"`)
	},
	stopVM: async ({vmName}: {vmName: string}) => {
		await runOneOffPowerShell(`Stop-VM -Name "${vmName}" -Force`)
	},
	setVMCPU: async ({vmName, value}: {vmName: string, value: number}) => {
		await runOneOffPowerShell(`Set-VMProcessor "${vmName}" -Count ${value}`)
	},
	setVMRAM: async ({vmName, value}: {vmName: string, value: number}) => {
		await runOneOffPowerShell(`Set-VMMemory "${vmName}" -StartupBytes ${value}GB -AlignProperties`)
	},
}

async function actionRouter(actionBody: any) {
	const {uuid, action} = actionBody
	await actionHandlers[action as keyof typeof actionHandlers](actionBody)
	completedActions.push(uuid)
}

async function checkin() {
	try {
		const status = await calculateStatus()
		completedActions = []
		failedActions = []
		const response = await axios.post(
			process.env.CHECKIN_POST_URL,
			{status, completedActions, failedActions},
		)
		console.log(response.data)
		// eslint-disable-next-line no-restricted-syntax
		for (const actionBody of response.data) {
			try {
				// eslint-disable-next-line no-await-in-loop
				await actionRouter(actionBody)
			} catch (e: any) {
				console.error(e.toString())
				failedActions.push(actionBody.uuid)
			}
		}
	} catch (e) {
		console.error(e)
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
