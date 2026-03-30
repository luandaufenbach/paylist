import { supabase } from '@/lib/supabase'

const invalidEventIdResponse = () =>
  Response.json({ error: 'event_id é obrigatório' }, { status: 400 })

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return invalidEventIdResponse()
    }

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ players: data || [] }, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar jogadores:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, event_id } = await request.json()

    if (!name || !event_id) {
      return Response.json({ error: 'Nome e event_id são obrigatórios' }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('*')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return Response.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }


    const { count, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact' })
      .eq('event_id', event_id)

    if (countError) {
      return Response.json(
        { error: 'Erro ao contar participantes' },
        { status: 500 }
      )
    }

    if (count >= event.max_players) {
      return Response.json(
        { error: 'Lista de participantes cheia' },
        { status: 400 }
      )
    }

    const { data: existingPlayer, error: existingError } = await supabase
      .from('players')
      .select('*')
      .eq('event_id', event_id)
      .eq('name', name)
      .single()

    if (!existingError && existingPlayer) {
      return Response.json(
        { error: 'Nome já existe neste evento' },
        { status: 400 }
      )
    }

    const { data: newPlayer, error: insertError } = await supabase
      .from('players')
      .insert({
        event_id: event_id,
        name: name,
        paid: false,
        receipt_url: null
      })
      .select()

    if (insertError) {
      return Response.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return Response.json(
      {
        success: true,
        message: 'Participante adicionado com sucesso',
        player: newPlayer[0]
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro ao adicionar jogador:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}