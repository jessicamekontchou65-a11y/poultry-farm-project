"use client";

export type PostMediaItem = { url: string; kind: "image" | "video"; mimeType?: string };

/** Older posts only have `mediaUrls` (images); newer ones have `media` with videos too. */
export function postMediaItems(post: { media?: PostMediaItem[]; mediaUrls?: string[] }): PostMediaItem[] {
  if (post.media?.length) return post.media;
  return (post.mediaUrls ?? []).map((url) => ({ url, kind: "image" as const }));
}

/** Photo and video gallery for a post (1–4 items). Videos never autoplay with sound. */
export default function PostMedia({ items, alt }: { items: PostMediaItem[]; alt: string }) {
  if (items.length === 0) return null;
  return (
    <div className={`post-media post-media--${Math.min(items.length, 4)}`}>
      {items.slice(0, 4).map((item, index) =>
        item.kind === "video" ? (
          <video key={item.url} src={item.url} controls playsInline preload="metadata" className="post-media__item">
            <a href={item.url}>Video</a>
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.url} src={item.url} alt={`${alt} ${index + 1}`} loading="lazy" className="post-media__item" />
        )
      )}
    </div>
  );
}
