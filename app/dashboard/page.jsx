'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Page() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user')

        if (!token || !userData) {
            router.push('/auth/login')
            return
        }

        setUser(JSON.parse(userData))
        loadEvents(token)
    }, [router])

    //buscar eventos do user autenticado
    async function loadEvents(token) {
        try {
            const response = await fetch('/api/events', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setEvents(data.events)
            } else {
                console.error('Erro ao carregar eventos:', response.status)
            }
        } catch (error) {
            console.error('Erro ao carregar eventos:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        router.push('/auth/login')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0', fontWeight: 500 }}>Bem-vindo</p>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: '4px 0 0 0' }}>{user?.email}</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '8px 16px',
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#111',
                                cursor: 'pointer',
                            }}
                        >
                            Sair
                        </button>
                    </div>

                    {/* Divisor */}
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '32px 0' }}></div>

                    {/* Botão Criar Evento */}
                    <div style={{ marginBottom: '32px' }}>
                        <Link
                            href="/evento/novo"
                            style={{
                                display: 'block',
                                padding: '16px 24px',
                                background: '#0066ff',
                                color: '#fff',
                                textDecoration: 'none',
                                textAlign: 'center',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            + Criar Novo Evento
                        </Link>
                    </div>

                    {/* Divisor */}
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '32px 0' }}></div>

                    {/* Lista de Eventos */}
                    <div>
                        <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#111', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '0.5px' }}>
                            Meus Eventos
                        </h2>

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'inline-block', height: '32px', width: '32px', border: '4px solid #111', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : events.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 24px', background: '#f9fafb', borderRadius: '8px' }}>
                                <p style={{ fontSize: '14px', color: '#6b7280' }}>Nenhum evento criado ainda</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {events.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/evento/${event.id}`}
                                        style={{
                                            display: 'block',
                                            padding: '16px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                        }}
                                    >
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', margin: '0 0 8px 0' }}>{event.title}</h3>
                                        {event.location && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>📍 {event.location}</p>}
                                        {event.date && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>📅 {new Date(event.date).toLocaleDateString('pt-BR')}</p>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}