import {Text, RingProgress, Group, Box} from '@mantine/core'

export function MetricRing({label, value}: {label: string; value: number;}) {
	return (
		<Group position='center' direction='column' spacing='xs'>
			<Text color='blue' weight={500} align='center' size='md' mb={-20}>
				{label}
			</Text>

			<RingProgress
				sections={[{value, color: 'blue'}]}
				label={(
					<Text color='blue' weight={700} align='center' size='xl'>
						{value}%
					</Text>
				)}
			/>
		</Group>
	)
}

export function MetricText({label, value}: {label: string; value: string | number;}) {
	return (
		<Group position='center' direction='column' spacing='xs'>
			<Text color='blue' weight={500} align='center' size='md' mb={-20}>
				{label}
			</Text>
			<Box sx={{display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
				<Text color='blue' weight={700} align='center' size='xl'>
					{value}
				</Text>
			</Box>
		</Group>
	)
}
