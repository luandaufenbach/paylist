'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PlayerList from '@/components/PlayerList'
import AddPlayerForm from '@/components/AddPlayerForm'

/**
 * Página Pública do Evento
 *
 * Rota : /evento/[id]
 * ex: /evento/550e8400-e29b-41d4-a716-446655440000
 */
export default function EventPage({ params: paramsPromise }) {
  // Desembrulhar a Promise de params
  const params = use(paramsPromise)
  // Estado: guardar dados do evento
  const [event, setEvent] = useState(null)

  // Estado: guardar ID do jogador atual (se existir)
  const [currentPlayerId, setCurrentPlayerId] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const [error, setError] = useState(null)

  /**
   * Função: Buscar dados do evento
   * Recebe o ID da URL e busca no Supabase
   */
  const fetchEvent = async (eventId) => {
    try {
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('event')
        .select('*')
        .eq('id', eventId)
        .single()

      if (fetchError) {
        throw new Error('Evento não encontrado')
      }

      setEvent(data)
    } catch (err) {
      setError(err.message)
      console.error('Erro ao buscar evento:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Hook: useEffect
   * Executar quando a página carrega
   * Buscar os dados do evento usando o ID da URL
   */
  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id)
    }
  }, [params.id])

  /**
   * Função: Formatar data para formato legível
   * Ex: 2024-03-28 → 28/03/2024
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada'

    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Função: Formatar valor em moeda brasileira
   * Ex: 15 → R$ 15,00
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  /**
   * Função: Callback quando um participante é adicionado
   * Chamado por AddPlayerForm após sucesso
   */
  const handleParticipantAdded = (participant) => {
    console.log('Participante adicionado:', participant)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Carregando evento...</p>
          <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'Evento não existe'}</p>
          <Link
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  // Renderizar página do evento
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho do evento */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Título */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            🎉 {event?.title || 'Evento'}
          </h1>

          {/* Grid de informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Local */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm text-gray-500 font-medium">Local</p>
                <p className="text-gray-900 font-semibold">
                  {event?.location || 'Local não informado'}
                </p>
              </div>
            </div>

            {/* Data */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-sm text-gray-500 font-medium">Data</p>
                <p className="text-gray-900 font-semibold">
                  {formatDate(event?.date)}
                </p>
              </div>
            </div>

            {/* Valor */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-sm text-gray-500 font-medium">Valor por pessoa</p>
                <p className="text-gray-900 font-semibold">
                  {formatPrice(event?.price)}
                </p>
              </div>
            </div>

            {/* Limite de participantes */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-sm text-gray-500 font-medium">Limite de participantes</p>
                <p className="text-gray-900 font-semibold">
                  Até {event?.max_players} pessoas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Lista de participantes */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <PlayerList eventId={event?.id} maxParticipants={event?.max_players} />
        </div>

        {/* Seção: Formulário para entrar na lista */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Entrar na Lista</h2>
          <AddPlayerForm eventId={event?.id} onPlayerAdded={handleParticipantAdded} />
        </div>

        {/* Instrução final */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-900">
             Após entrar, você receberá instruções para enviar o comprovante PIX
          </p>
        </div>
      </div>
    </div>
  )
}
