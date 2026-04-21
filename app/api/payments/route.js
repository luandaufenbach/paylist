import { supabase } from "@/lib/supabase";
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

export async function PATCH(request) {
    try {
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)

        //pegar dados da req
        const { player_id, paid } = await request.json()

        if (!player_id || paid === undefined) {
            return Response.json(
                { error: 'Parâmetros obrigatórios faltando: player_id e paid' },
                { status: 400 }
            )
        }

        //buscar dados do jogador para verificar qual evento pertence
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('event_id')
            .eq('id', player_id)
            .single()

        if (playerError || !player) {
            return Response.json(
                { error: 'Jogador não encontrado' },
                { status: 404 }
            )
        }

        //buscar dados do evento para verificar se usuário é admin
        const { data: event, error: eventError } = await supabase
            .from('event')
            .select('user_id')
            .eq('id', player.event_id)
            .single()

        if (eventError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        //verificar se o usuário é admin do evento
        if (String(event.user_id) !== String(user.id)) {
            return Response.json(
                { error: 'Você não tem permissão para alterar pagamento neste evento' },
                { status: 403 }
            )
        }

        //atualizar status de pagamento
        const { data: updatedPlayer, error: updateError } = await supabase
            .from('players')
            .update({ paid: paid })
            .eq('id', player_id)
            .select()
            .single()

        if (updateError || !updatedPlayer) {
            return Response.json(
                { error: 'Erro ao atualizar pagamento do jogador' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            message: paid ? 'Marcado como pago' : 'Marcado como pendente',
            player: updatedPlayer
        }, { status: 200 })

    } catch (error) {
        console.error('erro ao atualizar pagamentos:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}