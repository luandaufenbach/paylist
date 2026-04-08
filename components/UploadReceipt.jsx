"use client";

import { useState } from "react";

export default function UploadReceipt({
    eventId,
    playerId,
    playerName,
    onUploadSuccess,
}) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({
        type: null,
        text: "",
    });

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) return;

        //validar tamanho max 5mb
        if (selectedFile.size > 5 * 1024 * 1024) {
            showMessage("Error", "Arquivo muito grande (máx 5MB)");
            return;
        }

        //validar tipo
        const validTypes = ["image/png", "image/jpeg", "application/pdf"];
        if (!validTypes.includes(selectedFile.type)) {
            showMessage("error", "Tipo inválido. Use PNG, JPG ou PDF");
            return;
        }

        setFile(selectedFile);

        //se é img cria preview (USER VE ANTES DE ENVIAR)
        if (selectedFile.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreview(event.target.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }

        setMessage({ type: null, text: "" });
    };

    //mostrar mensagem
    const showMessage = (type, text) => {
        setMessage({ type, text });

        if (type === "success") {
            setTimeout(() => {
                setMessage({ type: null, text: "" });
            }, 3000);
        }
    };

    //enviar arquivo p servidor
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            showMessage("error", "Selecione um arquivo");
            return;
        }

        try {
            setIsLoading(true);
            setMessage({ type: null, text: "" });

            //criar formdata (ENVIAR ARQUIVO NO NAVEGADOR)
            const formData = new FormData()
            formData.append('file', file)
            formData.append('event_id', eventId)
            formData.append('player_id', playerId)

            //fazer upload
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer upload')
            }

            //sucesso, chama callback p atualizar a lista
            showMessage('success', 'Comprovante enviado com sucesso!')
            setFile(null)
            setPreview(null)

            if (onUploadSuccess) {
                onUploadSuccess({
                    receipt_url: data.url,
                    player_id: playerId
                })
            }

        } catch (error) {
            showMessage('error', error.message)
            console.error('Erro ao fazer upload:', error)
        } finally {
            setIsLoading(false)
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Input de arquivo (hidden) */}
            <input
                id="receiptFile"
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={handleFileSelect}
                disabled={isLoading}
                style={{ display: 'none' }}
            />

            {/* Área para clicar e selecionar arquivo */}
            <label
                htmlFor="receiptFile"
                style={{
                    display: 'block',
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px',
                    padding: '40px 24px',
                    textAlign: 'center',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s',
                    backgroundColor: file ? '#f9fafb' : '#fff'
                }}
                onMouseOver={(e) => !isLoading && (e.currentTarget.style.borderColor = '#0066ff')}
                onMouseOut={(e) => !isLoading && (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📸</div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '4px' }}>
                    {file ? file.name : 'Selecionar comprovante'}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    (PNG, JPG ou PDF)
                </p>
            </label>

            {/* Preview da imagem */}
            {preview && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <img
                        src={preview}
                        alt="Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}
                    />
                </div>
            )}

            {/* Botão enviar */}
            {file && (
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '10px 24px',
                        background: '#0066ff',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => !isLoading && (e.target.style.background = '#0052cc')}
                    onMouseOut={(e) => !isLoading && (e.target.style.background = '#0066ff')}
                >
                    {isLoading ? 'Enviando...' : 'Enviar Comprovante'}
                </button>
            )}

            {/* Mensagem de erro/sucesso */}
            {message.text && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textAlign: 'center',
                    fontWeight: 500,
                    backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#991b1b' : '#166534'
                }}>
                    {message.text}
                </div>
            )}
        </form>
    )

}
