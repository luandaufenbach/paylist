'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
    const router = useRouter()

    //estados do form
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    //loading
    const [isLoading, setIsLoading] = useState(false)

    //msg de erro
    const [error, setError] = useState('')

    //validar inputs antes de enviar
    const validateInputs = () => {
        setError('')

        if (!name.trim()) {
            setError('Nome é obrigatório')
            return false
        }

        if (!email.trim()) {
            setError('Email é obrigatório')
            return false
        }

        if (!phone.trim()) {
            setError('Telefone é obrigatório')
            return false
        }

        // Validar telefone (11 dígitos)
        const phoneDigits = phone.replace(/\D/g, '')
        if (phoneDigits.length !== 11) {
            setError('Telefone deve ter 11 dígitos (com DDD)')
            return false
        }

        if (!password) {
            setError('Senha é obrigatória')
            return false
        }

        if (!confirmPassword) {
            setError('Confirmação de senha é obrigatória')
            return false
        }

        if (password.length < 6) {
            setError('Senha precisa ter no mínimo 6 caracteres')
            return false
        }

        if (password !== confirmPassword) {
            setError('As senhas não são iguais')
            return false
        }

        return true
    }

    const handleRegister = async (e) => {
        e.preventDefault()

        if (!validateInputs()) {
            return
        }

        try {
            setIsLoading(true)
            setError('')

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.replace(/\D/g, ''),
                    password: password
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar conta')
            }

            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))

            router.push('/dashboard')

        } catch (error) {
            setError(error.message)
            console.error('Erro ao registrar:', error)
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
                    Criar Conta
                </h1>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                    Crie sua conta para começar a organizar eventos
                </p>

                {/* Formulário */}
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Nome */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Nome
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome completo"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
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
                                padding: '12px 16px',
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

                    {/* Telefone */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginBottom: '6px', display: 'block' }}>
                            Telefone
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '')
                                const formatted = digits.length > 0 ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}` : ''
                                setPhone(formatted)
                            }}
                            placeholder="(11) 99999-9999"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
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
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            Com DDD (11 dígitos)
                        </p>
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
                                padding: '12px 16px',
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
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            Mínimo 6 caracteres
                        </p>
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
                            placeholder="••••••••"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
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
                        {isLoading ? 'Criando conta...' : 'Criar Conta'}
                    </button>
                </form>

                {/* Link para fazer login */}
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '24px' }}>
                    Já tem conta?{' '}
                    <a href="/auth/login" style={{ color: '#0066ff', textDecoration: 'none', fontWeight: 600 }}>
                        Entrar
                    </a>
                </p>

                {/* Link voltar */}
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '12px' }}>
                    <a href="/" style={{ color: '#666', textDecoration: 'none' }}>
                        ← Voltar
                    </a>
                </p>
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
