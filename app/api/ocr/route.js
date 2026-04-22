import { extractReceiptData, validateReceipt } from "@/lib/ocr";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
    try {
        //pegar dados da req
        const { receipt_url, event_id, player_id, player_name } = await request.json()

        if (!receipt_url || !event_id || !player_id) {
            return Response.json(
                { error: 'Parâmetros obrigatórios faltando' },
                { status: 400 }
            )
        }

        //buscar dados do evento (p validar)
        const { data: event, error: eventError } = await supabase
            .from('event')
            .select('*, admin_users(phone, name)')
            .eq('id', event_id)
            .single()

        if (eventError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 400 }
            )
        }

        //buscar dados do player (para validar nome)
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('name')
            .eq('id', player_id)
            .single()

        if (playerError || !player) {
            return Response.json(
                { error: 'Participante não encontrado' },
                { status: 400 }
            )
        }

        //chamar gemini para extrair texto da img
        const extractedData = await extractReceiptData(receipt_url)

        //validar se os dados batem (passar nome do player também)
        const isValid = validateReceipt(extractedData, event, player.name)

        if (!isValid) {
            return Response.json(
                { error: 'Comprovante inválido. Os dados não correspondem.' },
                { status: 400 }
            )
        }

        const { error: updateError } = await supabase
            .from('players')
            .update({
                paid: true,
                receipt_url: receipt_url
            })
            .eq('id', player_id)

        if (updateError) {
            return Response.json(
                { error: 'Erro ao atualizar status de pagamento' },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            message: 'Pagamento validado e confirmado!',
            extractedData: extractedData
        }, { status: 200 })

    } catch (error) {
        console.error('Erro ao processar comprovante:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}