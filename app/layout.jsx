import './globals.css'

/**
 * Layout Raiz
 *
 * envolve TODA a aplicação
 * tags HTML, head, body
 * Todos os outros layouts herdam deste
 */
export const metadata = {
  title: 'payList',
  description: 'Organize eventos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
