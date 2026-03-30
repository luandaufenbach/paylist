'use client'

import { useState } from 'react'

export default function AddPlayerForm({ eventId, onPlayerAdded }) {
  const [playerName, setPlayerName] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const [message, setMessage] = useState({
    type: null,    
    text: ''
  })

  const validateInput = () => {
    if (!playerName.trim()) {
      return 'Digite seu nome'
    }

    if (playerName.length < 2) {
      return 'Nome precisa ter pelo menos 2 caracteres'
    }

    if (playerName.length > 50) {
      return 'Nome com muito caracteres'
    }

    return null
  }

  const resetForm = () => {
    setPlayerName('')
    setMessage({ type: null, text: '' })
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })

    if (type === 'success') {
      setTimeout(() => {
        setMessage({ type: null, text: '' })
      }, 3000)
    }
  }

  const sendPlayerToAPI = async () => {
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playerName.trim(),
          event_id: eventId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar jogador')
      }

      return data
    } catch (error) {
      throw error
    }
  }
  
  const handleSubmit = async (event) => {
    event.preventDefault()

    // 1 Validar
    const validationError = validateInput()
    if (validationError) {
      showMessage('error', validationError)
      return
    }

    try {
      setIsLoading(true)
      setMessage({ type: null, text: '' })

      // 2 Enviar p API
      const result = await sendPlayerToAPI()

      // 3 Sucesso: limpar e chamar callback
      showMessage('success', 'Você entrou na lista! 🎉')
      resetForm()

      // Chamar função do parent para atualizar lista
      if (onPlayerAdded) {
        onPlayerAdded(result.player)
      }

    } catch (error) {
      // 4 Erro: mostrar mensagem
      showMessage('error', error.message)
      console.error('Erro ao adicionar jogador:', error)

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4">
      {/* Input de texto */}
      <div className="mb-4">
        <label htmlFor="playerName" className="block text-sm font-medium mb-2">
          Seu Nome
        </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Digite seu nome"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Entrando na lista...' : 'Entrar na Lista'}
      </button>

      {message.text && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}
