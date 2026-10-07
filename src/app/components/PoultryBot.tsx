"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { API_URL } from "@/lib/api";
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
const isSafeHref = (href: string) => href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
const isSafeChartColor = (color: unknown) =>
  typeof color === "string" &&
  (/^#[0-9a-f]{3,8}$/i.test(color) ||
    /^rgba?\([\d\s.,%-]+\)$/i.test(color) ||
    /^hsla?\([\d\s.,%-]+\)$/i.test(color) ||
    /^var\(--[a-z0-9-]+\)$/i.test(color));

// Pure SVG responsive Chart Renderer for visual graphs inside the chatbot bubble
function ChartRenderer({ chartDataText }: { chartDataText: string }) {
  try {
    const rawData = JSON.parse(chartDataText.trim());
    const type = rawData.type === "line" ? "line" : "bar";
    const labels = Array.isArray(rawData.labels)
      ? rawData.labels.slice(0, 12).map((label: unknown) => String(label).slice(0, 16))
      : [];
    const datasets = Array.isArray(rawData.datasets)
      ? rawData.datasets.slice(0, 3).map((dataset: any, idx: number) => ({
          label: String(dataset?.label || `Dataset ${idx + 1}`).slice(0, 24),
          color: isSafeChartColor(dataset?.color) ? dataset.color : idx === 0 ? "var(--color-accent)" : "var(--color-warning)",
          data: Array.isArray(dataset?.data)
            ? dataset.data.slice(0, labels.length).map((value: unknown) => {
                const numericValue = Number(value);
                return Number.isFinite(numericValue) ? numericValue : 0;
              })
            : []
        }))
      : [];

    if (labels.length === 0 || datasets.length === 0) {
      return <div style={{ color: "red", fontSize: "0.8rem", padding: "8px" }}>Empty chart data</div>;
    }

    // Chart dimensions
    const width = 280;
    const height = 160;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min/max values
    const allValues = datasets.flatMap((d: any) => d.data || []);
    const maxValue = Math.max(...allValues, 10);
    const minValue = Math.min(...allValues, 0);
    const valueRange = maxValue - minValue;

    // Y Axis ticks
    const yTicks = 4;
    const ticks = Array.from({ length: yTicks + 1 }, (_, i) => minValue + (valueRange / yTicks) * i);

    return (
      <div 
        className="poultrybot-chart-container" 
        style={{ 
          margin: "12px 0", 
          background: "var(--color-bg)", 
          border: "1px solid var(--color-border-subtle)", 
          borderRadius: "8px", 
          padding: "12px 10px 8px 10px" 
        }}
      >
        {rawData.title && (
          <div style={{ fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px", textAlign: "center", color: "var(--color-text)" }}>
            {String(rawData.title).slice(0, 80)}
          </div>
        )}
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Y Axis Grid Lines & Labels */}
          {ticks.map((tick, idx) => {
            const y = paddingTop + chartHeight - ((tick - minValue) / (valueRange || 1)) * chartHeight;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--color-border-subtle)" strokeWidth="0.5" strokeDasharray="2,2" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize="8" fill="var(--color-text-secondary)" fontFamily="monospace">
                  {Math.round(tick).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--color-border)" strokeWidth="1" />

          {/* Render Datasets */}
          {type === "bar" ? (
            datasets.map((dataset: any, dsIdx: number) => {
              const datasetColor = dataset.color;
              const barGroupWidth = chartWidth / labels.length;
              const barWidth = (barGroupWidth * 0.6) / datasets.length;

              return dataset.data.map((val: number, valIdx: number) => {
                const xStart = paddingLeft + valIdx * barGroupWidth + (barGroupWidth * 0.2) + dsIdx * barWidth;
                const barHeight = ((val - minValue) / (valueRange || 1)) * chartHeight;
                const y = paddingTop + chartHeight - barHeight;

                return (
                  <g key={`${dsIdx}-${valIdx}`}>
                    <rect
                      x={xStart}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 1)}
                      fill={datasetColor}
                      rx="2"
                    />
                    <text x={xStart + barWidth / 2} y={y - 3} textAnchor="middle" fontSize="7" fontWeight="600" fill="var(--color-text-secondary)">
                      {Math.round(val).toLocaleString()}
                    </text>
                  </g>
                );
              });
            })
          ) : (
            datasets.map((dataset: any, dsIdx: number) => {
              const datasetColor = dataset.color;
              const points = dataset.data.map((val: number, valIdx: number) => {
                const x = paddingLeft + (valIdx / (labels.length - 1 || 1)) * chartWidth;
                const y = paddingTop + chartHeight - ((val - minValue) / (valueRange || 1)) * chartHeight;
                return { x, y, val };
              });

              const pathD = points.map((p: any, idx: number) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

              return (
                <g key={dsIdx}>
                  <path d={pathD} fill="none" stroke={datasetColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((p: any, pIdx: number) => (
                    <g key={pIdx}>
                      <circle cx={p.x} cy={p.y} r="3" fill="var(--color-bg)" stroke={datasetColor} strokeWidth="1.5" />
                      <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="7" fontWeight="600" fill="var(--color-text-secondary)">
                        {Math.round(p.val).toLocaleString()}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })
          )}

          {/* X Axis Labels */}
          {labels.map((label: string, idx: number) => {
            const x = paddingLeft + (idx + 0.5) * (chartWidth / labels.length);
            return (
              <text key={idx} x={x} y={paddingTop + chartHeight + 12} textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">
                {label}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
          {datasets.map((dataset: any, dsIdx: number) => {
            const datasetColor = dataset.color;
            return (
              <div key={dsIdx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: datasetColor, display: "inline-block" }} />
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>{dataset.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (err) {
    return (
      <pre style={{ background: "rgba(255,0,0,0.05)", border: "1px solid red", padding: "8px", borderRadius: "6px", fontSize: "0.8rem", color: "red" }}>
        Failed to parse chart data.
      </pre>
    );
  }
}

// Custom Markdown Parser to handle rich text formatting cleanly in client-side React
function renderMarkdown(content: string, onInternalLinkClick?: (href: string) => void): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let isNumberedList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let currentBlockLang = "";
  let codeContent: string[] = [];

  const parseInlineSegment = (text: string, keyPrefix: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
      const token = match[0];
      const key = `${keyPrefix}-token-${match.index}`;

      if (token.startsWith("`")) {
        nodes.push(<code key={key} className="inline-code">{token.slice(1, -1)}</code>);
      } else if (token.startsWith("**") || token.startsWith("__")) {
        nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
      } else {
        nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
      }

      cursor = match.index + token.length;
    }

    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  };

  const parseInline = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const linkRegex = /\[([^\]]{1,80})\]\(([^)\s]{1,240})\)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > cursor) {
        nodes.push(...parseInlineSegment(text.slice(cursor, match.index), `text-${match.index}`));
      }

      const label = match[1];
      const href = match[2];
      if (isSafeHref(href)) {
        const isInternalLink = href.startsWith("/");
        nodes.push(
          <a
            key={`link-${match.index}`}
            href={href}
            className="poultrybot-link"
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (!isInternalLink) return;
              event.preventDefault();
              onInternalLinkClick?.(href);
            }}
          >
            {label}
          </a>
        );
      } else {
        nodes.push(label);
      }

      cursor = match.index + match[0].length;
    }

    if (cursor < text.length) {
      nodes.push(...parseInlineSegment(text.slice(cursor), `text-${cursor}`));
    }

    return nodes;
  };

  const flushList = (key: string) => {
    if (!inList) return;
    elements.push(isNumberedList ? <ol key={`ol-${key}`}>{listItems}</ol> : <ul key={`ul-${key}`}>{listItems}</ul>);
    inList = false;
    listItems = [];
  };

  const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const parseTableRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const tryRenderTable = (startIndex: number): number | null => {
    if (!lines[startIndex + 1] || !isTableSeparator(lines[startIndex + 1])) return null;

    const headers = parseTableRow(lines[startIndex]).slice(0, 5);
    const rows: string[][] = [];
    let cursor = startIndex + 2;

    while (cursor < lines.length && lines[cursor].includes("|") && rows.length < 8) {
      rows.push(parseTableRow(lines[cursor]).slice(0, headers.length));
      cursor += 1;
    }

    if (headers.length < 2 || rows.length === 0) return null;

    flushList(`table-${startIndex}`);
    elements.push(
      <div key={`table-${startIndex}`} className="poultrybot-table-wrap">
        <table className="poultrybot-table">
          <thead>
            <tr>{headers.map((header, idx) => <th key={idx}>{parseInline(header)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((_, cellIdx) => <td key={cellIdx}>{parseInline(row[cellIdx] || "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return cursor - 1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code Block Toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        if (currentBlockLang === "chart" || currentBlockLang === "graph") {
          elements.push(<ChartRenderer key={`chart-${i}`} chartDataText={codeContent.join("\n")} />);
        } else {
          elements.push(
            <pre key={`code-${i}`}>
              <code>{codeContent.join("\n")}</code>
            </pre>
          );
        }
        codeContent = [];
        inCodeBlock = false;
        currentBlockLang = "";
      } else {
        const langMatch = line.trim().match(/^```(\w+)/);
        currentBlockLang = langMatch ? langMatch[1] : "";
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    const tableEndIndex = tryRenderTable(i);
    if (tableEndIndex !== null) {
      i = tableEndIndex;
      continue;
    }

    // Numbered List Check
    const numberedMatch = line.trim().match(/^\d+\.\s+/);
    if (numberedMatch) {
      if (inList && !isNumberedList) {
        elements.push(<ul key={`ul-${i}`}>{listItems}</ul>);
        listItems = [];
      }
      inList = true;
      isNumberedList = true;
      const itemText = line.trim().replace(/^\d+\.\s+/, "");
      listItems.push(<li key={`li-${i}`}>{parseInline(itemText)}</li>);
      continue;
    }

    // Bullet List Check
    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("• ");
    if (isBullet) {
      if (inList && isNumberedList) {
        elements.push(<ol key={`ol-${i}`}>{listItems}</ol>);
        listItems = [];
      }
      inList = true;
      isNumberedList = false;
      const itemText = line.trim().replace(/^([-*•])\s+/, "");
      listItems.push(<li key={`li-${i}`}>{parseInline(itemText)}</li>);
      continue;
    }

    // Close list if normal line is encountered
    if (inList && !isBullet && !numberedMatch) {
      flushList(`${i}`);
    }

    // Headers Check
    if (line.trim().startsWith("#")) {
      const headerLevel = (line.match(/^#+/) || [""])[0].length;
      const headerText = line.replace(/^#+\s+/, "");
      const HeaderTag = `h${Math.min(headerLevel, 4)}` as any;
      elements.push(
        <HeaderTag key={`h-${i}`}>
          {parseInline(headerText)}
        </HeaderTag>
      );
      continue;
    }

    // Paragraph / Blank line
    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} style={{ height: "6px" }} />);
    } else {
      elements.push(<p key={`p-${i}`} style={{ margin: "4px 0" }}>{parseInline(line)}</p>);
    }
  }

  // Close any trailing list at end of content
  flushList("end");

  return elements;
}

export default function PoultryBot() {
  const router = useRouter();
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
        body: JSON.stringify({ message: text, history: historyForRequest, lang })
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
