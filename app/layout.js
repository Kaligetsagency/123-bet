import './globals.css'

export const metadata = {
  title: '123 Bet - Play and Win',
  description: 'The fastest PvP betting app in Tanzania',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
