"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [eventUrl, setEventUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAccessEvent = async (e) => {
    e.preventDefault();
    setError("");

    const eventId = eventUrl.trim();
    if (!eventId) {
      setError("Digite o ID");
      return;
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(eventId)) {
      setError("ID inválido");
      return;
    }

    setIsLoading(true);
    router.push(`/evento/${eventId}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >

      <div
        style={{
          marginBottom: "48px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111" }}>
          PayList
        </h1>
      </div>

      {/* Título Principal */}
      <div
        style={{ textAlign: "center", marginBottom: "32px", maxWidth: "500px" }}
      >
        <h2
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#111",
            lineHeight: 1.3,
            marginBottom: "16px",
          }}
        >
          Organize, divida
          <br />e simplifique.
        </h2>
        <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>
          Crie eventos, compartilhe o link e acompanhe os pagamentos em tempo
          real. Sem complicação.
        </p>
      </div>

      {/* Botões */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "48px",
        }}
      >
        {/* Criar Evento */}
        <Link
          href="/login"
          style={{
            width: "100%",
            padding: "14px 24px",
            background: "#0066ff",
            color: "#fff",
            textAlign: "center",
            fontSize: "15px",
            fontWeight: 600,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#0052cc")}
          onMouseOut={(e) => (e.target.style.background = "#0066ff")}
        >
          + Criar evento
        </Link>

        {/* Acessar Evento */}
        <form
          onSubmit={handleAccessEvent}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            type="text"
            value={eventUrl}
            onChange={(e) => {
              setEventUrl(e.target.value);
              setError("");
            }}
            placeholder="Cole o código do evento"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: "#66b3ff",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              !isLoading && (e.target.style.background = "#4da3ff")
            }
            onMouseOut={(e) =>
              !isLoading && (e.target.style.background = "#66b3ff")
            }
          >
            {isLoading ? "Acessando..." : "Entrar →"}
          </button>
          {error && (
            <p
              style={{
                color: "#ff4444",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}
        </form>
      </div>

      {/* Footer */}
      <p style={{ fontSize: "13px", color: "#999", textAlign: "center" }}>
        Peladas, churrascos, festas — qualquer evento.
      </p>
    </div>
  );
}
