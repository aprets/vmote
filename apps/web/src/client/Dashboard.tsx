import {MdOutlinePowerSettingsNew} from 'react-icons/md'

import {Title, Text, Container, Card, Group, Skeleton, ActionIcon} from '@mantine/core'

import {useStatus} from './lib/useStatus'
import HostCard from './components/HostCard'
import {VMCard} from './components/VMCard'
import {sendCommand} from './lib/remoteExec'

export default function Dashboard(): React.ReactElement {
	const [loading, status] = useStatus()
	const connected = !loading

	return (
		<>
			<Title sx={{fontSize: 30, fontWeight: 300}} align='center' mt={10}>
				VMote
				<Text inherit variant='gradient' component='span' sx={{verticalAlign: 'super', fontSize: 20, letterSpacing: 0}}>
					Beta
				</Text>

			</Title>
			<Container mt='xl'>

				<Card
					shadow='sm'
					padding='xl'
				>
					<Text weight={500} size='xl' mb={10}>
						Host (
						{connected && status && <Text inherit color='green' component='span'>Running</Text>}
						{(!connected || !status) && <Text inherit color='red' component='span'>Offline</Text>}
						)
					</Text>

					{status && <HostCard status={status} />}

					{connected && !status && (
						<Skeleton height={200} />
					)}

					{(!connected || !status) && (
						<Group direction='column' align='center'>
							<ActionIcon
								size={100}
								variant='transparent'
								onClick={() => { sendCommand({action: 'wakeHost'}) }}
							>
								<MdOutlinePowerSettingsNew size='100px' color='#f03e3e' />
							</ActionIcon>
						</Group>
					)}

				</Card>

				{connected && !status && (
					<Skeleton height='100vh' mt={10} />
				)}

				{status && status.vms && (
					<>
						{status.vms.map((vm) => (

							<Card
								shadow='sm'
								padding='xl'
								mt={10}
								key={vm.id}
							>
								<VMCard status={status} vm={vm} />
							</Card>
						))}
					</>
				)}
			</Container>
		</>
	)
}
