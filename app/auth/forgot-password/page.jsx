'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: null, text: '' })

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Digite seu email' })
            return
        }

        try {
            setIsLoading(true)
            setMessage({ type: null, text: '' })

            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage({ type: 'error', text: data.error || 'Erro ao enviar email' })
                return
            }

            setMessage({
                type: 'success',
                text: 'Email enviado! Verifique sua caixa de entrada para redefinir sua senha.'
            })
            setEmail('')
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
                    Recuperar Senha
                </h1>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                    Digite seu email para receber um link de redefinição
                </p>

                {/* Formulário */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Email */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            placeholder="seu@email.com"
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
                        {isLoading ? 'Enviando...' : 'Enviar Email'}
                    </button>
                </form>

                {/* Links */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
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
                }
            `}</style>
        </div>
    )
}
