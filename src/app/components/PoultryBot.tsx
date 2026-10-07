"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { API_URL } from "@/lib/api";
import { renderMarkdown } from "./markdown";
import { MessageSquare, X, Send, RotateCcw, Square, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  createdAt: number;
  /** The question to resend when this bot message reports a failure. */
  retryOf?: string;
}

const makeMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const makeBotMessage = (content: string): ChatMessage => ({ id: makeMessageId(), role: "bot", content, createdAt: Date.now() });
const makeUserMessage = (content: string): ChatMessage => ({ id: makeMessageId(), role: "user", content, createdAt: Date.now() });
export default function PoultryBot() {
  const router = useRouter();
  const pathname = usePathname();
  // The dashboard the user is in tells the assistant which role to answer for.
  const activeRole = pathname.match(/^\/dashboard\/(farmer|shopkeeper|customer|admin)/)?.[1];
  const { user, token, logout } = useAuth();
  const { lang, t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userMemoryId = user?.id || user?._id || user?.email || "guest";
  const storageKey = useMemo(() => `poultryhub:poultrybot:${userMemoryId}:${lang}`, [userMemoryId, lang]);

  const getWelcomeMessage = () => {
    if (!user) {
      return lang === "en"
        ? "Hello! I'm PoultryBot, your poultry assistant. Ask me anything, or log in to get personal insights!"
        : "Bonjour ! Je suis PoultryBot, votre assistant avicole. Posez-moi des questions, ou connectez-vous pour voir vos indicateurs !";
    }

    const name = user.fullName.split(" ")[0];
    const roleStr = user.roles.includes("admin") 
      ? "Admin"
      : user.roles.includes("farmer")
      ? (lang === "en" ? "Farmer" : "Éleveur")
      : user.roles.includes("shopkeeper")
      ? (lang === "en" ? "Shopkeeper" : "Boutiquier")
      : (lang === "en" ? "Buyer" : "Acheteur");

    return lang === "en"
      ? `Hi ${name}! I'm PoultryBot, your personal ${roleStr} assistant. I can use our recent chat as memory, answer follow-ups, and visualize useful poultry or marketplace metrics.`
      : `Bonjour ${name} ! Je suis PoultryBot, votre assistant personnel ${roleStr}. Je peux utiliser notre échange récent comme mémoire, répondre aux suivis et visualiser les indicateurs utiles.`;
  };

  // Initialize scoped chatbot memory based on language and user auth state
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages) as ChatMessage[];
        const validMessages = parsed
          .filter((m) => m && (m.role === "user" || m.role === "bot") && typeof m.content === "string")
          .slice(-30)
          .map((m) => ({
            id: m.id || makeMessageId(),
            role: m.role,
            content: m.content,
            createdAt: m.createdAt || Date.now()
          }));

        if (validMessages.length > 0) {
          setMessages(validMessages);
          return;
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }

    setMessages([makeBotMessage(getWelcomeMessage())]);
  }, [storageKey]);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify(messages.filter((m) => m.content).slice(-30)));
  }, [messages, storageKey]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const appendToMessage = (id: string, delta: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m)));

  const failureMessage = (kind: "auth" | "network" | "interrupted") => {
    if (kind === "auth") {
      return lang === "en"
        ? "Your session has expired, so I cleared protected context. Please log in again before asking about private farm, shop, cart, or order data."
        : "Votre session a expiré, donc j'ai supprimé le contexte protégé. Veuillez vous reconnecter avant de demander des données privées.";
    }
    if (kind === "interrupted") {
      return lang === "en" ? "\n\n_(The answer was interrupted.)_" : "\n\n_(La réponse a été interrompue.)_";
    }
    return lang === "en"
      ? "I could not reach the assistant service. Please try again in a few moments."
      : "Je n'ai pas pu joindre le service assistant. Veuillez réessayer dans quelques instants.";
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMsg = makeUserMessage(text);
    const botMsg = makeBotMessage("");
    const historyForRequest = messages
      .filter((m) => m.content && !m.retryOf)
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setIsLoading(true);
    setStreamingId(botMsg.id);

    const controller = new AbortController();
    abortRef.current = controller;
    let received = "";

    try {
      const response = await fetch(`${API_URL}/poultrybot/chat/stream`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: text, history: historyForRequest, lang, activeRole })
      });

      if (response.status === 401) throw new Error("AUTH_EXPIRED");
      if (response.status === 429) {
        appendToMessage(
          botMsg.id,
          lang === "en"
            ? "You are sending messages very quickly. Please wait a few minutes and try again."
            : "Vous envoyez beaucoup de messages. Patientez quelques minutes puis réessayez."
        );
        return;
      }
      if (!response.ok || !response.body) throw new Error("NETWORK");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          if (!frame.startsWith("data:")) continue;
          const event = JSON.parse(frame.slice(5));
          if (event.delta) {
            received += event.delta;
            appendToMessage(botMsg.id, event.delta);
          }
          if (event.error === "unauthorized") throw new Error("AUTH_EXPIRED");
          if (event.error === "interrupted") appendToMessage(botMsg.id, failureMessage("interrupted"));
          if (event.error && event.error !== "interrupted") throw new Error("NETWORK");
        }
      }

      if (!received) throw new Error("NETWORK");
    } catch (err) {
      if (controller.signal.aborted) {
        if (!received) setMessages((prev) => prev.filter((m) => m.id !== botMsg.id));
        return;
      }
      const isAuthError = err instanceof Error && err.message === "AUTH_EXPIRED";
      if (isAuthError) logout();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsg.id
            ? received
              ? { ...m, content: m.content + failureMessage("interrupted") }
              : { ...m, content: failureMessage(isAuthError ? "auth" : "network"), retryOf: isAuthError ? undefined : text }
            : m
        )
      );
    } finally {
      abortRef.current = null;
      setStreamingId(null);
      setIsLoading(false);
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const handleRetry = (failed: ChatMessage) => {
    if (!failed.retryOf || isLoading) return;
    const question = failed.retryOf;
    // Drop the failed exchange, then ask again.
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === failed.id);
      return index > 0 ? [...prev.slice(0, index - 1), ...prev.slice(index + 1)] : prev;
    });
    setTimeout(() => handleSendMessage(question), 0);
  };

  const handleClearMemory = () => {
    const welcome = makeBotMessage(getWelcomeMessage());
    localStorage.removeItem(storageKey);
    setMessages([welcome]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Enter sends, Shift+Enter adds a new line.
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleInternalLinkClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // Compile suggested prompts based on roles
  const getSuggestions = () => {
    if (!user) {
      return [
        { label: t("bot.suggest.create"), query: lang === "en" ? "How to create a farm?" : "Comment créer une ferme ?" },
        { label: lang === "en" ? "Browse Marketplace" : "Parcourir le marché", query: lang === "en" ? "How can I buy products on marketplace?" : "Comment acheter sur le marché ?" }
      ];
    }

    const list = [];
    if (user.roles.includes("farmer")) {
      list.push({ label: t("bot.suggest.tips"), query: lang === "en" ? "Give me tips for my active poultry batch" : "Donne-moi des conseils pour mon lot actif" });
    }
    if (user.roles.includes("shopkeeper")) {
      list.push({ label: t("bot.suggest.stock"), query: lang === "en" ? "Are any of my shop products low in stock?" : "Est-ce que certains de mes produits sont en rupture de stock ?" });
    }
    if (user.roles.includes("customer")) {
      list.push({ label: t("bot.suggest.track"), query: lang === "en" ? "Track my latest order status" : "Suivre le statut de ma dernière commande" });
    }
    return list;
  };

  const suggestions = getSuggestions();

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="poultrybot-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="PoultryBot AI Assistant"
      >
        <span className="poultrybot-fab__pulse" />
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="poultrybot-drawer">
          <div className="poultrybot-header">
            <div className="poultrybot-header__left">
              <div className="poultrybot-header__avatar">
                <span style={{ fontSize: "1.1rem" }}>🐤</span>
              </div>
              <div className="poultrybot-header__title">
                <span className="poultrybot-header__name">{t("bot.name")}</span>
                <span className="poultrybot-header__status">
                  <span className="poultrybot-header__status-dot" />
                  {lang === "en" ? "Online" : "En ligne"}
                </span>
              </div>
            </div>
            <div className="poultrybot-header__actions">
              <button
                className="poultrybot-header__icon-btn"
                onClick={handleClearMemory}
                aria-label={lang === "en" ? "Clear PoultryBot memory" : "Effacer la mémoire PoultryBot"}
                title={lang === "en" ? "Clear memory" : "Effacer la mémoire"}
              >
                <RotateCcw size={15} />
              </button>
              <button className="poultrybot-header__icon-btn" onClick={() => setIsOpen(false)} aria-label="Close PoultryBot">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Log */}
          <div className="poultrybot-messages">
            {messages.map((m) =>
              m.id === streamingId && !m.content ? null : (
                <div
                  key={m.id}
                  className={`poultrybot-bubble poultrybot-bubble--${m.role === "bot" ? "bot" : "user"}`}
                >
                  {renderMarkdown(m.content, handleInternalLinkClick)}
                  {m.retryOf && !isLoading && (
                    <button type="button" className="poultrybot-retry-btn" onClick={() => handleRetry(m)}>
                      <RefreshCw size={13} />
                      {lang === "en" ? "Try again" : "Réessayer"}
                    </button>
                  )}
                </div>
              )
            )}
            {isLoading && !messages.find((m) => m.id === streamingId)?.content && (
              <div className="poultrybot-bubble poultrybot-bubble--bot">
                <div className="poultrybot-typing">
                  <span className="poultrybot-typing__dot" />
                  <span className="poultrybot-typing__dot" />
                  <span className="poultrybot-typing__dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions List */}
          {!isLoading && suggestions.length > 0 && (
            <div className="poultrybot-suggestions">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx}
                  className="poultrybot-suggest-pill"
                  onClick={() => handleSendMessage(s.query)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Chat Footer Input */}
          <div className="poultrybot-footer">
            <form onSubmit={handleFormSubmit} className="poultrybot-form">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={t("bot.placeholder")}
                className="poultrybot-input"
                rows={1}
                maxLength={2000}
                aria-label={t("bot.placeholder")}
              />
              {isLoading ? (
                <button
                  type="button"
                  className="poultrybot-send-btn"
                  onClick={handleStop}
                  aria-label={lang === "en" ? "Stop answering" : "Arrêter la réponse"}
                  title={lang === "en" ? "Stop" : "Arrêter"}
                >
                  <Square size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="poultrybot-send-btn"
                  disabled={!input.trim()}
                  aria-label={lang === "en" ? "Send" : "Envoyer"}
                >
                  <Send size={16} />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
