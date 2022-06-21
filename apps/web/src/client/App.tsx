import {MantineProvider, NormalizeCSS, GlobalStyles} from '@mantine/core'
import {NotificationsProvider} from '@mantine/notifications'
import Dashboard from './Dashboard'

export default function App() {
	return (
		<MantineProvider
			theme={{
				/** Put your mantine theme override here */
				colorScheme: 'light',
			}}
		>
			<NormalizeCSS />
			<GlobalStyles />
			<NotificationsProvider>
				<Dashboard />
			</NotificationsProvider>
		</MantineProvider>
	)
}
