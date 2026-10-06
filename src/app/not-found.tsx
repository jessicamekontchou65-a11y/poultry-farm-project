import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      background: "#fafaf9",
      color: "#1c1917",
      gap: 16,
      padding: 32,
      textAlign: "center",
    }}>
      <h1 style={{ fontSize: "4rem", fontWeight: 800, letterSpacing: "-1px", color: "#10b981" }}>404</h1>
      <p style={{ fontSize: "1.1rem", color: "#78716c", maxWidth: 400 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 12,
          padding: "10px 24px",
          borderRadius: 10,
          background: "#10b981",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.88rem",
          textDecoration: "none",
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
