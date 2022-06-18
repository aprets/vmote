import {AppProps} from 'next/app'
import Head from 'next/head'
import {MantineProvider, NormalizeCSS, GlobalStyles} from '@mantine/core'
import {NotificationsProvider} from '@mantine/notifications'

export default function App(props: AppProps): React.ReactElement {
	const {Component, pageProps} = props

	return (
		<>
			<Head>
				<title>VMote</title>
				<meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
			</Head>

			<MantineProvider
				theme={{
					/** Put your mantine theme override here */
					colorScheme: 'light',
				}}
			>
				<NormalizeCSS />
				<GlobalStyles />
				<NotificationsProvider>
					<Component {...pageProps} />
				</NotificationsProvider>
			</MantineProvider>
		</>
	)
}
