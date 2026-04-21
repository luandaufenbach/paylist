import './globals.css'

/**
 * Layout Raiz
 * tags HTML, head, body
 */
export const metadata = {
  title: 'payList',
  description: 'Organize eventos',
  icons: {
    icon: '/favicon.ico',  
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}


