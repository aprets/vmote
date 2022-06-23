declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DEV: string | undefined,
			CHECKIN_POST_URL: string,
			NORMAL_POWER_PLAN_GUID: string,
			SLEEPY_POWER_PLAN_GUID: string,
		}
	}
}

export { }
