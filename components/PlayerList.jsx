"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PlayerList({ 
  eventId, 
  maxParticipants = 16,
  isAdmin = false,
  onManagePayment,
  onViewReceipt,
  onDeletePlayer
}) {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("players")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setPlayers(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar jogadores:", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPlayers();
    //configurar Realtime subscription
    //faz com que a lista atualize AUTOMATICAMENTE quando ha mudanças no banco
    const subscription = supabase
      .channel(`players-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          //payload.new = novo registro (INSERT ou UPDATE)
          //payload.old = registro antigo (DELETE ou UPDATE)
          //payload.eventType = 'INSERT' | 'UPDATE' | 'DELETE'

          if (payload.eventType === "INSERT") {
            //novo jogador entrou: adicionar à lista
            setPlayers((prevPlayers) => [...prevPlayers, payload.new]);
          }

          if (payload.eventType === "UPDATE") {
            //jogador foi atualizado (ex: marcado como pago)
            setPlayers((prevPlayers) =>
              prevPlayers.map((player) =>
                player.id === payload.new.id ? payload.new : player,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            //jogador foi removido
            setPlayers((prevPlayers) =>
              prevPlayers.filter((player) => player.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, fetchPlayers]);

  const PaymentIcon = ({ paid }) => {
    return paid ? (
      <span style={{ fontSize: "12px", fontWeight: 500, color: "#16a34a" }}>
        ✓ Pago
      </span>
    ) : (
      <span style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>
        ○ Pendente
      </span>
    );
  };

  const paidCount = players.filter((p) => p.paid).length;

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "16px" }}>
        <p style={{ color: "#991b1b", fontWeight: 500, fontSize: "14px" }}>Erro ao carregar</p>
        <button
          onClick={fetchPlayers}
          style={{ marginTop: "8px", color: "#991b1b", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header com Título e Contador */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
        <div>
          <p style={{ color: "#111", fontWeight: 600, textTransform: "uppercase", fontSize: "12px", margin: "0 0 8px 0", letterSpacing: "0.5px" }}>
            Jogadores
          </p>
          <p style={{ color: "#6b7280", fontSize: "12px", margin: "0" }}>
            {paidCount} confirmados
          </p>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>
          {players.length}/{maxParticipants}
        </div>
      </div>

      {/* Lista de Jogadores */}
      {players.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Nenhum participante ainda</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {players.map((player, index) => (
            <div key={player.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", transition: "background-color 0.2s" }}>
              {/* Info do Jogador */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280", width: "24px" }}>{index + 1}</span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#111" }}>{player.name}</span>
              </div>

              {/* Modo Admin: Botões */}
              {isAdmin ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Status de Pagamento - Clicável */}
                  <button
                    onClick={() => onManagePayment(player.id, player.paid)}
                    style={{
                      padding: "6px 10px",
                      background: player.paid ? "#dcfce7" : "#f3f4f6",
                      color: player.paid ? "#166534" : "#6b7280",
                      border: "1px solid " + (player.paid ? "#bbf7d0" : "#e5e7eb"),
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = player.paid ? "#bbf7d0" : "#e5e7eb"}
                    onMouseOut={(e) => e.target.style.background = player.paid ? "#dcfce7" : "#f3f4f6"}
                  >
                    {player.paid ? "✓ Pago" : "○ Pendente"}
                  </button>

                  {/* Botão Ver Comprovante */}
                  <button
                    onClick={() => onViewReceipt(player.receipt_url)}
                    style={{
                      padding: "6px 10px",
                      background: "#dbeafe",
                      color: "#1e40af",
                      border: "1px solid #93c5fd",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = "#93c5fd"}
                    onMouseOut={(e) => e.target.style.background = "#dbeafe"}
                  >
                    📎
                  </button>

                  {/* Botão Deletar */}
                  <button
                    onClick={() => onDeletePlayer(player.id, player.paid)}
                    style={{
                      padding: "6px 10px",
                      background: "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.background = "#fecaca"}
                    onMouseOut={(e) => e.target.style.background = "#fee2e2"}
                  >
                    🗑️
                  </button>
                </div>
              ) : (
                /* Modo Normal: Apenas Status */
                <PaymentIcon paid={player.paid} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}