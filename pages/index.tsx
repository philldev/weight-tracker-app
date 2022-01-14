import {
	Box,
	Button,
	chakra,
	Container,
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
						<VStack alignItems='stretch'>
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
		const data = val.map((d) => ({ x: d.date.getDate(), y: d.weight }))
		lines.push(data)
	})

	return (
		<FlexibleXYPlot
			style={{ overflow: 'auto' }}
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

	const [weightData, setWeightData] = useState<Partial<Omit<WeightData, 'id'>>>(
		{
			date: new Date(),
		}
	)

	const invalid = !weightData.weight || !weightData.personId

	const onAddLog = () => {
		if (!invalid) {
			props.onAddLog(weightData as Omit<WeightData, 'id'>)
		}
	}
	return (
		<ModalContent mx={{ base: '4', sm: '0' }}>
			<ModalHeader>Log Weight</ModalHeader>
			<ModalCloseButton />
			<ModalBody>
				<VStack alignItems='stretch'>
					<FormControl>
						<Select
							value={weightData.personId}
							onChange={(e) => {
								const val = e.target.value
								setWeightData((p) => ({
									...p,
									personId: val,
								}))
							}}
							placeholder='Select Person'
						>
							{props.persons.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</Select>
					</FormControl>
					<FormControl>
						<InputGroup>
							<Input
								min={1}
								value={weightData.weight}
								onChange={(e) => {
									const val = e.target.value
									setWeightData((p) => ({
										...p,
										weight: val.length === 0 ? undefined : parseInt(val),
									}))
								}}
								placeHolder='Weight'
								type='number'
							/>
							<InputRightAddon>KG </InputRightAddon>
						</InputGroup>
					</FormControl>
					<FormControl>
						<Flex pl='4' alignItems='center' justifyContent='space-between'>
							<Flex alignItems='center'>
								<Icon mr='2' as={FiCalendar} />
								<Text>
									{weightData.date &&
										datesAreOnSameDay(weightData.date, new Date()) &&
										'Today - '}
									{weightData.date?.toLocaleDateString()}
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
												setWeightData((p) => ({ ...p, date: day }))
											}
										}}
										selectedDays={weightData.date}
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
					<Button onClick={onAddLog} disabled={invalid}>
						Add
					</Button>
				</HStack>
			</ModalFooter>
		</ModalContent>
	)
}

const AddPerson = (props: {
	onAddPerson: (person: Omit<Person, 'id'>) => void
}) => {
	const modal = useDisclosure()
	const [person, setPerson] = useState<Partial<Omit<Person, 'id'>>>({})
	const invalid = (() => {
		return !person.goalWeight || !person.goalWeight || !person.initialWeight
	})()

	const handleAddPerson = () => {
		if (!invalid) {
			props.onAddPerson(person as Omit<Person, 'id'>)
		}
	}

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
				<ModalContent mx={{ base: '4', sm: '0' }}>
					<ModalHeader>Add Person</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<VStack alignItems='stretch'>
							<FormControl>
								<Input
									value={person.name}
									onChange={(e) => {
										const val = e.target.value
										if (val) {
											setPerson((p) => ({
												...p,
												name: val,
											}))
										}
									}}
									placeHolder='Name'
								/>
							</FormControl>
							<FormControl>
								<InputGroup>
									<Input
										// min={1}
										value={person.initialWeight}
										onChange={(e) => {
											const val = e.target.value
											setPerson((p) => ({
												...p,
												initialWeight:
													val.length === 0 ? undefined : parseInt(val),
											}))
										}}
										placeHolder='Starting Weight'
										type='number'
									/>
									<InputRightAddon>KG </InputRightAddon>
								</InputGroup>
							</FormControl>
							<FormControl>
								<InputGroup>
									<Input
										value={person.goalWeight}
										onChange={(e) => {
											const val = e.target.value
											setPerson((p) => ({
												...p,
												goalWeight:
													val.length === 0 ? undefined : parseInt(val),
											}))
										}}
										placeHolder='Goal Weight'
										type='number'
									/>
									<InputRightAddon>KG </InputRightAddon>
								</InputGroup>
							</FormControl>
						</VStack>
					</ModalBody>
					<ModalFooter>
						<HStack>
							<Button onClick={modal.onClose} variant='ghost'>
								Cancel
							</Button>
							<Button disabled={invalid} onClick={handleAddPerson}>
								Add
							</Button>
						</HStack>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	)
}

const PersonInfo = (props: { person: Person; lastWeight?: WeightData }) => {
	// const get = (start: number, end: number, current: number) => {
	// 	if (start < end) {
	// 		return start - end
	// 	}
	// }

	return (
		<Flex flexDir='column'>
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
