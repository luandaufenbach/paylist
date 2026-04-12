import { extractReceiptData, validateReceipt } from "@/lib/ocr";
import { supabase } from "@/lib/supabase";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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
            .select('*')
            .eq('id', event_id)
            .single()

        if (eventError || !event) {
            return Response.json(
                { error: 'Evento não encontrado' },
                { status: 400 }
            )
        }

        //chamar openai para extrair texto da img
        const extractedData = await extractReceiptData(receipt_url)
        console.log('📋 Dados extraídos do OCR:', JSON.stringify(extractedData, null, 2))

        //validar se os dados batem
        const isValid = validateReceipt(extractedData, event)

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