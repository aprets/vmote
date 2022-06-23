/* eslint-disable no-console */
import axios from 'axios'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {async as StreamZip} from 'node-stream-zip'

let extractLocation: string

async function downloadUpdate(updateUrl: string, tmpDir: string) {
	const zipLocation = path.join(tmpDir, 'update.zip')
	console.log(`Downloading update from ${updateUrl} to ${zipLocation}`)
	const res = await axios.get(updateUrl, {responseType: 'arraybuffer'})
	await fs.promises.writeFile(zipLocation, res.data)
	return zipLocation
}

async function extractUpdate(zipLocation: string, zipPath: string) {
	console.log(`Extracting update from ${zipLocation} to ${extractLocation}`)
	const zip = new StreamZip({file: zipLocation, storeEntries: true})
	await zip.extract(zipPath, extractLocation)
	await zip.close()
}

export async function startUpdate(zipUrl: string, zipPath: string) {
	extractLocation = process.env.DEV ? path.join(__dirname, '..', 'dist') : path.join(__dirname, '..')
	let tmpDir: string | undefined
	const appPrefix = 'vmote-update-'
	try {
		console.log(`Creating temporary directory ${appPrefix}...`)
		tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), appPrefix))
		const zipLocation = await downloadUpdate(zipUrl, tmpDir)
		await extractUpdate(zipLocation, zipPath)
	} catch (e: any) {
		console.error('Failed to update')
		console.error(e.toString())
	} finally {
		try {
			if (tmpDir) {
				console.log(`Removing temporary directory ${tmpDir}`)
				await fs.promises.rm(tmpDir, {recursive: true})
			}
		} catch (e: any) {
			console.error(`An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e.toString}`)
		}
	}
}
