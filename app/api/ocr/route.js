import { extractReceiptData } from "@/lib/ocr";
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

        //validar se os dados batem
        const isValid = validateReceipt(extractedData, event, player_name)

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

/**
 * Função: Chamar OpenAI Vision para extrair dados do comprovante
 * Retorna: { nome, valor, chave_pix }
 */
async function extractReceiptData(imageUrl) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Extraia APENAS: nome_do_pagador, valor, chave_pix, data_transferencia (formato DD/MM/YYYY). Responda em JSON: { "nome": "...", "valor": 0, "chave_pix": "...", "data": "DD/MM/YYYY" }'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 200
            })
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.error?.message || 'Erro ao chamar OpenAI')
        }

        //parsear resposta da openai
        const content = result.choices[0].message.content
        const parsed = JSON.parse(content)

        return parsed

    } catch (error) {
        console.error('Erro ao extrair dados:', error)
        throw new Error('Erro ao extrair dados do comprovante')
    }
}

/**
 * Função: Validar if o comprovante é valido
 * Verifica: valor, chave pix, nome, data
 */
function validateReceipt(extractedData, event, playerName) {
    try {
        //validar se valor bate
        const tolerance = 0.01 // 1 centavo de tolerancia
        const valueDifference = Math.abs(extractedData.valor - event.price)

        if (valueDifference > tolerance) {
            console.error('Valor inválido. Esperado:', event.price, 'Recebido:', extractedData.valor)
            return false
        }

        //validar se a chave pix bate
        if (event.pix_key && extractedData.chave_pix !== event.pix_key) {
            console.error('Chave PIX inválida')
            return false
        }

        //validar se nome contem o nome do jogador
        const normalizedExtracted = extractedData.nome.toLowerCase().trim()
        const normalizedPlayer = playerName.toLowerCase().trim()

        if (!normalizedExtracted.includes(normalizedPlayer) && !normalizedPlayer.includes(normalizedExtracted)) {
            console.error('Nome não corresponde. Esperado:', playerName, 'Recebido:', extractedData.nome)
            return false
        }

        const receiptDate = new Date(extractedData.data.split('/').reverse().join('-'))
        const today = new Date()
        const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)

        if (receiptDate < twoDaysAgo) {
            console.error('Comprovante expirado. Deve ser dos últimos 2 dias.')
            return false
        }

        return true

    } catch (error) {
        console.error('Erro ao validar:', error)
        return false
    }
}