'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PlayerList({ eventId, maxParticipants = 16 }) {

  const [players, setPlayers] = useState([])

  const [isLoading, setIsLoading] = useState(true)

  const [error, setError] = useState(null)

  const fetchPlayers = useCallback(async () => {
    try {
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setPlayers(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Erro ao buscar jogadores:', err)
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchPlayers()
    // Configurar Realtime subscription
    // faz com que a lista atualize AUTOMATICAMENTE quando ha mudanças no banco
    const subscription = supabase
      .channel(`players-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // payload.new = novo registro (INSERT ou UPDATE)
          // payload.old = registro antigo (DELETE ou UPDATE)
          // payload.eventType = 'INSERT' | 'UPDATE' | 'DELETE'

          if (payload.eventType === 'INSERT') {
            // Novo jogador entrou: adicionar à lista
            setPlayers((prevPlayers) => [...prevPlayers, payload.new])
          }

          if (payload.eventType === 'UPDATE') {
            // Jogador foi atualizado (ex: marcado como pago)
            setPlayers((prevPlayers) =>
              prevPlayers.map((player) =>
                player.id === payload.new.id ? payload.new : player
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            // Jogador foi removido
            setPlayers((prevPlayers) =>
              prevPlayers.filter((player) => player.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId, fetchPlayers])

  const PaymentIcon = ({ paid }) => {
    return paid ? (
      <span className="text-green-500 font-bold" title="Pagamento confirmado">
        ✅
      </span>
    ) : (
      <span className="text-gray-400 font-bold" title="Aguardando pagamento">
        ⏳
      </span>
    )
  }

  const paidCount = players.filter((p) => p.paid).length

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Carregando jogadores...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Erro ao carregar lista</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchPlayers}
          className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">
          Participantes ({players.length}/{maxParticipants})
        </h2>
        <p className="text-sm text-gray-600">
          Pagamentos confirmados: {paidCount}/{players.length}
        </p>
      </div>
      {players.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">Nenhum participante na lista ainda</p>
          <p className="text-gray-400 text-sm">Seja o primeiro a entrar!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {players.map((player, index) => (
              <li
                key={player.id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-500 font-semibold w-6 text-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">
                      {player.name}
                    </span>
                  </div>
                  <PaymentIcon paid={player.paid} />
                </div>
                {player.receipt_url && (
                  <div className="mt-2 ml-9">
                    <a
                      href={player.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      Ver comprovante
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
