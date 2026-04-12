"use client";

import { useState } from "react";

export default function AddPlayerForm({ eventId, onPlayerAdded }) {
  const [playerName, setPlayerName] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [message, setMessage] = useState({
    type: null,
    text: "",
  });

  const validateInput = () => {
    if (!playerName.trim()) {
      return "Digite seu nome";
    }

    if (playerName.length < 2) {
      return "Nome precisa ter pelo menos 2 caracteres";
    }

    if (playerName.length > 50) {
      return "Nome com muito caracteres";
    }

    return null;
  };

  const resetForm = () => {
    setPlayerName("");
    setMessage({ type: null, text: "" });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });

    if (type === "success") {
      setTimeout(() => {
        setMessage({ type: null, text: "" });
      }, 3000);
    }
  };

  const sendPlayerToAPI = async () => {
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playerName.trim(),
          event_id: eventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar jogador");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 1 Validar
    const validationError = validateInput();
    if (validationError) {
      showMessage("error", validationError);
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: null, text: "" });

      // 2 Enviar p API
      const result = await sendPlayerToAPI();

      // 3 Sucesso: salvar player_id no localStorage
      const myPlayerKey = `myPlayer_${eventId}`;
      localStorage.setItem(myPlayerKey, result.player.id);

      // Disparar evento para outros componentes saberem que mudou
      window.dispatchEvent(new CustomEvent('playerAdded', {
        detail: { eventId, playerId: result.player.id, playerName: result.player.name }
      }));

      showMessage("success", "Você entrou na lista! 🎉");
      resetForm();

      // Chamar função do parent para atualizar lista
      if (onPlayerAdded) {
        onPlayerAdded(result.player);
      }
    } catch (error) {
      // 4 Erro: mostrar mensagem
      showMessage("error", error.message);
      console.error("Erro ao adicionar jogador:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        id="playerName"
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Seu nome"
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
      />

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "10px 24px",
          background: "#0066ff",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          borderRadius: "6px",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
          transition: "background 0.2s",
        }}
        onMouseOver={(e) =>
          !isLoading && (e.target.style.background = "#0052cc")
        }
        onMouseOut={(e) =>
          !isLoading && (e.target.style.background = "#0066ff")
        }
      >
        {isLoading ? "Entrando..." : "Entrar"}
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
