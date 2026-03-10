import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amazon Nova Hackathon',
  description: 'Built with Amazon Nova 2 Lite and AgentCore',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
