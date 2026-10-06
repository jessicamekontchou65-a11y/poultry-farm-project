import type { Farm, Product, Shop } from "@/lib/types";

type Resource = Product | Farm | Shop;

function hasPrice(item: Resource): item is Product {
  return "price" in item;
}

function hasVerification(item: Resource): item is Farm | Shop {
  return "verificationStatus" in item;
}

export default function ResourceGrid({
  items,
  emptyText
}: {
  items: Resource[];
  emptyText: string;
}) {
  if (!items.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="resource-grid">
      {items.map((item) => (
        <article className="resource-card" key={item._id}>
          <div>
            <p className="resource-kicker">
              {hasPrice(item)
                ? item.productType.replace("_", " ")
                : hasVerification(item)
                  ? item.verificationStatus
                  : "PoultryHub"}
            </p>
            <h3>{item.name}</h3>
            <p>{item.description || ("location" in item ? item.location : "Ready for PoultryHub commerce.")}</p>
          </div>
          <div className="resource-meta">
            {hasPrice(item) ? (
              <>
                <strong>{(item.price ?? 0).toLocaleString()} XAF</strong>
                <span>
                  {item.quantity} {item.unit}
                </span>
              </>
            ) : (
              <>
                <strong>{"city" in item && item.city ? item.city : "Cameroon"}</strong>
                <span>{item.status}</span>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
