"use client";

import { AiOutlineDelete } from "react-icons/ai"
import { MdOutlineVisibility } from "react-icons/md"

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
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
    const myId = localStorage.getItem(`myPlayer_${eventId}`);
    setMyPlayerId(myId);

    fetchPlayers();

    const handlePlayerAdded = (e) => {
      if (e.detail.eventId === eventId) {
        const newMyId = localStorage.getItem(`myPlayer_${eventId}`);
        setMyPlayerId(newMyId);
      }
    };

    const handlePlayerDeleted = (e) => {
      if (e.detail.eventId === eventId) {
        setPlayers((prevPlayers) =>
          prevPlayers.filter((player) => player.id !== e.detail.playerId)
        );
      }
    };

    window.addEventListener('playerAdded', handlePlayerAdded);
    window.addEventListener('playerDeleted', handlePlayerDeleted);

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
          if (payload.eventType === "INSERT") {
            setPlayers((prevPlayers) => [...prevPlayers, payload.new]);
          }

          if (payload.eventType === "UPDATE") {
            setPlayers((prevPlayers) =>
              prevPlayers.map((player) =>
                player.id === payload.new.id ? payload.new : player,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            setPlayers((prevPlayers) =>
              prevPlayers.filter((player) => player.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener('playerAdded', handlePlayerAdded);
      window.removeEventListener('playerDeleted', handlePlayerDeleted);
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

  const handleEditClick = (player) => {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditingName("");
  };

  const handleSaveName = async (playerId) => {
    if (!editingName.trim()) {
      alert("Nome não pode ficar vazio");
      return;
    }

    if (editingName.length < 2) {
      alert("Nome precisa ter pelo menos 2 caracteres");
      return;
    }

    if (editingName.length > 50) {
      alert("Nome com muito caracteres");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Erro ao atualizar nome");
        return;
      }

      handleCancelEdit();
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
      alert("Erro ao atualizar nome");
    } finally {
      setIsSaving(false);
    }
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
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {players.map((player, index) => (
            <div key={player.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", transition: "background-color 0.2s" }}>
              {/* Info do Jogador */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280", flexShrink: 0 }}>{index + 1}</span>

                {/* Modo Edição: Input + Botões */}
                {editingPlayerId === player.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      disabled={isSaving}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "6px 8px",
                        border: "1px solid #0066ff",
                        borderRadius: "4px",
                        fontSize: "12px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      onClick={() => handleSaveName(player.id)}
                      disabled={isSaving}
                      style={{
                        padding: "4px 8px",
                        background: "#dcfce7",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        cursor: isSaving ? "not-allowed" : "pointer",
                        opacity: isSaving ? 0.7 : 1,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      style={{
                        padding: "4px 8px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        cursor: isSaving ? "not-allowed" : "pointer",
                        opacity: isSaving ? 0.7 : 1,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</span>
                )}
              </div>

              {/* Modo Admin: Botões */}
              {isAdmin ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  {/* Status de Pagamento - Clicável */}
                  <button
                    onClick={() => onManagePayment(player.id, player.paid)}
                    style={{
                      display: "flex",      
                      alignItems: "center",      
                      justifyContent: "center",
                      padding: "4px 8px",
                      background: player.paid ? "#dcfce7" : "#f3f4f6",
                      color: player.paid ? "#166534" : "#6b7280",
                      border: "1px solid " + (player.paid ? "#bbf7d0" : "#e5e7eb"),
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => e.target.style.background = player.paid ? "#bbf7d0" : "#e5e7eb"}
                    onMouseOut={(e) => e.target.style.background = player.paid ? "#dcfce7" : "#f3f4f6"}
                  >
                    {player.paid ? "✓ Pago" : "Pendente"}
                  </button>

                  {/* Botão Ver Comprovante */}
                  <button
                    onClick={() => onViewReceipt(player.receipt_url)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 8px",
                      background: "#dbeafe",
                      color: "#1e40af",
                      border: "1px solid #93c5fd",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 200ms ease",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#93c5fd"
                      e.currentTarget.style.color = "#082f49"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#dbeafe"
                      e.currentTarget.style.color = "#1e40af"
                    }}
                  >
                    <MdOutlineVisibility size={16} />
                  </button>

                  {/* Botão Deletar */}
                  <button
                    onClick={() => onDeletePlayer(player.id, player.paid)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 8px",
                      background: "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 200ms ease",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#fecaca"
                      e.currentTarget.style.color = "#7f1d1d"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fee2e2"
                      e.currentTarget.style.color = "#991b1b"
                    }}
                  >
                    <AiOutlineDelete size={16} />
                  </button>
                </div>
              ) : (
                /* Modo Normal: Status + Botão Editar (só para myPlayerId) */
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {editingPlayerId !== player.id && <PaymentIcon paid={player.paid} />}
                  {myPlayerId === player.id && !editingPlayerId && !player.paid && (
                    <button
                      onClick={() => handleEditClick(player)}
                      style={{
                        padding: "6px 10px",
                        background: "#f3f4f6",
                        color: "#111",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "background 0.2s",
                        flexShrink: 0,
                        textAlign: "center"
                      }}
                      onMouseOver={(e) => e.target.style.background = "#e5e7eb"}
                      onMouseOut={(e) => e.target.style.background = "#f3f4f6"}
                    >
                      ✎
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}