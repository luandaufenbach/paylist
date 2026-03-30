import { supabase } from '@/lib/supabase'

export async function PATCH(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()

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
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ player: data }, { status: 200 })
    } catch (error) {
        console.error('Erro ao atualizar jogador:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(_, { params }) {
    try {
        const { id } = await params

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
