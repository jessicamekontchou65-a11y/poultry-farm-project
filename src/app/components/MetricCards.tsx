import type { DashboardOverview } from "@/lib/types";

const labels: Record<keyof DashboardOverview, string> = {
  farms: "My farms",
  shops: "My shops",
  products: "Products",
  orders: "Orders",
  expenses: "Expenses",
  farmSales: "Farm sales",
  unreadNotifications: "Unread alerts",
  totalUsers: "Users",
  totalFarms: "Farms",
  totalShops: "Shops",
  totalProducts: "Products",
  totalOrders: "Orders",
  pendingFarms: "Pending farms",
  pendingShops: "Pending shops",
  pendingProducts: "Pending products"
};

export default function MetricCards({ data }: { data: DashboardOverview }) {
  const entries = Object.entries(data).filter(([, value]) => typeof value === "number");

  return (
    <div className="metric-cards">
      {entries.map(([key, value]) => (
        <article className="metric-card" key={key}>
          <span>{labels[key as keyof DashboardOverview] ?? key}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}
