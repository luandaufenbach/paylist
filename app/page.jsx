'use client'

import Link from 'next/link'

/**
 * Página Inicial
 * Rota: /
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">

        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">PayList</h1>
          <p className="text-xl text-gray-600">Organize seus eventos com facilidade</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Como funciona?</h2>
          <ol className="text-left space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">1️⃣</span>
              <span>Crie um evento e compartilhe o link no WhatsApp</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">2️⃣</span>
              <span>Seus amigos entram na lista</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">3️⃣</span>
              <span>Eles enviam o comprovante PIX e é validado automaticamente</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-500 font-bold">4️⃣</span>
              <span>A lista atualiza em tempo real</span>
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors w-full sm:w-auto"
          >
            Ir para Admin
          </Link>
          <p className="text-sm text-gray-500">
            Digite o ID do evento na URL para acessar: <br />
            <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000/evento/[id-do-evento]</code>
          </p>
        </div>
      </div>
    </div>
  )
}
