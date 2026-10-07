/**
 * Builds a printable PDF of a farm's records. jsPDF is loaded on demand so it only
 * weighs on the page when the farmer actually downloads a report.
 */

type Rec = Record<string, any>;

export type FarmRecordsExport = {
  farm: { name: string; farmType?: string; location?: string; city?: string; region?: string };
  period: { from: string | null; to: string | null };
  generatedAt: string;
  batches: Rec[];
  records: {
    feeding: Rec[];
    mortality: Rec[];
    vaccination: Rec[];
    eggs: Rec[];
    expenses: Rec[];
    sales: Rec[];
  };
};

const ACCENT: [number, number, number] = [4, 120, 87];

// jsPDF's built-in fonts cannot draw the narrow no-break space Intl uses in French,
// so numbers are grouped with a plain space.
const num = (value: unknown) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  const [int, dec] = Math.abs(n).toFixed(n % 1 === 0 ? 0 : 1).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n < 0 ? "-" : ""}${grouped}${dec ? `,${dec}` : ""}`;
};
const money = (value: unknown) => `${num(value)} XAF`;
const date = (value: unknown) => {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
const text = (value: unknown) => (value === undefined || value === null || value === "" ? "-" : String(value));
const sum = (rows: Rec[], field: string) => rows.reduce((total, row) => total + Number(row[field] ?? 0), 0);

export async function downloadFarmRecordsPdf(
  data: FarmRecordsExport,
  lang: "en" | "fr",
  types: Array<keyof FarmRecordsExport["records"]>
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const en = lang === "en";
  const L = (english: string, french: string) => (en ? english : french);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const batchName = new Map(data.batches.map((b) => [String(b._id), b.name || b.batchCode || "-"]));
  const flock = (row: Rec) => batchName.get(String(row.batchId)) ?? "-";

  // Header band
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(L("Farm records", "Registres de la ferme"), margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const place = [data.farm.location, data.farm.city, data.farm.region].filter(Boolean).join(", ");
  doc.text(`${data.farm.name}${place ? ` - ${place}` : ""}`, margin, 60);
  const period =
    data.period.from || data.period.to
      ? `${L("Period", "Période")}: ${data.period.from ? date(data.period.from) : "..."} - ${data.period.to ? date(data.period.to) : "..."}`
      : L("Period: all records", "Période : tous les registres");
  doc.text(period, margin, 76);
  doc.text(`PoultryHub - ${L("generated", "généré le")} ${date(data.generatedAt)}`, pageWidth - margin, 76, { align: "right" });
  doc.setTextColor(15, 23, 42);

  let y = 112;
  const heading = (title: string) => {
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...ACCENT);
    doc.text(title, margin, y);
    doc.setTextColor(15, 23, 42);
    y += 8;
  };
  const table = (head: string[], body: (string | number)[][], foot?: (string | number)[]) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.length ? body : [[L("No records for this period.", "Aucun registre pour cette période."), ...head.slice(1).map(() => "")]],
      foot: foot && body.length ? [foot] : undefined,
      margin: { left: margin, right: margin },
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [236, 253, 245], textColor: [15, 23, 42], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    y = (doc as any).lastAutoTable.finalY + 26;
  };

  const r = data.records;
  heading(L("Summary", "Synthèse"));
  table(
    [L("Indicator", "Indicateur"), L("Value", "Valeur")],
    [
      [L("Flocks", "Lots"), num(data.batches.length)],
      [L("Feed given", "Aliment distribué"), `${num(sum(r.feeding, "quantity"))} (${money(sum(r.feeding, "cost"))})`],
      [L("Deaths recorded", "Mortalité enregistrée"), num(sum(r.mortality, "numberOfDeaths"))],
      [L("Eggs collected", "Œufs ramassés"), num(sum(r.eggs, "eggsCollected"))],
      [L("Expenses", "Dépenses"), money(sum(r.expenses, "amount"))],
      [L("Sales", "Ventes"), money(sum(r.sales, "totalAmount"))],
      [L("Sales minus expenses", "Ventes moins dépenses"), money(sum(r.sales, "totalAmount") - sum(r.expenses, "amount"))]
    ]
  );

  heading(L("Flocks", "Lots"));
  table(
    [L("Flock", "Lot"), L("Type", "Type"), L("Breed", "Race"), L("Start", "Début"), L("Initial", "Initial"), L("Current", "Actuel"), L("Status", "Statut")],
    data.batches.map((b) => [text(b.name || b.batchCode), text(b.poultryType), text(b.breed), date(b.startDate), num(b.initialQuantity), num(b.currentQuantity), text(b.status)])
  );

  const sections: Array<[keyof FarmRecordsExport["records"], () => void]> = [
    [
      "feeding",
      () => {
        heading(L("Feeding", "Alimentation"));
        table(
          [L("Date", "Date"), L("Flock", "Lot"), L("Feed", "Aliment"), L("Quantity", "Quantité"), L("Cost", "Coût")],
          r.feeding.map((x) => [date(x.feedingDate), flock(x), text(x.feedType), `${num(x.quantity)} ${text(x.unit)}`, money(x.cost)]),
          [L("Total", "Total"), "", "", num(sum(r.feeding, "quantity")), money(sum(r.feeding, "cost"))]
        );
      }
    ],
    [
      "mortality",
      () => {
        heading(L("Mortality", "Mortalité"));
        table(
          [L("Date", "Date"), L("Flock", "Lot"), L("Deaths", "Morts"), L("Cause", "Cause"), L("Action taken", "Action menée")],
          r.mortality.map((x) => [date(x.date), flock(x), num(x.numberOfDeaths), text(x.suspectedDisease || x.cause), text(x.actionTaken)]),
          [L("Total", "Total"), "", num(sum(r.mortality, "numberOfDeaths")), "", ""]
        );
      }
    ],
    [
      "vaccination",
      () => {
        heading(L("Vaccination & treatment", "Vaccination & traitements"));
        table(
          [L("Planned", "Prévu"), L("Done", "Fait"), L("Flock", "Lot"), L("Product", "Produit"), L("Type", "Type"), L("Status", "Statut")],
          r.vaccination.map((x) => [date(x.scheduledDate), date(x.completedDate), flock(x), text(x.vaccineName), text(x.treatmentType), text(x.status)])
        );
      }
    ],
    [
      "eggs",
      () => {
        heading(L("Egg production", "Production d'œufs"));
        table(
          [L("Date", "Date"), L("Flock", "Lot"), L("Collected", "Ramassés"), L("Damaged", "Abîmés"), L("Sold", "Vendus"), L("Remaining", "Restants")],
          r.eggs.map((x) => [date(x.date), flock(x), num(x.eggsCollected), num(x.damagedEggs), num(x.eggsSold), num(x.remainingEggs)]),
          [L("Total", "Total"), "", num(sum(r.eggs, "eggsCollected")), num(sum(r.eggs, "damagedEggs")), num(sum(r.eggs, "eggsSold")), ""]
        );
      }
    ],
    [
      "expenses",
      () => {
        heading(L("Expenses", "Dépenses"));
        table(
          [L("Date", "Date"), L("Category", "Catégorie"), L("Supplier", "Fournisseur"), L("Description", "Description"), L("Amount", "Montant")],
          r.expenses.map((x) => [date(x.date), text(x.category), text(x.supplier), text(x.description), money(x.amount)]),
          [L("Total", "Total"), "", "", "", money(sum(r.expenses, "amount"))]
        );
      }
    ],
    [
      "sales",
      () => {
        heading(L("Sales", "Ventes"));
        table(
          [L("Date", "Date"), L("Flock", "Lot"), L("Product", "Produit"), L("Quantity", "Quantité"), L("Unit price", "Prix unitaire"), L("Total", "Total")],
          r.sales.map((x) => [date(x.saleDate), flock(x), text(x.productType), `${num(x.quantity)} ${text(x.unit)}`, money(x.unitPrice), money(x.totalAmount)]),
          [L("Total", "Total"), "", "", "", "", money(sum(r.sales, "totalAmount"))]
        );
      }
    ]
  ];

  for (const [key, render] of sections) {
    if (types.includes(key)) render();
  }

  // Page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${data.farm.name} - ${i}/${pages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  const slug = data.farm.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  doc.save(`${slug || "farm"}-${L("records", "registres")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
