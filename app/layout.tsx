import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/lib/error-boundary'
import { ChatProvider } from '@/context/ChatContext'

const inter = Inter({ subsets: ['latin'] })

const metadata = {
  title: 'Minnit Chat Clone',
  description: 'A real-time chat application with instant access',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <ChatProvider>
              {children}
              <Toaster />
            </ChatProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}