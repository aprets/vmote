import fs from 'fs'

export const hypervVMStates = [
	'Other',
	'Running',
	'Off',
	'Stopping',
	'Saved',
	'Paused',
	'Starting',
	'Reset',
	'Saving',
	'Pausing',
	'Resuming',
	'FastSaved',
	'FastSaving',
	'ForceShutdown',
	'ForceReboot',
	'Hibernated',
	'ComponentServicing',
	'RunningCritical',
	'OffCritical',
	'StoppingCritical',
	'SavedCritical',
	'PausedCritical',
	'StartingCritical',
	'ResetCritical',
	'SavingCritical',
	'PausingCritical',
	'ResumingCritical',
	'FastSavedCritical',
	'FastSavingCritical',
]

const WINDIR = process.env.WINDIR || 'C:\\Windows'

export function getWindowsNvidiaSmiPath() {
	// The MIT License (MIT)

	// Copyright (c) 2014-2021 Sebastian Hildebrandt

	// Permission is hereby granted, free of charge, to any person obtaining a copy of
	// this software and associated documentation files (the "Software"), to deal in
	// the Software without restriction, including without limitation the rights to
	// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
	// the Software, and to permit persons to whom the Software is furnished to do so,
	// subject to the following conditions:

	// The above copyright notice and this permission notice shall be included in all
	// copies or substantial portions of the Software.

	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
	// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
	// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
	// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	if (process.platform !== 'win32') {
		return undefined
	}
	const basePath = `${WINDIR}\\System32\\DriverStore\\FileRepository`
	// find all directories that have an nvidia-smi.exe file
	const candidateDirs = fs.readdirSync(basePath).filter((dir) => fs.readdirSync([basePath, dir].join('\\')).includes('nvidia-smi.exe'))
	// use the directory with the most recently created nvidia-smi.exe file
	const targetDir = candidateDirs.reduce((prevDir, currentDir) => {
		const previousNvidiaSmi = fs.statSync([basePath, prevDir, 'nvidia-smi.exe'].join('\\'))
		const currentNvidiaSmi = fs.statSync([basePath, currentDir, 'nvidia-smi.exe'].join('\\'))
		return (previousNvidiaSmi.ctimeMs > currentNvidiaSmi.ctimeMs) ? prevDir : currentDir
	})

	return [basePath, targetDir, 'nvidia-smi.exe'].join('\\')
}
