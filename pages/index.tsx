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
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverCloseButton,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
	Progress,
	Select,
	Text,
	useColorMode,
	useColorModeValue,
	useDisclosure,
	VStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import {
	FiCalendar,
	FiChevronLeft,
	FiChevronRight,
	FiMoon,
	FiPlus,
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
import DayPicker from 'react-day-picker'
import 'react-day-picker/lib/style.css'

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
}

const Home = () => {
	const { toggleColorMode } = useColorMode()

	const [state, setState] = useState<State>({
		date: new Date(),
		persons: [],
	})

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
						<Graph date={state.date} />
						<AddLogWeight persons={state.persons} onAddLog={() => {}} />
					</MyBox>
					<MyBox>
						<HStack mb='4'>
							<Text fontWeight={'bold'} fontSize='lg'>
								Persons
							</Text>
							<AddPerson onAddPerson={() => {}} />
						</HStack>
						<VStack alignItems='stretch'>
							<PersonInfo />
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

const Graph = (props: { date: Date }) => {
	const data: { x: number; y: number | null }[] = daysInMonth(
		props.date.getMonth(),
		props.date.getFullYear()
	).map((date) => ({ x: date.getDate(), y: null }))

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
			<LineSeries
				style={{ fill: 'none' }}
				getNull={(d) => d.y !== null}
				curve='curveMonotoneX'
				data={data}
			/>
		</FlexibleXYPlot>
	)
}

const AddLogWeight = (props: {
	persons: Person[]
	onAddLog: (data: WeightData) => void
}) => {
	const logWeightModal = useDisclosure()
	const dateDrawer = useDisclosure()

	const [weightData, setWeightData] = useState<Partial<WeightData>>({
		date: new Date(),
	})

	const invalid = !weightData.weight || !weightData.personId

	const onAddLog = () => {
		console.log(weightData)
	}

	return (
		<>
			<Flex justifyContent='center'>
				<Button
					size='sm'
					onClick={logWeightModal.onOpen}
					colorScheme='facebook'
				>
					Log
				</Button>
			</Flex>
			<Modal
				isCentered
				isOpen={logWeightModal.isOpen}
				onClose={logWeightModal.onClose}
			>
				<ModalOverlay />
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
										if (val) {
											setWeightData((p) => ({
												...p,
												personId: val,
											}))
										}
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
											if (val) {
												setWeightData((p) => ({
													...p,
													weight: parseInt(val),
												}))
											}
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
										<DrawerHeader borderBottomWidth='1px'>
											Pick Date
										</DrawerHeader>
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
							<Button onClick={logWeightModal.onClose} variant='ghost'>
								Cancel
							</Button>
							<Button onClick={onAddLog} disabled={invalid}>
								Add
							</Button>
						</HStack>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
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
											if (val) {
												setPerson((p) => ({
													...p,
													initialWeight: parseInt(val),
												}))
											}
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
											if (val) {
												setPerson((p) => ({
													...p,
													goalWeight: parseInt(val),
												}))
											}
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

const PersonInfo = () => {
	return (
		<Flex flexDir='column'>
			<Flex mb='3' alignItems='center'>
				<HStack spacing='2' alignItems='center'>
					<Icon as={FiUser} />
					<Text fontWeight='bold'>Deddy</Text>
					<HStack alignItems='flex-end' spacing='1'>
						<Text>55 KG</Text>
						<Text fontSize='xs' color='gray.500'>
							{new Date().toLocaleDateString()}
						</Text>
					</HStack>
				</HStack>
			</Flex>
			<Box pos='relative'>
				<Progress mb='1' value={80} />
				<Flex justifyContent='space-between'>
					<Box>
						<Text fontWeight='bold'>52 Kg</Text>
						<Text color='gray.500' fontSize='sm'>
							Starting Weight
						</Text>
					</Box>
					<Box textAlign='right'>
						<Text fontWeight='bold'>60 Kg</Text>
						<Text color='gray.500' fontSize='sm'>
							Goal Weight
						</Text>
					</Box>
				</Flex>
			</Box>
		</Flex>
	)
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
