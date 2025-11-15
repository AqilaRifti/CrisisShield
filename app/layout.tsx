import { ClerkProvider } from '@clerk/nextjs'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata = {
  title: 'CrisisShield - AI-Powered Business Protection',
  description: 'Protect your business from disasters with AI-powered threat prediction, emergency planning, and recovery guidance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Navigation />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}

