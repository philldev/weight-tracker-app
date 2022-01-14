import {
	Box,
	Button,
	chakra,
	Container,
	Divider,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerHeader,
	DrawerOverlay,
	Flex,
	FormControl,
	Heading,
	HStack,
	Icon,
	IconButton,
	Input,
	InputGroup,
	InputRightAddon,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Progress,
	Select,
	Text,
	useColorMode,
	useColorModeValue,
	useDisclosure,
	VStack,
} from '@chakra-ui/react'
import { nanoid } from 'nanoid'
import { useState } from 'react'
import DayPicker from 'react-day-picker'
import 'react-day-picker/lib/style.css'
import { useForm } from 'react-hook-form'
import {
	FiCalendar,
	FiChevronLeft,
	FiChevronRight,
	FiMoon,
	FiUser,
	FiUserPlus,
} from 'react-icons/fi'
import {
	FlexibleXYPlot,
	HorizontalGridLines,
	LineSeries,
	XAxis,
	YAxis,
} from 'react-vis'
import 'react-vis/dist/style.css'

type WeightData = {
	id: string
	date: Date
	weight: number
	personId: string
}
type Person = {
	id: string
	name: string
	initialWeight: number
	goalWeight: number
}

type State = {
	date: Date
	persons: Person[]
	weightDatas: Map<string, WeightData[]>
}

const Home = () => {
	const { toggleColorMode } = useColorMode()

	const [state, setState] = useState<State>({
		date: new Date(),
		persons: [],
		weightDatas: new Map(),
	})

	const addPerson = (person: Person) => {
		setState((p) => ({
			...p,
			persons: [...p.persons, person],
		}))
	}

	const addPersonWeight = (weightData: WeightData) => {
		setState((p) => {
			let newMap = new Map(p.weightDatas)
			let datas = newMap.has(weightData.personId)
				? newMap.get(weightData.personId)!
				: []

			let dataExist = datas.some((d) =>
				datesAreOnSameDay(d.date, weightData.date)
			)

			let newDatas = dataExist
				? datas.map((d) =>
						datesAreOnSameDay(d.date, weightData.date) ? weightData : d
				  )
				: [...datas, weightData]

			newMap.set(weightData.personId, newDatas)

			return { ...p, weightDatas: newMap }
		})
	}

	const onNextMonthClick = () => {
		setState((p) => {
			const newDate = new Date(p.date)
			newDate.setMonth(p.date.getMonth() + 1)
			return {
				...p,
				date: newDate,
			}
		})
	}
	const onPrevMonthClick = () => {
		setState((p) => {
			const newDate = new Date(p.date)
			newDate.setMonth(p.date.getMonth() - 1)
			return {
				...p,
				date: newDate,
			}
		})
	}

	return (
		<Flex
			bg={useColorModeValue('gray.50', 'gray.800')}
			flexDir='column'
			w='100vw'
			minH='100vh'
			overflowX='hidden'
		>
			<Flex gap='2' justifyContent={'center'} shadow='md' p='4'>
				<Heading flex='1'>Weight Tracker App</Heading>
				<IconButton
					aria-label='Dark Mode'
					onClick={toggleColorMode}
					icon={<Icon as={FiMoon} />}
				/>
			</Flex>
			<Container maxW='container.sm' py='4'>
				<VStack spacing='4' alignItems='stretch'>
					<MyBox>
						<Text fontWeight={'bold'} mb='4' fontSize='lg'>
							Tracker Graph
						</Text>
						<DateNav
							{...{ onNextMonthClick, onPrevMonthClick }}
							date={state.date}
						/>
						<Graph date={state.date} weightDatas={state.weightDatas} />
						<AddLogWeight
							persons={state.persons}
							onAddLog={(weightData) => {
								addPersonWeight({
									...weightData,
									id: nanoid(),
								})
							}}
						/>
					</MyBox>
					<MyBox>
						<HStack mb='4'>
							<Text fontWeight={'bold'} fontSize='lg'>
								Persons
							</Text>
							<AddPerson
								onAddPerson={(person) => {
									const newPerson: Person = {
										...person,
										id: nanoid(),
									}

									addPerson(newPerson)
								}}
							/>
						</HStack>
						<VStack alignItems='stretch' divider={<Divider />} spacing='4'>
							{state.persons.map((p) => (
								<PersonInfo
									key={p.id}
									person={p}
									lastWeight={getPersonLastWeight(p, state.weightDatas)}
								/>
							))}
						</VStack>
					</MyBox>
				</VStack>
			</Container>
		</Flex>
	)
}

const MyBox = chakra((props) => (
	<Box
		bg={useColorModeValue('white', 'gray.900')}
		p='4'
		shadow='sm'
		rounded='md'
		{...props}
	/>
))

const DateNav = (props: {
	date: Date
	onNextMonthClick: () => void
	onPrevMonthClick: () => void
}) => {
	return (
		<Flex mb='4' alignItems='center'>
			<IconButton
				onClick={props.onPrevMonthClick}
				aria-label='next date'
				icon={<Icon as={FiChevronLeft} />}
			/>
			<Text textAlign='center' flex='1'>
				{props.date.toLocaleDateString('en-US', { month: 'long' })}{' '}
				{props.date.toLocaleDateString('en-US', { year: 'numeric' })}
			</Text>
			<IconButton
				onClick={props.onNextMonthClick}
				aria-label='next date'
				icon={<Icon as={FiChevronRight} />}
			/>
		</Flex>
	)
}

const Graph = (props: {
	date: Date
	weightDatas: Map<string, WeightData[]>
}) => {
	const data: { x: number; y: number | null }[] = daysInMonth(
		props.date.getMonth(),
		props.date.getFullYear()
	).map((date) => ({ x: date.getDate(), y: null }))

	console.log(props.weightDatas)

	let lines: Array<{ x: number; y: number }[]> = []

	props.weightDatas.forEach((val) => {
		const data = val
			.filter((d) => datesAreOnSameMonth(d.date, props.date))
			.map((d) => ({ x: d.date.getDate(), y: d.weight }))
		lines.push(data)
	})

	return (
		<FlexibleXYPlot
			dontCheckIfEmpty
			yDomain={[0, 100]}
			xDomain={[1, Math.max(...data.map((item) => item.x))]}
			height={200}
		>
			<HorizontalGridLines />
			<YAxis hideLine />
			<XAxis hideLine />
			{lines.map((line, idx) => (
				<LineSeries
					style={{ fill: 'none' }}
					getNull={(d) => d.y !== null}
					curve='curveMonotoneX'
					data={line}
					key={idx}
				/>
			))}
		</FlexibleXYPlot>
	)
}

const AddLogWeight = (props: {
	persons: Person[]
	onAddLog: (data: Omit<WeightData, 'id'>) => void
}) => {
	const modal = useDisclosure()

	return (
		<>
			<Flex justifyContent='center'>
				<Button size='sm' onClick={modal.onOpen} colorScheme='facebook'>
					Log
				</Button>
			</Flex>
			<Modal isCentered isOpen={modal.isOpen} onClose={modal.onClose}>
				<ModalOverlay />
				<AddLogForm onClose={modal.onClose} {...props} />
			</Modal>
		</>
	)
}

const AddLogForm = (props: {
	persons: Person[]
	onAddLog: (data: Omit<WeightData, 'id'>) => void
	onClose: () => void
}) => {
	const dateDrawer = useDisclosure()

	const form = useForm<Omit<WeightData, 'id'>>({
		defaultValues: {
			date: new Date(),
		},
	})

	const onSubmit = (data: Omit<WeightData, 'id'>) => {
		props.onAddLog(data)
	}

	return (
		<ModalContent
			as='form'
			onSubmit={form.handleSubmit(onSubmit)}
			mx={{ base: '4', sm: '0' }}
		>
			<ModalHeader>Log Weight</ModalHeader>
			<ModalCloseButton />
			<ModalBody>
				<VStack alignItems='stretch'>
					<FormControl isInvalid={Boolean(form.formState.errors.personId)}>
						<Select
							{...form.register('personId', { required: true })}
							placeholder='Select Person'
						>
							{props.persons.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</Select>
					</FormControl>
					<FormControl isInvalid={Boolean(form.formState.errors.weight)}>
						<InputGroup>
							<Input
								{...form.register('weight', { required: true })}
								placeHolder='Weight'
								type='number'
							/>
							<InputRightAddon>KG </InputRightAddon>
						</InputGroup>
					</FormControl>
					<FormControl>
						<Input
							{...form.register('date', { required: true })}
							type='hidden'
						/>
						<Flex alignItems='center' justifyContent='space-between'>
							<Flex
								py='2'
								px='4'
								rounded='md'
								alignItems='center'
								bg={useColorModeValue('gray.100', 'gray.800')}
							>
								<Icon mr='2' as={FiCalendar} />
								<Text>
									{form.getValues('date') &&
										datesAreOnSameDay(form.getValues('date'), new Date()) &&
										'Today - '}
									{form.getValues('date').toLocaleDateString()}
								</Text>
							</Flex>
							<Button colorScheme='blue' onClick={dateDrawer.onOpen}>
								Select Date
							</Button>
						</Flex>
						<Drawer
							placement={'bottom'}
							onClose={dateDrawer.onClose}
							isOpen={dateDrawer.isOpen}
						>
							<DrawerOverlay />
							<DrawerContent>
								<DrawerHeader borderBottomWidth='1px'>Pick Date</DrawerHeader>
								<DrawerCloseButton />
								<DrawerBody d='flex' justifyContent='center'>
									<DayPicker
										disabledDays={{ before: new Date() }}
										onDayClick={(day, { disabled }) => {
											if (!disabled) {
												form.setValue('date', day)
											}
										}}
										selectedDays={form.watch('date')}
									/>
								</DrawerBody>
							</DrawerContent>
						</Drawer>
					</FormControl>
				</VStack>
			</ModalBody>
			<ModalFooter>
				<HStack>
					<Button onClick={props.onClose} variant='ghost'>
						Cancel
					</Button>
					<Button type='submit'>Add</Button>
				</HStack>
			</ModalFooter>
		</ModalContent>
	)
}

const AddPerson = (props: {
	onAddPerson: (person: Omit<Person, 'id'>) => void
}) => {
	const modal = useDisclosure()

	return (
		<>
			<IconButton
				onClick={modal.onOpen}
				size='sm'
				icon={<Icon as={FiUserPlus} />}
				aria-label='Add Person'
			/>
			<Modal isCentered isOpen={modal.isOpen} onClose={modal.onClose}>
				<ModalOverlay />
				<AddPersonForm
					onAddPerson={props.onAddPerson}
					onClose={modal.onClose}
				/>
			</Modal>
		</>
	)
}

const AddPersonForm = (props: {
	onAddPerson: (person: Omit<Person, 'id'>) => void
	onClose: () => void
}) => {
	const form = useForm<Omit<Person, 'id'>>()
	const onSubmit = (person: Omit<Person, 'id'>) => {
		props.onAddPerson(person)
	}
	return (
		<ModalContent
			as={'form'}
			onSubmit={form.handleSubmit(onSubmit)}
			mx={{ base: '4', sm: '0' }}
		>
			<ModalHeader>Add Person</ModalHeader>
			<ModalCloseButton />
			<ModalBody>
				<VStack alignItems='stretch'>
					<FormControl isInvalid={Boolean(form.formState.errors.name)}>
						<InputGroup>
							<Input
								{...form.register('name', { required: true })}
								placeHolder='Name'
							/>
						</InputGroup>
					</FormControl>
					<FormControl isInvalid={Boolean(form.formState.errors.initialWeight)}>
						<InputGroup>
							<Input
								{...form.register('initialWeight', { required: true })}
								placeholder='Starting Weight'
								type='number'
							/>
							<InputRightAddon>KG </InputRightAddon>
						</InputGroup>
					</FormControl>
					<FormControl isInvalid={Boolean(form.formState.errors.goalWeight)}>
						<InputGroup>
							<Input
								{...form.register('goalWeight', { required: true })}
								placeholder='Goal Weight'
								type='number'
							/>
							<InputRightAddon>KG </InputRightAddon>
						</InputGroup>
					</FormControl>
				</VStack>
			</ModalBody>
			<ModalFooter>
				<HStack>
					<Button onClick={props.onClose} variant='ghost'>
						Cancel
					</Button>
					<Button type='submit'>Add</Button>
				</HStack>
			</ModalFooter>
		</ModalContent>
	)
}

const PersonInfo = (props: { person: Person; lastWeight?: WeightData }) => {
	return (
		<Flex flexDir='column' p='3' rounded='md' borderWidth='1px'>
			<Flex mb='3' alignItems='center'>
				<HStack spacing='2' alignItems='center'>
					<Icon as={FiUser} />
					<Text fontWeight='bold'>{props.person.name}</Text>
					{props.lastWeight && (
						<HStack alignItems='flex-end' spacing='1'>
							<Text>{props.lastWeight.weight} KG</Text>
							<Text fontSize='xs' color='gray.500'>
								{props.lastWeight.date.toLocaleDateString()}
							</Text>
						</HStack>
					)}
				</HStack>
			</Flex>
			<Box pos='relative'>
				<Progress mb='1' />
				<Flex justifyContent='space-between'>
					<Box>
						<Text fontWeight='bold'>{props.person.initialWeight} Kg</Text>
						<Text color='gray.500' fontSize='sm'>
							Starting Weight
						</Text>
					</Box>
					<Box textAlign='right'>
						<Text fontWeight='bold'>{props.person.goalWeight} Kg</Text>
						<Text color='gray.500' fontSize='sm'>
							Goal Weight
						</Text>
					</Box>
				</Flex>
			</Box>
		</Flex>
	)
}

const getPersonLastWeight = (
	person: Person,
	datas: Map<string, WeightData[]>
) => {
	const personData = datas.get(person.id)

	if (!personData || personData.length === 0) return undefined

	return personData[personData.length - 1]
}

const datesAreOnSameDay = (first: Date, second: Date) =>
	first.getFullYear() === second.getFullYear() &&
	first.getMonth() === second.getMonth() &&
	first.getDate() === second.getDate()

const datesAreOnSameMonth = (first: Date, second: Date) =>
	first.getFullYear() === second.getFullYear() &&
	first.getMonth() === second.getMonth()

function daysInMonth(month: number, year: number) {
	const date = new Date(year, month, 1)
	const days = []
	while (date.getMonth() === month) {
		days.push(new Date(date))
		date.setDate(date.getDate() + 1)
	}
	return days
}

export default Home
