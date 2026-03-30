/**
 * OCR.js - Integração com OpenAI Vision API
 *
 * Responsabilidade: Extrair dados de um comprovante PIX usando IA
 * Entrada: URL da imagem do comprovante
 * Saída: Objeto JSON com { nome, valor, chave_pix }
 */

/**
 * Função: extractReceiptData
 *
 * O que faz:
 * 1. Recebe a URL de uma imagem (salva no Supabase Storage)
 * 2. Envia para OpenAI Vision (gpt-4o)
 * 3. Usa um prompt para pedir extração dos dados PIX
 * 4. Retorna um objeto JSON com os dados
 *
 * Por que funciona:
 * - gpt-4o consegue entender imagens
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
 *   chave_pix: "10726427942"
 * }
 */
export async function extractReceiptData(imageUrl) {
    try {
        if (!imageUrl) {
            throw new Error('Image URL is required')
        }

        const requestBody = {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analise este comprovante de pagamento PIX.
Extraia APENAS em formato JSON, sem markdown:
- nome: nome do recebedor
- valor: valor da transação em float (ex: 15.00)
- chave_pix: a chave PIX usada

Responda SOMENTE com JSON:
{"nome":"...","valor":...,"chave_pix":"..."}`
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl }
                        }
                    ]
                }
            ],
            max_tokens: 1024
        }
        //faz requisicao para OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        const messageContent = data.choices[0].message.content

        const ocrData = JSON.parse(messageContent)

        return ocrData

    } catch (error) {
        console.error('Erro ao extrair dados do comprovante:', error)
        throw new Error(`OCR Error: ${error.message}`)
    }
}
