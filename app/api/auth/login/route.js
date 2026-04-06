import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
    try {
        //pega email e senha do corpo da req
        const { email, password } = await request.json()

        //valida se email foi enviado
        if (!email) {
            return Response.json(
                { error: 'Email é obrigatório' },
                { status: 400 }
            )
        }

        //validar se senha foi enviado
        if (!password) {
            return Response.json(
                { error: 'senha é obrigatória', },
                { status: 400 }
            )
        }

        //buscar user pelo email
        const { data: user, error: userError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single() //espera encontrar 1 user, se nao encontrar = erro generico (nao dizer se existe ou nao no banco)

        //se n encontrou ou teve erro na busca
        if (userError || !user) {
            return Response.json(
                { error: 'Email ou senha inválidos' },
                { status: 401 }
            )
        }

        //verifica hash do banco c a senha digitada
        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return Response.json(
                { error: 'Email ou senha inválidos' },
                { status: 401 }
            )
        }
        //criar um token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )
        //sucesso
        return Response.json(
            {
                success: true,
                message: 'Login realizado com sucesso',
                user: {
                    id: user.id,
                    email: user.email
                },
                token: token
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Erro ao fazer login:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}