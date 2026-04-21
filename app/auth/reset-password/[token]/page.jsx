'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import jwt from 'jsonwebtoken'

export default function ResetPasswordPage({ params: paramsPromise }) {
    const params = use(paramsPromise)
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: null, text: '' })
    const [error, setError] = useState(null)

    // Validar token
    const validateToken = () => {
        try {
            if (!params.token) {
                setError('Token inválido ou expirado')
                return false
            }

            // Decodificar token para validação básica (sem verificação de signature)
            // A verificação real acontecerá no backend
            jwt.decode(params.token)
            return true
        } catch (err) {
            setError('Token inválido ou expirado')
            return false
        }
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: '#f5f5f5'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    background: '#fff',
                    padding: '32px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '24px' }}>
                        {error}
                    </p>
                    <Link
                        href="/auth/login"
                        style={{
                            color: '#0066ff',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}
                    >
                        Voltar para o login
                    </Link>
                </div>
            </div>
        )
    }

    if (!validateToken()) {
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!password.trim()) {
            setMessage({ type: 'error', text: 'Digite uma nova senha' })
            return
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' })
            return
        }

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' })
            return
        }

        try {
            setIsLoading(true)
            setMessage({ type: null, text: '' })

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: params.token,
                    password: password.trim()
                })
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage({ type: 'error', text: data.error || 'Erro ao redefinir senha' })
                return
            }

            setMessage({
                type: 'success',
                text: 'Senha redefinida com sucesso! Redirecionando...'
            })

            setTimeout(() => {
                router.push('/auth/login')
            }, 2000)
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#f5f5f5'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: '#fff',
                padding: '32px 24px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {/* Título */}
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>
                    Redefinir Senha
                </h1>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                    Digite sua nova senha abaixo
                </p>

                {/* Formulário */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Nova Senha */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Confirmar Senha */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Confirmar Senha
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Mensagem */}
                    {message.text && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            textAlign: 'center',
                            fontWeight: 500,
                            backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                            color: message.type === 'error' ? '#991b1b' : '#166534'
                        }}>
                            {message.text}
                        </div>
                    )}

                    {/* Botão */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px 24px',
                            background: isLoading ? '#d1d5db' : '#0066ff',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => !isLoading && (e.target.style.background = '#0052cc')}
                        onMouseOut={(e) => !isLoading && (e.target.style.background = '#0066ff')}
                    >
                        {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                    </button>
                </form>

                {/* Link Voltar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '24px',
                    fontSize: '12px'
                }}>
                    <Link
                        href="/auth/login"
                        style={{ color: '#0066ff', textDecoration: 'none', fontWeight: 500 }}
                    >
                        Voltar para o login
                    </Link>
                </div>
            </div>

            <style>{`
                @media (max-width: 640px) {
                    div > div {
                        padding: 24px 16px !important;
                    }
                    h1 {
                        font-size: 20px !important;
                    }
                    p {
                        font-size: 13px !important;
                    }
                }
            `}</style>
        </div>
    )
}
