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

//listar todos os eventos
export async function GET(request) {
    try {
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)

        const { data: events, error } = await supabase
            .from('event')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json(
                { error: 'Erro ao buscar eventos' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            events: events || []
        }, { status: 200 })

    } catch (error) {
        console.error('Erro ao listar eventos:', error)
        return Response.json(
            { error: error.message },
            { status: 401 }
        )
    }
}

//criar novo evento p user autenticado
export async function POST(request) {
    try {
        const token = extractToken(request)
        if (!token) {
            return Response.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            )
        }

        const user = verifyToken(token)

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

        const { data: newEvent, error: insertError } = await supabase
            .from('event')
            .insert({
                title: title.trim(),
                location: location?.trim() || null,
                date: date || null,
                time: time || null,
                price: Number(price),
                max_players: Number(max_players),
                user_id: user.id
            })
            .select()

        if (insertError) {
            console.error('Erro ao inserir evento:', insertError)
            return Response.json(
                { error: 'Erro ao criar evento' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            message: 'Evento criado com sucesso',
            event: newEvent[0]
        }, { status: 201 })

    } catch (error) {
        console.error('Erro ao criar evento:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}