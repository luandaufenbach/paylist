"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PlayerList from "@/components/PlayerList";
import AddPlayerForm from "@/components/AddPlayerForm";
import UploadReceipt from "@/components/UploadReceipt";
import jwt from "jsonwebtoken";
import { MdContentCopy } from "react-icons/md";

/**
 * Página Pública do Evento
 *
 * Rota : /evento/[id]
 * ex: /evento/550e8400-e29b-41d4-a716-446655440000
 */
export default function EventPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);

  /**
   * Função: Buscar dados do evento
   * Recebe o ID da URL e busca no Supabase
   * Se usuário logado for o owner, redireciona para admin
   */
  const fetchEvent = async (eventId) => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("event")
        .select("*, admin_users(phone, name)")
        .eq("id", eventId)
        .single();

      if (fetchError) {
        throw new Error("Verifique se a chave está correta");
      }

      //verificar se usuário logado é o owner do evento
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && String(decoded.id) === String(data.user_id)) {
            //usuário é o owner → redirecionar para admin
            router.push(`/evento/${eventId}/admin`);
            return;
          }
        } catch (err) {
          console.error("Erro ao decodificar token:", err);
        }
      }

      setEvent(data);
    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar evento:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Hook: useEffect
   * Executar quando a página carrega
   * Buscar os dados do evento usando o ID da URL
   */
  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id);
    }
  }, [params.id]);

  /**
   * Função: Formatar data para formato legível
   * Ex: 2026-04-07 → 07/04/2026
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Data não informada";

    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  /**
   * Função: Formatar valor em moeda brasileira
   * Ex: 15 → R$ 15,00
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  /**
   * Função: Callback quando um participante é adicionado
   * Chamado por AddPlayerForm após sucesso
   */
  const handleParticipantAdded = (participant) => {
    console.log("Participante adicionado:", participant);
  };

  /**
   * Função: Copiar Chave PIX com feedback visual
   */
  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(event?.pix_key);
    setPixKeyCopied(true);
    setTimeout(() => setPixKeyCopied(false), 2000);
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

  if (error || !event) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#111", marginBottom: "8px" }}>
            Evento não encontrado
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            {error || "Este evento não existe."}
          </p>
          <Link href="/" style={{ color: "#0066ff", textDecoration: "none", fontWeight: 600 }}>
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: "600px" }}>


          <div style={{ marginBottom: "24px" }}>
            <Link
              href="/"
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
              ← Home
            </Link>
          </div>

          {/* Título do Evento */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111" }}> {event?.title || "Evento"}</h1>

          </div>
          {/* Botão voltar */}


          {/* Informações do Evento */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            {event?.location && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "18px" }}></span>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Local</p>
                  <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{event.location}</p>
                </div>

              </div>
            )}

            {event?.date && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "18px" }}></span>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Data</p>
                  <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{formatDate(event.date)}</p>
                </div>
              </div>
            )}

            {event?.time && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "18px" }}></span>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", fontWeight: 500 }}>Horário</p>
                  <p style={{ fontSize: "14px", color: "#111", margin: "0", fontWeight: 500 }}>{event.time}</p>
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
                <button
                  onClick={handleCopyPixKey}
                  title="Copiar Chave PIX"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    background: pixKeyCopied ? "#d1fae5" : "#0066ff",
                    color: pixKeyCopied ? "#065f46" : "#fff",
                    border: pixKeyCopied ? "1px solid #6ee7b7" : "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 200ms ease",
                  }}
                  onMouseOver={(e) => {
                    if (!pixKeyCopied) {
                      e.currentTarget.style.background = "#0052cc"
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!pixKeyCopied) {
                      e.currentTarget.style.background = "#0066ff"
                    }
                  }}
                >
                  <MdContentCopy size={16} />
                  {pixKeyCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Jogadores */}
          <div style={{ marginBottom: "32px" }}>
            <PlayerList eventId={event?.id} maxParticipants={event?.max_players} />
          </div>

          {/* Divisor */}
          <div style={{ height: "1px", background: "#e5e7eb", margin: "32px 0" }}></div>

          {/* Entrar na Lista */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#111", textTransform: "uppercase", marginBottom: "24px", letterSpacing: "0.5px" }}>
              Entrar na lista
            </h3>
            <AddPlayerForm eventId={event?.id} onPlayerAdded={handleParticipantAdded} />
          </div>

          {/* Divisor */}
          <div style={{ height: "1px", background: "#e5e7eb", margin: "32px 0" }}></div>

          {/* Comprovante PIX */}
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#111", textTransform: "uppercase", marginBottom: "24px", letterSpacing: "0.5px" }}>
              Comprovante PIX
            </h3>
            <UploadReceipt eventId={event?.id} />

            {/* Mensagem de suporte com WhatsApp */}
            {event?.admin_users?.phone && (
              <div style={{ marginTop: "24px", padding: "16px"}}>
                <p style={{ fontSize: "13px", color: "#111", margin: "0 0 12px 0" }}>
                  Dúvidas ou erros?{' '}
                  <a
                    href={`https://wa.me/55${event.admin_users.phone}?text=Olá, tenho dúvida sobre meu comprovante do evento ${event.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0066ff",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#0052cc")}
                    onMouseLeave={(e) => (e.target.style.color = "#0066ff")}
                  >
                    Converse com o administrador aqui
                  </a>
                </p>
              </div>
            )}
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
