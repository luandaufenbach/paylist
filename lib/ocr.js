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
 *
 * Por que funciona:
 * - Gemini consegue entender imagens
 * - Você escreve um prompt específico pedindo os dados
 * - A IA lê a imagem e extrai as informações
 *
 * Parâmetros:
 * - imageUrl (string): URL pública da imagem no Supabase
 *
 * Retorna:
 * {
 *   nome: "Gabriel Silva",
 *   valor: 15.00,
 *   chave_pix: "10726427942",
 *   data: "11/04/2026"
 * }
 */
export async function extractReceiptData(imageUrl) {
    try {
        if (!imageUrl) {
            throw new Error('Image URL is required')
        }

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY
        if (!apiKey) {
            throw new Error('GOOGLE_GEMINI_API_KEY not configured')
        }

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `Analise este comprovante de pagamento PIX e extraia os dados EXATAMENTE como aparecem no comprovante.

INSTRUÇÕES CRÍTICAS:
1. NOME: Busque a seção "Quem recebeu" ou "Destino" e pegue o NOME completo (não CPF/CNPJ)
2. VALOR: Encontre o valor em reais (R$) - geralmente começa com "R$" ou "Valor"
3. CHAVE PIX: Busque especificamente por:
   - Campo "Chave Pix" ou "Chave PIX"
   - Pode ser um número, email, CPF ou telefone
   - Pode começar com "+55"
   - Se NÃO encontrar um campo explícito "Chave Pix", retorne null
   - NÃO confunda com CPF/CNPJ mascado (ex: ***456.009-**)
4. DATA: Busque "Data do pagamento" ou "Data da transação" em formato DD/MM/YYYY

Se algum dado não estiver claramente visível, retorne null para esse campo.

Responda SOMENTE com JSON válido (sem markdown, sem \`\`\`):
{"nome":"...","valor":...,"chave_pix":"...","data":"DD/MM/YYYY"}`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: await fetchImageAsBase64(imageUrl)
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
            throw new Error(
                errorData.error?.message || `Gemini API error: ${response.status}`
            )
        }

        const data = await response.json()
        const messageContent = data.candidates[0].content.parts[0].text

        // Gemini às vezes embala em ```json, então remove
        const jsonString = messageContent
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

        const ocrData = JSON.parse(jsonString)

        return ocrData

    } catch (error) {
        console.error('Erro ao extrair dados do comprovante:', error)
        throw new Error(`OCR Error: ${error.message}`)
    }
}

/**
 * Função auxiliar: Buscar imagem e converter para base64
 */
async function fetchImageAsBase64(imageUrl) {
    try {
        const response = await fetch(imageUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
        }

        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return base64
    } catch (error) {
        console.error('Erro ao converter imagem para base64:', error)
        throw new Error(`Failed to process image: ${error.message}`)
    }
}

/**
 * Função: validateReceipt
 *
 * Valida se os dados extraídos do comprovante correspondem aos dados do evento
 *
 * Verificações:
 * - Valor do comprovante = valor do evento
 * - Chave PIX do comprovante = chave PIX do evento
 * - Nome do recebedor no comprovante = nome configurado no evento
 */
export function validateReceipt(extractedData, event) {
    try {
        if (!extractedData || !event) {
            console.error('Dados incompletos para validação')
            return false
        }

        // Validar se valor bate
        const tolerance = 0.01
        const valueDifference = Math.abs(parseFloat(extractedData.valor) - parseFloat(event.price))

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
            console.warn('⚠️  Chave PIX não foi extraída do comprovante. Validação baseada em nome, valor e data.')
        }

        // Validar se nome do recebedor no comprovante bate com pix_receiver_name do evento
        if (event.pix_receiver_name) {
            const normalizedEventReceiver = event.pix_receiver_name.toLowerCase().trim()
            const normalizedExtractedReceiver = extractedData.nome.toLowerCase().trim()

            if (!normalizedExtractedReceiver.includes(normalizedEventReceiver) && !normalizedEventReceiver.includes(normalizedExtractedReceiver)) {
                console.error('Recebedor não corresponde. Esperado:', event.pix_receiver_name, 'Recebido:', extractedData.nome)
                return false
            }
        }

        // Validar se comprovante é a partir da data de criação do evento
        if (extractedData.data && event.created_at) {
            try {
                const receiptDate = new Date(extractedData.data.split('/').reverse().join('-'))
                const eventCreatedDate = new Date(event.created_at)

                // Comparar apenas as DATAS, ignorar hora/minuto/segundo
                const receiptDateOnly = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), receiptDate.getDate())
                const eventDateOnly = new Date(eventCreatedDate.getFullYear(), eventCreatedDate.getMonth(), eventCreatedDate.getDate())

                // Verificar se o comprovante é anterior à criação do evento
                if (receiptDateOnly < eventDateOnly) {
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
