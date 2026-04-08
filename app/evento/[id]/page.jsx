"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PlayerList from "@/components/PlayerList";
import AddPlayerForm from "@/components/AddPlayerForm";

/**
 * Página Pública do Evento
 *
 * Rota : /evento/[id]
 * ex: /evento/550e8400-e29b-41d4-a716-446655440000
 */
export default function EventPage({ params: paramsPromise }) {
  // Desembrulhar a Promise de params
  const params = use(paramsPromise);
  // Estado: guardar dados do evento
  const [event, setEvent] = useState(null);

  // Estado: guardar ID do jogador atual (se existir)
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  /**
   * Função: Buscar dados do evento
   * Recebe o ID da URL e busca no Supabase
   */
  const fetchEvent = async (eventId) => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("event")
        .select("*")
        .eq("id", eventId)
        .single();

      if (fetchError) {
        throw new Error("Evento não encontrado");
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

    // Parsear YYYY-MM-DD diretamente para evitar timezone issues
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

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              height: "32px",
              width: "32px",
              border: "4px solid #111",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#111",
              marginBottom: "8px",
            }}
          >
            Evento não encontrado
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            {error || "Este evento não existe."}
          </p>
          <Link
            href="/"
            style={{
              color: "#0066ff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  // Renderizar página do evento
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "600px" }}>
          {/* Título do Evento */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111" }}>
              {event?.title || "Evento"}
            </h1>
          </div>

          {/* Informações do Evento */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {event?.location && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "18px" }}></span>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: "0",
                      fontWeight: 500,
                    }}
                  >
                    Local
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#111",
                      margin: "0",
                      fontWeight: 500,
                    }}
                  >
                    {event.location}
                  </p>
                </div>
              </div>
            )}

            {event?.date && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "18px" }}></span>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: "0",
                      fontWeight: 500,
                    }}
                  >
                    Data
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#111",
                      margin: "0",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(event.date)}
                  </p>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "12px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: "18px" }}></span>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: "0",
                    fontWeight: 500,
                  }}
                >
                  Valor
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#111",
                    margin: "0",
                    fontWeight: 500,
                  }}
                >
                  {formatPrice(event?.price)}
                </p>
              </div>
            </div>

            {event?.time && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "18px" }}></span>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: "0",
                      fontWeight: 500,
                    }}
                  >
                    Horário
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#111",
                      margin: "0",
                      fontWeight: 500,
                    }}
                  >
                    {event.time}
                  </p>
                </div>
              </div>
            )}
          </div>    

          {/* Lista de Jogadores */}
          <div style={{ marginBottom: "32px" }}>
            <PlayerList
              eventId={event?.id}
              maxParticipants={event?.max_players}
            />
          </div>

          {/* Divisor */}
          <div
            style={{ height: "1px", background: "#e5e7eb", margin: "32px 0" }}
          ></div>

          {/* Entrar na Lista */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#111",
                textTransform: "uppercase",
                marginBottom: "24px",
                letterSpacing: "0.5px",
              }}
            >
              Entrar na lista
            </h3>
            <AddPlayerForm
              eventId={event?.id}
              onPlayerAdded={handleParticipantAdded}
            />
          </div>

          {/* Divisor */}
          <div
            style={{ height: "1px", background: "#e5e7eb", margin: "32px 0" }}
          ></div>

          {/* Comprovante PIX */}
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#111",
                textTransform: "uppercase",
                marginBottom: "24px",
                letterSpacing: "0.5px",
              }}
            >
              Comprovante PIX
            </h3>
            <div
              style={{
                border: "2px dashed #e5e7eb",
                borderRadius: "8px",
                padding: "40px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}></div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#111",
                  marginBottom: "4px",
                }}
              >
                Selecionar comprovante
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                (PNG, JPG ou PDF)
              </p>
            </div>
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
