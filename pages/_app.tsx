import type { AppProps } from 'next/app'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
	config: {
		initialColorMode: 'light',
		useSystemColorMode: false,
	},
})

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<ChakraProvider>
			<Component {...pageProps} />
		</ChakraProvider>
	)
}

export default MyApp
