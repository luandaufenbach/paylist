import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

function extractToken(request) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    return authHeader.substring(7)
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return decoded
    } catch (error) {
        throw new Error('Token inválido')
    }
}

// Deletar evento
export async function DELETE(request, { params: paramsPromise }) {
    try {
        const params = await paramsPromise
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)
        const eventId = params.id
        const { data: event, error: fetchError } = await supabase
            .from('event')
            .select('user_id')
            .eq('id', eventId)
            .single()

        if (fetchError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        if (event.user_id !== user.id) {
            return Response.json(
                { error: 'Você não tem permissão para deletar este evento' },
                { status: 403 }
            )
        }

        // Deletar evento
        const { error: deleteError } = await supabase
            .from('event')
            .delete()
            .eq('id', eventId)

        if (deleteError) {
            return Response.json(
                { error: 'Erro ao deletar evento' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            message: 'Evento deletado com sucesso'
        }, { status: 200 })

    } catch (error) {
        console.error('Erro ao deletar evento:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

// Atualizar evento
export async function PATCH(request, { params: paramsPromise }) {
    try {
        const params = await paramsPromise
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)
        const eventId = params.id

        // Verificar se o evento pertence ao usuário
        const { data: event, error: fetchError } = await supabase
            .from('event')
            .select('user_id')
            .eq('id', eventId)
            .single()

        if (fetchError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        if (event.user_id !== user.id) {
            return Response.json(
                { error: 'Você não tem permissão para editar este evento' },
                { status: 403 }
            )
        }

        const { title, location, date, time, price, max_players } = await request.json()

        if (!title || !title.trim()) {
            return Response.json(
                { error: 'Título é obrigatório' },
                { status: 400 }
            )
        }

        if (!price || price < 0) {
            return Response.json(
                { error: 'Preço deve ser um número válido' },
                { status: 400 }
            )
        }

        if (!max_players || max_players < 1) {
            return Response.json(
                { error: 'Máximo de participantes deve ser maior que 0' },
                { status: 400 }
            )
        }

        const { data: updatedEvent, error: updateError } = await supabase
            .from('event')
            .update({
                title: title.trim(),
                location: location?.trim() || null,
                date: date || null,
                time: time || null,
                price: Number(price),
                max_players: Number(max_players)
            })
            .eq('id', eventId)
            .select()

        if (updateError) {
            console.error('Erro ao atualizar evento:', updateError)
            return Response.json(
                { error: 'Erro ao atualizar evento' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            message: 'Evento atualizado com sucesso',
            event: updatedEvent[0]
        }, { status: 200 })

    } catch (error) {
        console.error('Erro ao atualizar evento:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
