'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MdContentCopy } from "react-icons/md"

export default function Page() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [copiedEventId, setCopiedEventId] = useState(null)

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

    const handleDelete = async (eventId, e) => {
        e.stopPropagation()

        if (!confirm('Tem certeza que deseja deletar este evento?')) {
            return
        }

        try {
            const token = localStorage.getItem('auth_token')
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                setEvents(events.filter(e => e.id !== eventId))
            } else {
                alert('Erro ao deletar evento')
            }
        } catch (error) {
            console.error('Erro ao deletar evento:', error)
            alert('Erro ao deletar evento')
        }
    }

    const handleCopyEventId = (eventId, e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(eventId)
        setCopiedEventId(eventId)
        setTimeout(() => setCopiedEventId(null), 2000)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0', fontWeight: 500 }}>Bem-vindo</p>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: '4px 0 0 0' }}>{user?.name}</h1>
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
                 {/*    <div style={{ height: '1px', background: '#e5e7eb', margin: '32px 0' }}></div> */}

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
                                    <div
                                        key={event.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        {/* Info do Evento - Clicável */}
                                        <Link
                                            href={`/evento/${event.id}`}
                                            style={{
                                                flex: 1,
                                                textDecoration: 'none',
                                                color: 'inherit',
                                            }}
                                        >
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', margin: '0 0 8px 0' }}>{event.title}</h3>
                                            {event.location && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>{event.location}</p>}
                                            {event.date && (
                                              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                                                 {event.date.split('-').reverse().join('/')}
                                              </p>
                                            )}
                                        </Link>

                                        {/* Botões */}
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                            <button
                                                onClick={(e) => handleCopyEventId(event.id, e)}
                                                title="Copiar ID do evento"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '10px 16px',
                                                    background: copiedEventId === event.id ? '#d1fae5' : '#f3f4f6',
                                                    border: '1px solid ' + (copiedEventId === event.id ? '#6ee7b7' : '#e5e7eb'),
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: copiedEventId === event.id ? '#065f46' : '#111',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    if (copiedEventId !== event.id) {
                                                        e.target.style.background = '#e5e7eb'
                                                    }
                                                }}
                                                onMouseOut={(e) => {
                                                    if (copiedEventId !== event.id) {
                                                        e.target.style.background = '#f3f4f6'
                                                    }
                                                }}
                                            >
                                                <MdContentCopy size={16} style={{ marginRight: copiedEventId === event.id ? '4px' : '0' }} />
                                                {copiedEventId === event.id && <span>Copiado!</span>}
                                            </button>

                                            <Link
                                                href={`/evento/${event.id}/editar`}
                                                style={{
                                                    padding: '10px 16px',
                                                    background: '#f3f4f6',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: '#111',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                                                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
                                            >
                                                Editar
                                            </Link>

                                            <button
                                                onClick={(e) => handleDelete(event.id, e)}
                                                style={{
                                                    padding: '10px 16px',
                                                    background: '#fee2e2',
                                                    border: '1px solid #fecaca',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: '#991b1b',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.background = '#fecaca'}
                                                onMouseOut={(e) => e.target.style.background = '#fee2e2'}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
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

                @media (max-width: 640px) {
                    main {
                        padding: 24px 16px !important;
                    }
                    div[style*="gap"] {
                        gap: 12px !important;
                    }
                }
            `}</style>
        </div>
    )
}