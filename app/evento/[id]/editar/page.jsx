"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditarEvento() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    time: "",
    price: "",
    max_players: 16,
  });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch(`/api/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const event = data.events.find((e) => e.id === eventId);

          if (event) {
            setFormData({
              title: event.title || "",
              location: event.location || "",
              date: event.date || "",
              time: event.time || "",
              price: event.price || "",
              max_players: event.max_players || 16,
            });
          } else {
            setMessage({ type: "error", text: "Evento não encontrado" });
          }
        }
      } catch (error) {
        setMessage({ type: "error", text: "Erro ao carregar evento" });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [eventId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: null, text: "" });

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("Você precisa estar logado");
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          location: formData.location.trim(),
          date: formData.date,
          time: formData.time,
          price: parseFloat(formData.price),
          max_players: parseInt(formData.max_players),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar evento");
      }

      setMessage({ type: "success", text: "Evento atualizado com sucesso!" });
      setTimeout(() => {
        router.push(`/evento/${eventId}`);
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
    }
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
    );
  }

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
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <Link
              href="/dashboard"
              style={{
                color: "#0066ff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              ← Voltar
            </Link>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111",
                margin: "16px 0 0 0",
              }}
            >
              Editar Evento
            </h1>
          </div>

          {/* Divisor */}
          <div
            style={{ height: "1px", background: "#e5e7eb", margin: "32px 0" }}
          ></div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Título */}
            <div>
              <label
                style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
              >
                Título do Evento *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Pelada de Quarta"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Localização */}
            <div>
              <label
                style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
              >
                Local
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Resenha da Bola"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Data e Hora */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
                >
                  Data
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    marginTop: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
                >
                  Hora
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    marginTop: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>

            {/* Valor e Limite */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
                >
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="15.00"
                  step="0.01"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    marginTop: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: "12px", fontWeight: 600, color: "#111" }}
                >
                  Limite de Pessoas *
                </label>
                <input
                  type="number"
                  name="max_players"
                  value={formData.max_players}
                  onChange={handleChange}
                  min="1"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    marginTop: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0066ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>

            {/* Mensagem */}
            {message.text && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  textAlign: "center",
                  fontWeight: 500,
                  backgroundColor:
                    message.type === "error" ? "#fee2e2" : "#dcfce7",
                  color: message.type === "error" ? "#991b1b" : "#166534",
                }}
              >
                {message.text}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "#0066ff",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                !isSaving && (e.target.style.background = "#0052cc")
              }
              onMouseOut={(e) =>
                !isSaving && (e.target.style.background = "#0066ff")
              }
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
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
