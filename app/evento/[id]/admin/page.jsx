"use client";



import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PlayerList from "@/components/PlayerList";
import jwt from "jsonwebtoken";

export default function EventAdminPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);


    //hook - verifica se user é admin do evento
    //comapara user_id do token com user_id do evento
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        // Decode token (sem verificacao, é so p ler user_id local)
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            router.push('/auth/login');
            return;
        }

        // salvar user_id p comparar com evento
        localStorage.setItem('user_id', decoded.id);
    }, [router]);

    //buscar dados do evento
    const fetchEvent = async (eventId) => {
        try {
            setError(null);

            const { data, error: fetchError } = await supabase
                .from("event")
                .select("*, admin_users(phone, name)")
                .eq("id", eventId)
                .single();

            if (fetchError) {
                throw new Error("Evento não encontrado");
            }

            // verificar se user_id bate
            const userId = localStorage.getItem('user_id');
            if (data.user_id !== userId) {
                throw new Error("Você não tem permissão para gerenciar este evento");
            }

            setEvent(data);
            setIsAuthorized(true);
        } catch (err) {
            setError(err.message);
            console.error("Erro ao buscar evento:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchEvent(params.id);
        }
    }, [params.id]);

    //gerenciar pagamentos e deletar participantes
    const togglePayment = async (playerId, currentPaidStatus) => {
        try {
            const response = await fetch('/api/payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: playerId,
                    paid: !currentPaidStatus
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // recarregar evento para atualizar lista
            fetchEvent(event.id);
        } catch (error) {
            alert('Erro ao atualizar pagamento: ' + error.message);
        }
    };

    const viewReceipt = (receiptUrl) => {
        if (!receiptUrl) {
            alert('Nenhum comprovante enviado');
            return;
        }
        window.open(receiptUrl, '_blank');
    };

    const deletePlayer = async (playerId, playerPaidStatus) => {
        if (playerPaidStatus) {
            alert('Não é permitido excluir jogadores que já pagaram');
            return;
        }

        if (!confirm('Tem certeza que deseja remover este participante?')) {
            return;
        }

        try {
            const response = await fetch(`/api/players/${playerId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            fetchEvent(event.id);
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Data não informada";
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(price);
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-block", height: "32px", width: "32px", border: "4px solid #111", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                </div>
            </div>
        );
    }

    if (error || !isAuthorized || !event) {
        return (
            <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#111", marginBottom: "8px" }}>
                        {error || "Acesso negado"}
                    </h1>
                    <p style={{ color: "#6b7280", marginBottom: "24px" }}>
                        {error || "Você não tem permissão para acessar este evento."}
                    </p>
                    <Link
                        href="/dashboard"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            color: "#0066ff",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            borderRadius: "8px",
                            transition: "all 200ms ease",
                            backgroundColor: "rgba(0, 102, 255, 0.05)",
                            cursor: "pointer"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(0, 102, 255, 0.1)"
                            e.currentTarget.style.transform = "translateX(-4px)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(0, 102, 255, 0.05)"
                            e.currentTarget.style.transform = "translateX(0)"
                        }}
                    >
                        ← Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
            <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px" }}>
                <div style={{ width: "100%", maxWidth: "600px" }}>
                    {/* Header com link voltar */}
                    <div style={{ marginBottom: "32px" }}>
                        <Link
                            href="/dashboard"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                color: "#0066ff",
                                textDecoration: "none",
                                fontWeight: 600,
                                fontSize: "14px",
                                borderRadius: "8px",
                                transition: "all 200ms ease",
                                backgroundColor: "rgba(0, 102, 255, 0.05)",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(0, 102, 255, 0.1)"
                                e.currentTarget.style.transform = "translateX(-4px)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(0, 102, 255, 0.05)"
                                e.currentTarget.style.transform = "translateX(0)"
                            }}
                        >
                            ← Voltar ao Dashboard
                        </Link>
                    </div>

                    {/* Título */}
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111" }}>Gerenciar Evento</h1>
                        <p style={{ fontSize: "12px", color: "#6b7280", margin: "8px 0 0 0" }}>{event?.title}</p>
                    </div>

                    {/* Informações */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                        {event?.location && (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                                <span style={{ fontSize: "18px" }}></span>
                                <div>
                                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Local</p>
                                    <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{event?.location}</p>
                                </div>
                            </div>
                        )}

                        {event?.date && (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                                <span style={{ fontSize: "18px" }}></span>
                                <div>
                                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Data</p>
                                    <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{formatDate(event?.date)}</p>
                                </div>
                            </div>
                        )}

                        {event?.time && (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                                <span style={{ fontSize: "18px" }}></span>
                                <div>
                                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Horário</p>
                                    <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{event?.time}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                            <span style={{ fontSize: "18px" }}></span>
                            <div>
                                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Valor</p>
                                <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{formatPrice(event?.price)}</p>
                            </div>
                        </div>
                    </div>


            {/* Dados para Transferência PIX */}
            <div style={{ marginTop: "24px", padding: "16px", background: "#f0f4ff", borderRadius: "8px", border: "1px solid #0066ff" }}>
              <p style={{ fontSize: "11px", color: "#0066ff", margin: "0 0 12px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Dados para Transferência</p>

              {/* Nome do Recebedor */}
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 4px 0", fontWeight: 500 }}>Recebedor</p>
                <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 600 }}>{event?.pix_receiver_name}</p>
              </div>

              {/* Chave PIX com Botão de Copy */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#fff", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <div style={{ flex: 1, minWidth: "0" }}>
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 4px 0", fontWeight: 500 }}>Chave PIX</p>
                  <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500, wordBreak: "break-all" }}>{event?.pix_key}</p>
                </div>
              </div>
            </div>

                    {/* Divisor */}
                    <div style={{ height: "1px", background: "#e5e7eb", margin: "32px 0" }}></div>

                    {/* Gerenciar Participantes */}
                    <div style={{ marginBottom: "32px" }}>
                        <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#111", textTransform: "uppercase", marginBottom: "24px", letterSpacing: "0.5px" }}>
                            Gerenciar Participantes
                        </h3>
                        <PlayerList eventId={event?.id} maxParticipants={event?.max_players} isAdmin={true} onManagePayment={togglePayment} onViewReceipt={viewReceipt} onDeletePlayer={deletePlayer} />
                    </div>
                </div>
            </main>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}