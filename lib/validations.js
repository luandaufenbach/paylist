/**
 * validations.js - Validação de comprovantes PIX
 *
 * Responsabilidade: Verificar se os dados extraídos do PIX estão corretos
 * Entrada: ocrData (objeto com nome, valor, chave_pix), event, playerName
 * Saída: boolean (true = válido, false = inválido)
 */

export function validateReceipt(ocrData, event, playerName) {
    try {
        const ocrValue = Number(ocrData.valor)
        const eventPrice = Number(event.price)

        if (ocrValue !== eventPrice) {
            console.log(`Valor incorreto: esperado ${eventPrice}, recebido ${ocrValue}`)
            return false
        }
        //valida se a chave pix esta correta
        //trasforma em string e remove espaços para melhor comparacao
        const ocrPixKey = String(ocrData.chave_pix).trim()
        const eventPixKey = String(event.pix_key).trim()

        if (ocrPixKey !== eventPixKey) {
            console.log(`Chave pix incorreta: esperada ${eventPixKey}, recebida ${ocrPixKey}`)
            return false
        }
        //
        //converter para minusculas
        const ocrName = String(ocrData.nome).toLocaleLowerCase()
        const playerNameLower = String(playerName).toLocaleLowerCase()

        if (!ocrName.includes(playerNameLower)) {
            console.log(`Nome incorreto: esperado ${playerNameLower}, recebido ${ocrName}`)
            return false
        }

        //se passou em todas as verificaçoes return True
        return true
    } catch (error) {
        console.error('Erro ao validar comprovante:', error)
        return false
    }
}