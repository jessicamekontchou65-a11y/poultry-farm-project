"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import DashboardShell from "./DashboardShell";

type Props = {
  title: string;
  subtitle?: string;
  backHref: string;
  icon?: ReactNode;
  children: ReactNode;
};

export default function RecordFormShell({
  title,
  subtitle,
  backHref,
  icon,
  children
}: Props) {
  const { lang } = useLanguage();

  return (
    <DashboardShell>
      <div className="fm-form-page fm-record-page">
        <Link href={backHref} className="fm-back">
          <ArrowLeft size={16} />
          {lang === "en" ? "Back to Farm Management" : "Retour à la gestion"}
        </Link>

        <header className="fm-form-page__head">
          {icon}
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </header>

        {children}
      </div>
    </DashboardShell>
  );
}
