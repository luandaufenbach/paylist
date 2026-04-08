import { supabase } from '@/lib/supabase'

export async function POST(request) {
    try {
        //
        const formData = await request.formData()
        const file = formData.get('file')
        const eventId = formData.get('event_id')
        const playerId = formData.get('player_id')
        //validar se arquivo existe
        if (!file) {
            return Response.json(
                { error: 'Arquivo não fornecido' },
                { status: 400 }
            )
        }

        //validar tamanho do arquivo
        if (file.size > 5 * 1024 * 1024) {
            return Response.json(
                { error: 'Arquivo muito grande (máx 5MB)' },
                { status: 400 }
            )
        }

        //converter arquivo p buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        //nome unico p arquivo
        const timestamp = Date.now()
        const fileName = `${eventId}/${playerId}/${timestamp}-${file.name}`

        //upload para storage
        const { data, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, buffer, {
                contentType: file.type
            })

        if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError)
            return Response.json(
                { error: 'Erro ao fazer upload do arquivo' },
                { status: 500 }
            )
        }

        //pegar url publica do arquivo
        const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName)

        return Response.json({
            success: true,
            message: 'Arquivo enviado com sucesso',
            url: publicUrlData.publicUrl,
            fileName: fileName
        }, { status: 200 })

    } catch (error) {
        console.error('Erro ao fazer upload:', error)
        return Response.json(
            { error: error.message },
            { status: 500 }

        )
    }
}