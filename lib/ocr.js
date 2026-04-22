/**
 * OCR.js - Integração com Google Gemini Vision API
 *
 * Responsabilidade: Extrair dados de um comprovante PIX usando IA
 * Entrada: URL da imagem do comprovante
 * Saída: Objeto JSON com { nome, valor, chave_pix, data }
 */

/**
 * Função: extractReceiptData
 *
 * O que faz:
 * 1. Recebe a URL de uma imagem (salva no Supabase Storage)
 * 2. Envia para Google Gemini Vision
 * 3. Usa um prompt para pedir extração dos dados PIX
 * 4. Retorna um objeto JSON com os dados

 * Parâmetros:
 * - imageUrl (string): URL pública da imagem no Supabase
 *
 * Retorna:
 * {
 *   nome_recebedor: "Lucas Daufenbach De Oliveira",
 *   nome_pagador: "Luan Daufenbach de Oliveira",
 *   valor: 15.00,
 *   chave_pix: "10726427942",
 *   data: "11/04/2026"
 * }
 */
export async function extractReceiptData(imageUrl) {
    const maxRetries = 3
    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (!imageUrl) {
                throw new Error('Image URL is required')
            }

            const apiKey = process.env.GOOGLE_GEMINI_API_KEY
            if (!apiKey) {
                throw new Error('GOOGLE_GEMINI_API_KEY not configured')
            }

            // Buscar arquivo e obter tipo correto
            const { base64, contentType } = await fetchFileAsBase64(imageUrl)

            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: `Analise este comprovante de pagamento PIX e extraia os dados EXATAMENTE como aparecem no comprovante.

INSTRUÇÕES CRÍTICAS:
1. NOME_RECEBEDOR: Busque a seção "Quem recebeu" ou "Destino" e pegue o NOME completo do RECEBEDOR (não CPF/CNPJ)
2. NOME_PAGADOR: Busque a seção "Quem pagou" ou "Origem" e pegue o NOME completo de quem PAGOU (não CPF/CNPJ)
3. VALOR: Encontre o valor em reais (R$) - geralmente começa com "R$" ou "Valor"
4. CHAVE PIX: Busque especificamente por:
   - Campo "Chave Pix" ou "Chave PIX"
   - Pode ser um número, email, CPF ou telefone
   - Pode começar com "+55"
   - Se NÃO encontrar um campo explícito "Chave Pix", retorne null
   - NÃO confunda com CPF/CNPJ mascarado (ex: ***456.009-**)
5. DATA: Busque "Data do pagamento" ou "Data da transação" em formato DD/MM/YYYY

Se algum dado não estiver claramente visível, retorne null para esse campo.

Responda SOMENTE com JSON válido (sem markdown, sem \`\`\`):
{"nome_recebedor":"...","nome_pagador":"...","valor":...,"chave_pix":"...","data":"DD/MM/YYYY"}`
                            },
                            {
                                inline_data: {
                                    mime_type: contentType || 'image/jpeg',
                                    data: base64
                                }
                            }
                        ]
                    }
                ]
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                const errorMsg = errorData.error?.message || `Gemini API error: ${response.status}`

                // Se for erro 503 (sobrecarregado), tenta novamente
                if (response.status === 503 && attempt < maxRetries) {
                    console.warn(`Gemini sobrecarregado. Tentativa ${attempt}/${maxRetries}. Aguardando 2s...`)
                    lastError = new Error(errorMsg)
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    continue
                }

                console.error('Gemini API Error:', errorMsg)
                throw new Error(errorMsg)
            }

            const data = await response.json()

            if (!data.candidates || !data.candidates[0]) {
                console.error('Gemini não retornou candidates. Response:', JSON.stringify(data, null, 2))
                throw new Error('Gemini: Nenhuma resposta da IA')
            }

            if (!data.candidates[0].content || !data.candidates[0].content.parts) {
                console.error('Gemini retornou resposta incompleta. Content:', JSON.stringify(data.candidates[0].content, null, 2))
                throw new Error('Gemini: Resposta malformada')
            }

            const messageContent = data.candidates[0].content.parts[0].text
            console.log('Resposta do Gemini (raw):', messageContent)

            //remove  ```json
            const jsonString = messageContent
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()

            console.log('JSON após limpeza:', jsonString)

            let ocrData
            try {
                ocrData = JSON.parse(jsonString)
            } catch (parseError) {
                console.error('ERRO ao fazer parse do JSON. String:', jsonString)
                throw new Error(`JSON inválido do Gemini: ${parseError.message}`)
            }

            console.log('OCR data extraído:', JSON.stringify(ocrData, null, 2))
            return ocrData

        } catch (error) {
            lastError = error

            // Se for erro de sobrecarga e não for a última tentativa, continua
            if (error.message.includes('high demand') && attempt < maxRetries) {
                console.warn(`Tentativa ${attempt} falhou. Aguardando antes de tentar novamente...`)
                await new Promise(resolve => setTimeout(resolve, 2000))
                continue
            }

            // Se chegou aqui e esgotou as tentativas, lança o erro
            if (attempt === maxRetries) {
                console.error('ERRO CRÍTICO ao extrair dados do comprovante:', error.message)
                throw new Error(`OCR Error: ${error.message}`)
            }
        }
    }

    // Fallback (não deveria chegar aqui)
    throw lastError || new Error('Erro desconhecido ao processar OCR')
}

/**
 * Função auxiliar: Buscar arquivo (imagem ou PDF) e converter para base64
 */
async function fetchFileAsBase64(fileUrl) {
    try {
        console.log('Buscando arquivo:', fileUrl)
        const response = await fetch(fileUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        console.log('Content-Type:', contentType)

        const buffer = await response.arrayBuffer()
        console.log('Buffer size:', buffer.byteLength, 'bytes')

        if (buffer.byteLength === 0) {
            throw new Error('Arquivo vazio - nenhum dado foi retornado')
        }

        const base64 = Buffer.from(buffer).toString('base64')
        console.log('Base64 convertido, tamanho:', base64.length, 'caracteres')
        return { base64, contentType }
    } catch (error) {
        console.error('Erro ao processar arquivo:', error)
        throw new Error(`Failed to process file: ${error.message}`)
    }
}

/**
 * Função: validateReceipt
 *
 * Valida se os dados extraídos do comprovante correspondem aos dados do evento E do participante
 *
 * Verificações:
 * - Valor do comprovante = valor do evento
 * - Chave PIX do comprovante = chave PIX do evento
 * - Nome do recebedor no comprovante = nome configurado no evento
 * - Nome do pagador no comprovante diferente do nome do participante 
 */
export function validateReceipt(extractedData, event, playerName) {
    try {
        if (!extractedData || !event) {
            console.error('Dados incompletos para validação')
            return false
        }

        // Validar se valor bate - normalizar numero com vírgula para ponto
        const tolerance = 0.01
        const normalizedValue = String(extractedData.valor).replace(',', '.')
        const valueDifference = Math.abs(parseFloat(normalizedValue) - parseFloat(event.price))

        if (valueDifference > tolerance) {
            console.error('Valor inválido. Esperado:', event.price, 'Recebido:', extractedData.valor)
            return false
        }

        // Validar se a chave pix bate (OPCIONAL - nem todo banco mostra claramente)
        if (event.pix_key && extractedData.chave_pix && extractedData.chave_pix.trim()) {
            const normalizedEventKey = event.pix_key.replace(/\D/g, '')
            const normalizedExtractedKey = extractedData.chave_pix.replace(/\D/g, '')

            if (normalizedEventKey !== normalizedExtractedKey) {
                console.error('Chave PIX inválida. Esperado:', normalizedEventKey, 'Recebido:', normalizedExtractedKey)
                return false
            }
        } else if (event.pix_key && (!extractedData.chave_pix || !extractedData.chave_pix.trim())) {
            console.warn('Chave PIX não foi extraída do comprovante. Validação baseada em nome, valor e data.')
        }

        // Validar se nome do recebedor no comprovante bate com pix_receiver_name do evento
        if (event.pix_receiver_name) {
            const normalizedEventReceiver = event.pix_receiver_name.toLowerCase().trim()
            const normalizedExtractedReceiver = extractedData.nome_recebedor?.toLowerCase().trim() || extractedData.nome?.toLowerCase().trim()

            if (!normalizedExtractedReceiver.includes(normalizedEventReceiver) && !normalizedEventReceiver.includes(normalizedExtractedReceiver)) {
                console.error('Recebedor não corresponde. Esperado:', event.pix_receiver_name, 'Recebido:', normalizedExtractedReceiver)
                return false
            }
        }

        // Validacao importante: Verificar se QUEM PAGOU é o participante registrado
        if (playerName && extractedData.nome_pagador) {
            const normalizedPlayerName = playerName.toLowerCase().trim()
            const normalizedPayerName = extractedData.nome_pagador.toLowerCase().trim()

            // Verificar se os nomes contêm palavras-chave iguais (não precisa ser idêntico)
            const playerWords = normalizedPlayerName.split(/\s+/)
            const payerWords = normalizedPayerName.split(/\s+/)

            // Precisa ter pelo menos 80% de correspondência
            const matchingWords = playerWords.filter(word => payerWords.some(pWord => pWord.includes(word) || word.includes(pWord)))
            const matchPercentage = (matchingWords.length / Math.max(playerWords.length, payerWords.length)) * 100

            if (matchPercentage < 50) {
                console.error(`SEGURANÇA: Nome do pagador não corresponde ao participante.`)
                console.error(`   Participante: "${playerName}"`)
                console.error(`   Pagador no comprovante: "${extractedData.nome_pagador}"`)
                console.error(`   Similaridade: ${matchPercentage.toFixed(0)}%`)
                return false
            }

            console.log(`SEGURANÇA: Nome do pagador validado (${matchPercentage.toFixed(0)}% similar)`)
        } else if (playerName && !extractedData.nome_pagador) {
            console.warn('Não foi possível extrair nome do pagador. Validação baseada em recebedor e valor.')
        }

        // Validar se comprovante é a partir da data de criação do evento (com margem de timezone)
        if (extractedData.data && event.created_at) {
            try {
                // Parsear data do comprovante (formato DD/MM/YYYY)
                const [day, month, year] = extractedData.data.split('/')
                const receiptDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))

                // Parsear data de criação do evento (ISO string)
                const eventCreatedDate = new Date(event.created_at)

                // Comparar apenas as DATAS em UTC, ignorar hora/minuto/segundo
                const receiptDateOnly = new Date(Date.UTC(receiptDate.getUTCFullYear(), receiptDate.getUTCMonth(), receiptDate.getUTCDate()))
                const eventDateOnly = new Date(Date.UTC(eventCreatedDate.getUTCFullYear(), eventCreatedDate.getUTCMonth(), eventCreatedDate.getUTCDate()))

                // Margem de 1 dia para tolerar diferenças de timezone
                const oneDay = 24 * 60 * 60 * 1000
                const eventDateMinusOne = new Date(eventDateOnly.getTime() - oneDay)

                // Verificar se o comprovante é ANTES de (data de criação - 1 dia)
                if (receiptDateOnly < eventDateMinusOne) {
                    console.error('Comprovante anterior à criação do evento. Data do comprovante:', extractedData.data, 'Data de criação:', event.created_at)
                    return false
                }
            } catch (err) {
                console.error('Erro ao validar data do comprovante:', err)
                // Se não conseguir validar data, não rejeita
            }
        }

        return true

    } catch (error) {
        console.error('Erro ao validar comprovante:', error)
        return false
    }
}
