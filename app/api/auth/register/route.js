import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
    try {
        //pega dados da req
        const { name, email, phone, password } = await request.json()

        //valida se campos obrigatórios foram enviados
        if (!name) {
            return Response.json(
                { error: 'Nome é obrigatório' },
                { status: 400 }
            )
        }

        if (!email) {
            return Response.json(
                { error: 'Email é obrigatório' },
                { status: 400 }
            )
        }

        if (!phone) {
            return Response.json(
                { error: 'Telefone é obrigatório' },
                { status: 400 }
            )
        }

        if (!password) {
            return Response.json(
                { error: 'Senha é obrigatória' },
                { status: 400 }
            )
        }

        // Validar se telefone tem 11 dígitos
        const phoneDigits = phone.replace(/\D/g, '')
        if (phoneDigits.length !== 11) {
            return Response.json(
                { error: 'Telefone deve ter 11 dígitos' },
                { status: 400 }
            )
        }

        // Valida formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return Response.json(
                { error: 'Email inválido' },
                { status: 400 }
            )
        }

        const { data: existingUser, error: checkError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single() //verifica se existe emails iguais

        if (!checkError && existingUser) {
            //se nao tiver erro e encontrar user -> email ja existe
            return Response.json(
                { error: 'Email já cadastrado' },
                { status: 400 }
            )
        }

        //criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10)

        //novo user no db
        const { data: newUser, error: insertError } = await supabase
            .from('admin_users')
            .insert({
                name: name.trim(),
                email: email.trim(),
                phone: phoneDigits,
                password: hashedPassword
            })
            .select() //retorna dados do registro criado

        if (insertError) {
            return Response.json(
                { error: 'Erro ao criar usuário' },
                { status: 500 }
            )
        }

        const token = jwt.sign(
            {
                id: newUser[0].id,
                email: newUser[0].email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        return Response.json(
            {
                success: true,
                message: 'Usuário registrado com sucesso',
                user: {
                    id: newUser[0].id,
                    name: newUser[0].name,
                    email: newUser[0].email,
                    phone: newUser[0].phone
                },
                token: token
            },
            { status: 201 }
        )

    } catch (error) {
        console.error('Erro ao registrar', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
