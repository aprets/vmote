import {ChildProcess, spawn, SpawnOptions} from 'child_process'

const cmd = 'ts-node ./src'

const options: SpawnOptions = {
	shell: true,
	cwd: process.cwd(),
	stdio: 'inherit',
}

const respawn = (spawned: ChildProcess) => {
	spawned.on('close', () => {
		respawn(spawn(cmd, options))
	})
}

respawn(spawn(cmd, options))
