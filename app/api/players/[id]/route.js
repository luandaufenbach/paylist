import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

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

export async function GET(request, { params }) {
    try {
        const { id } = await params

        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) {
            return Response.json(
                { error: 'Jogador não encontrado' },
                { status: 404 }
            )
        }

        return Response.json({ player: data }, { status: 200 })
    } catch (error) {
        console.error('Erro ao buscar jogador:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request, { params }) {
    try {
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)
        const { id } = await params
        const body = await request.json()

        //buscar dados do jogador para verificar evento
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('event_id')
            .eq('id', id)
            .single()

        if (playerError || !playerData) {
            return Response.json(
                { error: 'Jogador não encontrado' },
                { status: 404 }
            )
        }

        //verificar se usuário é admin do evento
        const { data: event, error: eventError } = await supabase
            .from('event')
            .select('user_id')
            .eq('id', playerData.event_id)
            .single()

        if (eventError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        //verificar autorização
        if (String(event.user_id) !== String(user.id)) {
            return Response.json(
                { error: 'Você não tem permissão para editar este jogador' },
                { status: 403 }
            )
        }

        const updates = {}

        if (typeof body.name === 'string') {
            const trimmedName = body.name.trim()
            if (trimmedName.length < 2) {
                return Response.json(
                    { error: 'Nome precisa ter pelo menos 2 caracteres' },
                    { status: 400 }
                )
            }
            updates.name = trimmedName
        }

        if (typeof body.paid === 'boolean') {
            updates.paid = body.paid
        }

        if (typeof body.receipt_url === 'string' || body.receipt_url === null) {
            updates.receipt_url = body.receipt_url
        }

        if (Object.keys(updates).length === 0) {
            return Response.json(
                { error: 'Nenhum campo válido para atualizar' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Erro ao atualizar jogador:', error)
            return Response.json({ error: error.message }, { status: 500 })
        }

        if (!data) {
            return Response.json({ error: 'Falha ao atualizar - sem retorno de dados' }, { status: 500 })
        }

        return Response.json({ player: data }, { status: 200 })
    } catch (error) {
        console.error('Erro ao atualizar jogador:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)
        const { id } = await params

        //buscar dados do jogador para verificar evento
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('event_id')
            .eq('id', id)
            .single()

        if (playerError || !playerData) {
            return Response.json(
                { error: 'Jogador não encontrado' },
                { status: 404 }
            )
        }

        //verificar se usuário é admin do evento
        const { data: event, error: eventError } = await supabase
            .from('event')
            .select('user_id')
            .eq('id', playerData.event_id)
            .single()

        if (eventError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        //verificar autorização
        if (String(event.user_id) !== String(user.id)) {
            return Response.json(
                { error: 'Você não tem permissão para deletar este jogador' },
                { status: 403 }
            )
        }

        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id)

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Erro ao deletar jogador:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
