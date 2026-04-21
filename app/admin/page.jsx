'use client'

import { useState, useEffect } from 'react'  
import { useRouter } from 'next/navigation' 

export default function AdminPage() {
    const router = useRouter()  

    // Proteção de autenticação
    useEffect(() => {
        const token = localStorage.getItem('auth_token')

        if (!token) {
            // Sem token - redirect para login
            router.push('/auth/login')
            return
        }
    }, [router])
    const [eventId, setEventId] = useState('')
    const [players, setPlayers] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [newPlayerName, setNewPlayerName] = useState('')
    const [editingPlayerId, setEditingPlayerId] = useState(null)
    const [editingName, setEditingName] = useState('')

    const ensureEventId = () => {
        if (!eventId.trim()) {
            setError('Informe o event_id para gerenciar participantes.')
            return false
        }
        return true
    }

    const fetchPlayers = async () => {
        if (!ensureEventId()) return

        try {
            setIsLoading(true)
            setError('')

            const response = await fetch(`/api/players?event_id=${encodeURIComponent(eventId.trim())}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar participantes')
            }

            setPlayers(data.players || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const createPlayer = async (event) => {
        event.preventDefault()

        if (!ensureEventId()) return

        const trimmedName = newPlayerName.trim()
        if (trimmedName.length < 2) {
            setError('Digite um nome com pelo menos 2 caracteres.')
            return
        }

        try {
            setError('')
            const response = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName, event_id: eventId.trim() })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar participante')
            }

            setNewPlayerName('')
            setPlayers((prev) => [...prev, data.player])
        } catch (err) {
            setError(err.message)
        }
    }

    const startEditing = (player) => {
        setEditingPlayerId(player.id)
        setEditingName(player.name)
        setError('')
    }

    const cancelEditing = () => {
        setEditingPlayerId(null)
        setEditingName('')
    }

    const updatePlayer = async (playerId) => {
        const trimmedName = editingName.trim()
        if (trimmedName.length < 2) {
            setError('Nome precisa ter pelo menos 2 caracteres.')
            return
        }

        try {
            setError('')
            const response = await fetch(`/api/players/${playerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName })
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar participante')
            }

            setPlayers((prev) =>
                prev.map((player) => (player.id === playerId ? data.player : player))
            )
            cancelEditing()
        } catch (err) {
            setError(err.message)
        }
    }

    const togglePaid = async (player) => {
        try {
            setError('')
            const response = await fetch(`/api/players/${player.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paid: !player.paid })
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar pagamento')
            }

            setPlayers((prev) =>
                prev.map((item) => (item.id === player.id ? data.player : item))
            )
        } catch (err) {
            setError(err.message)
        }
    }

    const deletePlayer = async (playerId) => {
        const shouldDelete = window.confirm('Tem certeza que deseja remover este participante?')
        if (!shouldDelete) return

        try {
            setError('')
            const response = await fetch(`/api/players/${playerId}`, {
                method: 'DELETE'
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir participante')
            }

            if (data.success) {
                setPlayers((prev) => prev.filter((player) => player.id !== playerId))
            }
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4">
            <section className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl p-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin de Participantes</h1>
                <p className="text-sm text-gray-600 mt-1">
                    CRUD completo: criar, listar, editar e excluir
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                        value={eventId}
                        onChange={(event) => setEventId(event.target.value)}
                        placeholder="Digite o event_id"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                        onClick={fetchPlayers}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
                    >
                        {isLoading ? 'Carregando...' : 'Carregar Lista'}
                    </button>
                </div>

                <form onSubmit={createPlayer} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                        value={newPlayerName}
                        onChange={(event) => setNewPlayerName(event.target.value)}
                        placeholder="Novo participante"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        Adicionar
                    </button>
                </form>

                {error && (
                    <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <div className="mt-6 overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="text-left px-3 py-2">Nome</th>
                                <th className="text-left px-3 py-2">Pago</th>
                                <th className="text-right px-3 py-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player) => {
                                const isEditing = editingPlayerId === player.id

                                return (
                                    <tr key={player.id} className="border-t border-gray-200">
                                        <td className="px-3 py-2">
                                            {isEditing ? (
                                                <input
                                                    value={editingName}
                                                    onChange={(event) => setEditingName(event.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded w-full"
                                                />
                                            ) : (
                                                player.name
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                onClick={() => togglePaid(player)}
                                                className={`px-2 py-1 rounded text-xs ${player.paid
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {player.paid ? 'Sim' : 'Não'}
                                            </button>
                                        </td>
                                        <td className="px-3 py-2 text-right space-x-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => updatePlayer(player.id)}
                                                        className="px-2 py-1 rounded bg-blue-600 text-white"
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="px-2 py-1 rounded bg-gray-200 text-gray-800"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditing(player)}
                                                        className="px-2 py-1 rounded bg-amber-100 text-amber-800"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => deletePlayer(player.id)}
                                                        className="px-2 py-1 rounded bg-red-100 text-red-700"
                                                    >
                                                        Excluir
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {players.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                                        Nenhum participante carregado ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    )
}
