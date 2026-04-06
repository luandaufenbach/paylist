'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()

    //estado dos form
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    //controlar loading
    const [isLoading, setIsLoading] = useState(false)

    //msg de erro
    const [error, setError] = useState('')

    //validar inputs antes de enviar
    const validateInputs = () => {
        //limpar erro anterior
        setError('')

        if (!email.trim()) {
            setError('email é obrigatório')
            return false
        }

        if (!password) {
            setError('Senha é obrigatória')
            return false
        }
        return true
    }

    const handleLogin = async (e) => {
        e.preventDefault()

        //chama a validacao
        if (!validateInputs()) {
            return
        }

        try {
            setIsLoading(true)
            setError('')

            //enviar p API
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                })
            })

            const data = await response.json()

            //se a res nao foi ok
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login')
            }
            //salva token no localStorage
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))

            router.push('/dashboard')

            return data
        } catch (err) {
            setError(err.message)
            console.error('Erro ao fazer login:', err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: '#f5f5f5'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    background: '#fff',
                    padding: '32px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            >
                {/* Título */}
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>
                    Entrar
                </h1>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                    Faça login para criar ou gerenciar seus eventos
                </p>

                {/* Formulário */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Email */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#0066ff')}
                            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                        />
                    </div>

                    {/* Senha */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#0066ff')}
                            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                        />
                    </div>

                    {/* Erro */}
                    {error && (
                        <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    {/* Botão */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0066ff',
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
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Link para criar conta */}
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '24px' }}>
                    Não tem conta?{' '}
                    <a href="/auth/register" style={{ color: '#0066ff', textDecoration: 'none', fontWeight: 600 }}>
                        Criar uma
                    </a>
                </p>

                {/* Link voltar */}
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '12px' }}>
                    <a href="/" style={{ color: '#666', textDecoration: 'none' }}>
                        ← Voltar
                    </a>
                </p>
            </div>
        </div>
    )
}

