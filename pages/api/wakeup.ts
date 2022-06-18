import {NextApiHandler} from 'next'
import wol from 'wake_on_lan'
import {ping} from '@network-utils/tcp-ping'

const handler: NextApiHandler = async (req, res) => {
	let tries = 0
	let alive = false
	while (!alive && tries <= 100) {
		tries += 1
		wol.wake(process.env.HOST_MAC_ADDR)
		// eslint-disable-next-line no-await-in-loop
		const r = await ping({address: process.env.NEXT_PUBLIC_HOST_ADDR, attempts: 1, port: 80, timeout: 1000})
		alive = r.minimumLatency < Infinity
	}
	if (alive) {
		res.status(200).send(undefined)
	} else {
		res.status(500).send('Could not wake up the server')
	}
}

export default handler
