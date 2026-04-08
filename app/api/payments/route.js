import { supabase } from "@/lib/supabase";

export async function PATCH(request) {
    try {
        //pegar dados da req
        const { player_id, paid } = await request.json()

        if (!player_id || paid === undefined) {
            return Response.json(
                { error: 'Parâmetros obrigatórios faltando: player_id e paid' },
                { status: 400 }
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
            {error: error.message},
            {status: 500}
        )
    }
}