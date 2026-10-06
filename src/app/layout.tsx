import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./LanguageContext";
import { AuthProvider } from "./AuthContext";
import PoultryBot from "./components/PoultryBot";

export const metadata: Metadata = {
  title: "PoultryHub | Farm Management & Poultry Marketplace",
  description:
    "The integrated platform for poultry farm management, marketplace sales, and business intelligence across Cameroon and Africa. Manage batches, sell with trust, grow your business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cs = localStorage.getItem("color-scheme");
                  if (cs === "light" || cs === "dark") {
                    document.querySelector('meta[name="color-scheme"]').content = cs;
                    document.documentElement.setAttribute("data-theme", cs);
                  }
                  var lang = localStorage.getItem("poultryhub-lang");
                  if (lang === "fr") {
                    document.documentElement.lang = "fr";
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <PoultryBot />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
