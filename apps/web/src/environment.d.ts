declare global {
	namespace NodeJS {
		interface ProcessEnv {
			HOST_MAC_ADDR: string,
			HOST_ADDR: string,
		}
	}
}

export {}
