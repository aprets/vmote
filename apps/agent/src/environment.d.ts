declare global {
	namespace NodeJS {
		interface ProcessEnv {
			GIT_REPO_URL: string
			GIT_BRANCH: string
			CHECKIN_POST_URL: string
			NORMAL_POWER_PLAN_GUID: string
			SLEEPY_POWER_PLAN_GUID: string
		}
	}
}

export { }
