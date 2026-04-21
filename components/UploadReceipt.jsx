"use client";

import { useState, useEffect } from "react";

export default function UploadReceipt({ eventId }) {
    const [file, setFile] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [playerName, setPlayerName] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [message, setMessage] = useState({
        type: null,
        text: "",
    });

    useEffect(() => {
        setIsMounted(true);
        const myId = localStorage.getItem(`myPlayer_${eventId}`);
        setPlayerId(myId);

        // Buscar dados do player para pegar o nome
        if (myId) {
            fetchPlayerName(myId);
        }

        // Ouvir evento de novo jogador adicionado
        const handlePlayerAdded = (e) => {
            if (e.detail.eventId === eventId) {
                setPlayerId(e.detail.playerId);
                fetchPlayerName(e.detail.playerId);
            }
        };

        window.addEventListener("playerAdded", handlePlayerAdded);
        return () => window.removeEventListener("playerAdded", handlePlayerAdded);
    }, [eventId]);

    const fetchPlayerName = async (id) => {
        try {
            const response = await fetch(`/api/players/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPlayerName(data.player.name);
            }
        } catch (error) {
            console.error("Erro ao buscar dados do player:", error);
        }
    };

    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            return "Selecione um arquivo";
        }

        const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
        if (!allowedTypes.includes(selectedFile.type)) {
            return "Apenas PNG, JPG ou PDF são permitidos";
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            return "Arquivo não pode exceder 5MB";
        }

        return null;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const error = validateFile(selectedFile);
            if (error) {
                showMessage("error", error);
                setFile(null);
            } else {
                setFile(selectedFile);
                setMessage({ type: null, text: "" });
            }
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        if (type === "success") {
            setTimeout(() => {
                setMessage({ type: null, text: "" });
            }, 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!playerId) {
            showMessage("error", "Você precisa entrar na lista antes de enviar comprovante");
            return;
        }

        const validationError = validateFile(file);
        if (validationError) {
            showMessage("error", validationError);
            return;
        }

        try {
            setIsLoading(true);
            setMessage({ type: null, text: "" });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("event_id", eventId);
            formData.append("player_id", playerId);

            const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || "Erro ao fazer upload");
            }

            const updateResponse = await fetch(`/api/players/${playerId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    receipt_url: uploadData.url,
                }),
            });

            const updateData = await updateResponse.json();

            if (!updateResponse.ok) {
                throw new Error(updateData.error || "Erro ao salvar comprovante");
            }

            // Iniciar processamento OCR
            setIsOcrProcessing(true);
            setMessage({ type: null, text: "" });

            const ocrResponse = await fetch("/api/ocr", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    receipt_url: uploadData.url,
                    event_id: eventId,
                    player_id: playerId,
                    player_name: playerName,
                }),
            });

            setIsOcrProcessing(false);

            const ocrData = await ocrResponse.json();

            if (ocrResponse.ok && ocrData.success) {
                showMessage("success", "Comprovante validado!");
            } else {
                showMessage("success", "Comprovante enviado! Admin fará a validação manual.");
            }

            setFile(null);
            e.target.reset();
        } catch (error) {
            showMessage("error", error.message);
            console.error("Erro ao enviar comprovante:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) {
        return null;
    }

    if (!playerId) {
        return (
            <div style={{
                padding: "12px",
                borderRadius: "6px",
                fontSize: "13px",
                textAlign: "center",
                fontWeight: 500,
                backgroundColor: "#fef3c7",
                color: "#92400e",
            }}>
                Você precisa entrar na lista antes de enviar comprovante
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
            }}
        >
            <input
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                accept=".png,.jpg,.jpeg,.pdf"
                style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: isLoading ? "not-allowed" : "pointer",
                }}
            />

            {file && (
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>
                    Arquivo: {file.name}
                </p>
            )}

            <button
                type="submit"
                disabled={!file || isLoading || isOcrProcessing}
                style={{
                    width: "100%",
                    padding: "10px 24px",
                    background: file && !isLoading && !isOcrProcessing ? "#0066ff" : "#d1d5db",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "6px",
                    cursor: file && !isLoading && !isOcrProcessing ? "pointer" : "not-allowed",
                    opacity: file && !isLoading && !isOcrProcessing ? 1 : 0.7,
                    transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                    file && !isLoading && !isOcrProcessing && (e.target.style.background = "#0052cc")
                }
                onMouseOut={(e) =>
                    file && !isLoading && !isOcrProcessing && (e.target.style.background = "#0066ff")
                }
            >
                {isOcrProcessing ? "Verificando comprovante..." : isLoading ? "Enviando..." : "Enviar Comprovante"}
            </button>

            {message.text && (
                <div
                    style={{
                        padding: "12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        textAlign: "center",
                        fontWeight: 500,
                        backgroundColor: message.type === "error" ? "#fee2e2" : "#dcfce7",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                    }}
                >
                    {message.text}
                </div>
            )}
        </form>
    );
}
