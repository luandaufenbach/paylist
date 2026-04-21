import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return Response.json(
                { error: 'Email é obrigatório' },
                { status: 400 }
            )
        }

        // Buscar usuário pelo email
        const { data: user, error: userError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email.trim())
            .single()

        if (userError || !user) {
            // Não revelar se email existe ou não (segurança)
            return Response.json(
                { success: true, message: 'Se o email existe, você receberá um link de recuperação' },
                { status: 200 }
            )
        }

        // Gerar token de reset com expiração de 1 hora
        const resetToken = jwt.sign(
            { id: user.id, email: user.email, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        // Link de reset
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`

        // Enviar email com Resend
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Recupere sua Senha - PayList',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #111; margin-bottom: 20px;">Recuperação de Senha</h2>
                    <p style="color: #666; margin-bottom: 24px;">Você solicitou a redefinição de sua senha. Clique no link abaixo para continuar:</p>

                    <a href="${resetLink}" style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
                        Redefinir Senha
                    </a>

                    <p style="color: #999; font-size: 12px; margin-bottom: 8px;">Ou copie este link:</p>
                    <p style="color: #0066ff; font-size: 12px; word-break: break-all;">${resetLink}</p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

                    <p style="color: #999; font-size: 12px;">Este link expira em 1 hora.</p>
                    <p style="color: #999; font-size: 12px;">Se você não solicitou isso, ignore este email.</p>
                </div>
            `
        })

        return Response.json(
            { success: true, message: 'Email de recuperação enviado' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Erro ao enviar email de recuperação:', error)
        return Response.json(
            { error: error.message || 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}
