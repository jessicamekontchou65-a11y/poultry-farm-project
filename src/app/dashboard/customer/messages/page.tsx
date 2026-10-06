"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "../../../AuthContext";
import { useLanguage } from "../../../LanguageContext";
import DashboardShell from "../../../components/DashboardShell";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";

export default function CustomerMessagesPage() {
  const { token, user } = useAuth();
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();
  const targetConversationId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch list of chats
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await api.get<any[]>("/conversations", token);
      setConversations(res.data);
      if (res.data.length > 0) {
        const targetConversation = targetConversationId
          ? res.data.find((conv) => String(conv._id) === targetConversationId)
          : null;

        if (targetConversation) {
          selectConversation(targetConversation);
        } else if (!activeConv) {
          selectConversation(res.data[0]);
        }
      }
    } catch (err) {}
    setLoading(false);
  };

  const selectConversation = async (conv: any) => {
    setActiveConv(conv);
    if (!token) return;
    try {
      const res = await api.get<any[]>(`/conversations/${conv._id}/messages`, token);
      setMessages(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchConversations();
  }, [token, targetConversationId]);

  // Pull messages periodically for simulated real-time updates
  useEffect(() => {
    if (!token || !activeConv) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<any[]>(`/conversations/${activeConv._id}/messages`, token);
        setMessages(res.data || []);
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [token, activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeConv || !text.trim()) return;
    try {
      const res = await api.create<any>(`/conversations/${activeConv._id}/messages`, {
        body: text
      }, token);

      setMessages((prev) => [...prev, res.data]);
      setText("");
      
      // Refresh list to update lastMessageAt
      fetchConversations();
    } catch (err) {}
  };

  return (
    <DashboardShell>
      <div className="dash-page">
        <div className="dash-page-head">
          <div>
            <p className="resource-kicker">{t("dash.sidebar.customer")}</p>
            <h1>{t("msg.chat_title")}</h1>
            <p>{lang === "en" ? "Keep seller conversations organized while you manage orders." : "Gardez vos échanges vendeurs organisés pendant le suivi des commandes."}</p>
          </div>
          <div className="dash-page-head__icon">
            <MessageSquare size={24} />
          </div>
        </div>

        {loading ? (
          <p>{lang === "en" ? "Loading inbox..." : "Chargement de la boîte de réception..."}</p>
        ) : conversations.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty__icon"><MessageSquare size={24} /></div>
            <p className="dash-empty__text">{lang === "en" ? "No conversations yet." : "Aucune discussion en cours."}</p>
          </div>
        ) : (
        <div className="chat-container">
          {/* Sidebar: list chats */}
          <div className="chat-sidebar">
            <div className="chat-list">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  className={`chat-item ${activeConv?._id === conv._id ? "active" : ""}`}
                >
                  <h4 style={{ fontWeight: "700" }}>{conv.subject || "Seller Inbox"}</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Area: messages history */}
          <div className="chat-main">
            {activeConv ? (
              <>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "20px" }}>
                      {lang === "en" ? "Send a message to start conversation." : "Envoyez un message pour commencer la discussion."}
                    </p>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = String(msg.senderId) === String(user?._id);
                      return (
                        <div
                          key={idx}
                          className={`chat-bubble ${isMe ? "sent" : "received"}`}
                        >
                          <p>{msg.body}</p>
                          <span style={{ fontSize: "0.65rem", display: "block", marginTop: "4px", textAlign: "right", opacity: 0.6 }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-area">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("msg.send_placeholder")}
                    className="chat-input"
                    required
                  />
                  <button type="submit" className="chat-send-btn">
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--color-text-muted)" }}>
                {lang === "en" ? "Select a conversation to start chatting." : "Sélectionnez une discussion pour commencer à discuter."}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </DashboardShell>
  );
}
