"use client";

// Safe Markdown renderer shared by PoultryBot and the Knowledge Center.
// Supports headings, lists, tables, bold/italic, links and ```chart blocks.

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
export function renderMarkdown(content: string, onInternalLinkClick?: (href: string) => void): React.ReactNode[] {
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

