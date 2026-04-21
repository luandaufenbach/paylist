import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
    try {
        const { token, password } = await request.json()

        if (!token) {
            return Response.json(
                { error: 'Token inválido' },
                { status: 400 }
            )
        }

        if (!password || password.length < 6) {
            return Response.json(
                { error: 'Senha deve ter no mínimo 6 caracteres' },
                { status: 400 }
            )
        }

        // Verificar e decodificar token
        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (err) {
            return Response.json(
                { error: 'Token inválido ou expirado' },
                { status: 401 }
            )
        }

        // Validar se é token de reset
        if (decoded.type !== 'password_reset') {
            return Response.json(
                { error: 'Token inválido' },
                { status: 401 }
            )
        }

        // Verificar se o usuário ainda existe
        const { data: user, error: userError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('id', decoded.id)
            .single()

        if (userError || !user) {
            return Response.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // Atualizar senha no banco
        const { error: updateError } = await supabase
            .from('admin_users')
            .update({ password: hashedPassword })
            .eq('id', decoded.id)

        if (updateError) {
            console.error('Erro ao atualizar senha:', updateError)
            return Response.json(
                { error: 'Erro ao redefinir senha' },
                { status: 500 }
            )
        }

        return Response.json(
            { success: true, message: 'Senha redefinida com sucesso' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Erro ao redefinir senha:', error)
        return Response.json(
            { error: error.message || 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}
