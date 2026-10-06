"use client";

import { Flame } from "lucide-react";

type Tag = { tag: string; count: number };

type Props = {
  tags: Tag[];
  activeTag: string;
  onSelect: (tag: string) => void;
};

const TAG_EMOJI: Record<string, string> = {
  broiler: "🐔",
  layer: "🥚",
  chick: "🐣",
  egg: "🥚",
  "local-chicken": "🦆",
  disease: "🏥",
  vaccination: "💉",
  feed: "🌾",
  "market-prices": "📈",
  business: "💼",
  tips: "💡",
  news: "📰",
  question: "❓",
  general: "💬",
};

export default function TrendingTags({ tags, activeTag, onSelect }: Props) {
  if (tags.length === 0) {
    return (
      <p className="trending-empty">
        No trending topics yet.
      </p>
    );
  }

  const maxCount = Math.max(...tags.map((t) => t.count), 1);

  return (
    <div className="trending-tags-list">
      {tags.map((item, idx) => {
        const barWidth = Math.max(10, Math.round((item.count / maxCount) * 100));
        const emoji = TAG_EMOJI[item.tag] ?? "🏷️";
        return (
          <button
            key={item.tag}
            className={`trending-tag-item ${activeTag === item.tag ? "active" : ""}`}
            onClick={() => onSelect(item.tag)}
          >
            <div className="trending-tag-top">
              <span className="trending-tag-rank">#{idx + 1}</span>
              <span className="trending-tag-name">
                {emoji} {item.tag}
              </span>
              <span className="trending-tag-count">{item.count}</span>
            </div>
            <div className="trending-tag-bar">
              <div className="trending-tag-bar-fill" style={{ width: `${barWidth}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
