'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig, createConfig } from 'wagmi'
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets, lightTheme } from '@rainbow-me/rainbowkit'
import { configureChains } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'

import '@rainbow-me/rainbowkit/styles.css'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [baseSepolia],
  [publicProvider()]
)

const { wallets } = getDefaultWallets({
  appName: 'EEG Identity Verifier',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains,
})

const connectors = connectorsForWallets(wallets)

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }))

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} theme={lightTheme()}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
} 