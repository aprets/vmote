interface ImportMetaEnv {
	readonly VITE_HOST_PARSEC_URL: string
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
