"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  DollarSign,
  Egg,
  Syringe,
  Wheat
} from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  FEED_TYPES,
  farmOpsApi,
  flockTypeLabel,
  MORTALITY_CAUSES,
  todayISO,
  type RecordType
} from "@/lib/farm-ops";
import type { PoultryBatch } from "@/lib/types";
import { useAuth } from "../../../../../AuthContext";
import { useLanguage } from "../../../../../LanguageContext";
import RecordFormShell from "../../../../../components/RecordFormShell";

function RecordFormInner() {
  const params = useParams<{ type: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { lang } = useLanguage();

  const type = (params.type || "eggs") as RecordType;
  const farmId = searchParams.get("farmId") || "";
  const batchId = searchParams.get("batchId") || "";
  const dateParam = searchParams.get("date") || todayISO();

  const [flock, setFlock] = useState<(PoultryBatch & { farm?: any }) | null>(null);
  const [date, setDate] = useState(dateParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Eggs
  const [goodEggs, setGoodEggs] = useState("0");
  const [crackedEggs, setCrackedEggs] = useState("0");
  const [dirtyEggs, setDirtyEggs] = useState("0");
  const [brokenEggs, setBrokenEggs] = useState("0");
  const [rejectedEggs, setRejectedEggs] = useState("0");
  const [session, setSession] = useState("full_day");
  const [eggNotes, setEggNotes] = useState("");

  // Feed
  const [feedType, setFeedType] = useState("Layer");
  const [feedQty, setFeedQty] = useState("");
  const [feedUnit, setFeedUnit] = useState("kg");
  const [feedSessions, setFeedSessions] = useState("1");
  const [feedCost, setFeedCost] = useState("0");
  const [feedNotes, setFeedNotes] = useState("");

  // Mortality
  const [deaths, setDeaths] = useState("1");
  const [cause, setCause] = useState("Unknown");
  const [mortNotes, setMortNotes] = useState("");

  // Expense
  const [category, setCategory] = useState("Feed");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("bag");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [supplier, setSupplier] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  // Health
  const [treatmentType, setTreatmentType] = useState("vaccination");
  const [productName, setProductName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [birdsTreated, setBirdsTreated] = useState("");
  const [qtyUsed, setQtyUsed] = useState("");
  const [healthUnit, setHealthUnit] = useState("dose");
  const [adminMethod, setAdminMethod] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [vetName, setVetName] = useState("");
  const [markCompleted, setMarkCompleted] = useState(true);
  const [healthNotes, setHealthNotes] = useState("");

  const backHref = farmId && batchId
    ? `/dashboard/farmer/manage?farmId=${farmId}&batchId=${batchId}&date=${date}`
    : "/dashboard/farmer/manage";

  useEffect(() => {
    if (!token || !batchId) return;
    farmOpsApi
      .getBatch(token, batchId)
      .then((res) => {
        setFlock(res.data);
        setBirdsTreated(String(res.data.currentQuantity ?? 0));
      })
      .catch(() => {});
  }, [token, batchId]);

  const totalEggs = useMemo(() => {
    return (
      Number(goodEggs || 0) +
      Number(crackedEggs || 0) +
      Number(dirtyEggs || 0) +
      Number(brokenEggs || 0) +
      Number(rejectedEggs || 0)
    );
  }, [goodEggs, crackedEggs, dirtyEggs, brokenEggs, rejectedEggs]);

  const expenseTotal = useMemo(() => {
    const q = Number(quantity || 0);
    const p = Number(unitPrice || 0);
    if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
    return q * p;
  }, [quantity, unitPrice]);

  const meta = {
    eggs: {
      title: lang === "en" ? "Record eggs" : "Enregistrer les œufs",
      icon: <Egg size={22} />
    },
    feed: {
      title: lang === "en" ? "Record feed" : "Enregistrer l'aliment",
      icon: <Wheat size={22} />
    },
    mortality: {
      title: lang === "en" ? "Record mortality" : "Enregistrer la mortalité",
      icon: <AlertTriangle size={22} />
    },
    expense: {
      title: lang === "en" ? "Record expense" : "Enregistrer une dépense",
      icon: <DollarSign size={22} />
    },
    health: {
      title: lang === "en" ? "Record health activity" : "Enregistrer une activité santé",
      icon: <Syringe size={22} />
    }
  }[type] || {
    title: "Record",
    icon: <Egg size={22} />
  };

  const subtitle = flock
    ? `${flock.farm?.name || ""} · ${flockTypeLabel(flock.poultryType, lang)} — ${flock.name} (${flock.batchCode}) · ${(flock.currentQuantity ?? 0).toLocaleString()} ${lang === "en" ? "birds" : "sujets"}`
    : undefined;

  const resetEggs = () => {
    setGoodEggs("0");
    setCrackedEggs("0");
    setDirtyEggs("0");
    setBrokenEggs("0");
    setRejectedEggs("0");
    setEggNotes("");
  };

  const submit = async (e: FormEvent, addAnother = false) => {
    e.preventDefault();
    if (!token || !batchId || !farmId) {
      setError(lang === "en" ? "Farm and flock are required." : "Ferme et lot requis.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (type === "eggs") {
        await farmOpsApi.recordEggs(token, batchId, {
          date,
          goodEggs: Number(goodEggs || 0),
          crackedEggs: Number(crackedEggs || 0),
          dirtyEggs: Number(dirtyEggs || 0),
          brokenEggs: Number(brokenEggs || 0),
          rejectedEggs: Number(rejectedEggs || 0),
          eggsCollected: totalEggs,
          collectionSession: session,
          birdsCount: flock?.currentQuantity,
          notes: eggNotes
        });
        setSuccess(
          lang === "en"
            ? "Egg production recorded successfully."
            : "Production d'œufs enregistrée."
        );
        if (addAnother) resetEggs();
      } else if (type === "feed") {
        await farmOpsApi.recordFeed(token, batchId, {
          feedType,
          quantity: Number(feedQty),
          unit: feedUnit,
          feedingSessions: Number(feedSessions || 1),
          cost: Number(feedCost || 0),
          birdsCount: flock?.currentQuantity,
          feedingDate: date,
          notes: feedNotes
        });
        setSuccess(
          lang === "en" ? "Feeding recorded successfully." : "Alimentation enregistrée."
        );
        if (addAnother) {
          setFeedQty("");
          setFeedNotes("");
        }
      } else if (type === "mortality") {
        await farmOpsApi.recordMortality(token, batchId, {
          numberOfDeaths: Number(deaths),
          cause,
          date,
          notes: mortNotes
        });
        setSuccess(
          lang === "en"
            ? "Mortality recorded. Flock bird count updated."
            : "Mortalité enregistrée. Effectif mis à jour."
        );
        if (addAnother) {
          setDeaths("1");
          setMortNotes("");
        }
        // refresh flock birds
        const refreshed = await farmOpsApi.getBatch(token, batchId);
        setFlock(refreshed.data);
      } else if (type === "expense") {
        await farmOpsApi.recordExpense(token, {
          farmId,
          batchId,
          category,
          description: description || expenseNotes,
          quantity: Number(quantity || 0),
          unit,
          unitPrice: Number(unitPrice || 0),
          amount: expenseTotal,
          paymentMethod,
          supplier,
          date,
          notes: expenseNotes
        });
        setSuccess(
          lang === "en" ? "Expense recorded successfully." : "Dépense enregistrée."
        );
        if (addAnother) {
          setDescription("");
          setUnitPrice("");
          setExpenseNotes("");
        }
      } else if (type === "health") {
        await farmOpsApi.recordHealth(token, batchId, {
          treatmentType,
          vaccineName: productName,
          purpose,
          date,
          scheduledDate: date,
          markCompleted,
          birdsTreated: Number(birdsTreated || flock?.currentQuantity || 0),
          quantityUsed: qtyUsed ? Number(qtyUsed) : undefined,
          unit: healthUnit,
          administrationMethod: adminMethod,
          nextScheduledDate: nextDate || undefined,
          administeredBy: vetName,
          notes: healthNotes
        });
        setSuccess(
          lang === "en"
            ? "Health activity recorded successfully."
            : "Activité santé enregistrée."
        );
        if (addAnother) {
          setProductName("");
          setPurpose("");
          setHealthNotes("");
        }
      }

      if (!addAnother) {
        router.push(
          `/dashboard/farmer/manage/daily?farmId=${farmId}&batchId=${batchId}&date=${date}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (!["eggs", "feed", "mortality", "expense", "health"].includes(type)) {
    return (
      <RecordFormShell title="Unknown record type" backHref="/dashboard/farmer/manage">
        <p className="form-error-banner">Invalid record type</p>
      </RecordFormShell>
    );
  }

  return (
    <RecordFormShell
      title={meta.title}
      subtitle={subtitle}
      backHref={backHref}
      icon={meta.icon}
    >
      <form className="connected-form fm-form fm-record-form" onSubmit={(e) => submit(e, false)}>
        <div className="form-group">
          <label>{lang === "en" ? "Date" : "Date"}</label>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {type === "eggs" && (
          <>
            <div className="form-group">
              <label>{lang === "en" ? "Collection session" : "Session de collecte"}</label>
              <select value={session} onChange={(e) => setSession(e.target.value)}>
                <option value="morning">{lang === "en" ? "Morning" : "Matin"}</option>
                <option value="afternoon">{lang === "en" ? "Afternoon" : "Après-midi"}</option>
                <option value="evening">{lang === "en" ? "Evening" : "Soir"}</option>
                <option value="full_day">{lang === "en" ? "Full day" : "Journée"}</option>
              </select>
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Good eggs" : "Bons œufs"}</label>
                <input type="number" min={0} step={1} value={goodEggs} onChange={(e) => setGoodEggs(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Cracked" : "Fêlés"}</label>
                <input type="number" min={0} step={1} value={crackedEggs} onChange={(e) => setCrackedEggs(e.target.value)} />
              </div>
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Dirty" : "Sales"}</label>
                <input type="number" min={0} step={1} value={dirtyEggs} onChange={(e) => setDirtyEggs(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Broken" : "Cassés"}</label>
                <input type="number" min={0} step={1} value={brokenEggs} onChange={(e) => setBrokenEggs(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Rejected" : "Rejetés"}</label>
                <input type="number" min={0} step={1} value={rejectedEggs} onChange={(e) => setRejectedEggs(e.target.value)} />
              </div>
            </div>
            <p className="fm-note">
              {lang === "en" ? "Total eggs" : "Total œufs"}: <strong>{totalEggs}</strong>
              {flock ? ` · ${lang === "en" ? "Rate vs current birds" : "Taux vs effectif"}: ${
                flock.currentQuantity
                  ? ((totalEggs / flock.currentQuantity) * 100).toFixed(1)
                  : 0
              }%` : ""}
            </p>
            <div className="form-group">
              <label>{lang === "en" ? "Notes" : "Notes"}</label>
              <textarea rows={2} value={eggNotes} onChange={(e) => setEggNotes(e.target.value)} />
            </div>
          </>
        )}

        {type === "feed" && (
          <>
            <div className="form-group">
              <label>{lang === "en" ? "Feed type" : "Type d'aliment"}</label>
              <select value={feedType} onChange={(e) => setFeedType(e.target.value)}>
                {FEED_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Quantity" : "Quantité"}</label>
                <input type="number" min={0.01} step="any" value={feedQty} onChange={(e) => setFeedQty(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Unit" : "Unité"}</label>
                <select value={feedUnit} onChange={(e) => setFeedUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="bag">bag</option>
                  <option value="gram">gram</option>
                  <option value="ton">ton</option>
                  <option value="other">other</option>
                </select>
              </div>
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Feeding sessions" : "Sessions"}</label>
                <input type="number" min={1} value={feedSessions} onChange={(e) => setFeedSessions(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Cost (optional)" : "Coût (optionnel)"}</label>
                <input type="number" min={0} value={feedCost} onChange={(e) => setFeedCost(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{lang === "en" ? "Notes" : "Notes"}</label>
              <textarea rows={2} value={feedNotes} onChange={(e) => setFeedNotes(e.target.value)} />
            </div>
          </>
        )}

        {type === "mortality" && (
          <>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Number of deaths" : "Nombre de morts"}</label>
                <input type="number" min={1} step={1} value={deaths} onChange={(e) => setDeaths(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Possible cause" : "Cause possible"}</label>
                <select value={cause} onChange={(e) => setCause(e.target.value)}>
                  {MORTALITY_CAUSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="fm-note">
              {lang === "en"
                ? `Current birds: ${(flock?.currentQuantity ?? 0).toLocaleString()}. Deaths cannot exceed this count.`
                : `Effectif actuel : ${(flock?.currentQuantity ?? 0).toLocaleString()}. Les morts ne peuvent pas dépasser cet effectif.`}
            </p>
            <div className="form-group">
              <label>{lang === "en" ? "Notes" : "Notes"}</label>
              <textarea rows={2} value={mortNotes} onChange={(e) => setMortNotes(e.target.value)} />
            </div>
          </>
        )}

        {type === "expense" && (
          <>
            <div className="form-group">
              <label>{lang === "en" ? "Category" : "Catégorie"}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{lang === "en" ? "Description" : "Description"}</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === "en" ? "Purchased 10 bags of layer feed" : "Achat de 10 sacs d'aliment ponte"}
                required
              />
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Quantity" : "Quantité"}</label>
                <input type="number" min={0} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Unit" : "Unité"}</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Unit price (FCFA)" : "Prix unitaire (FCFA)"}</label>
                <input type="number" min={0} step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
              </div>
            </div>
            <p className="fm-note">
              {lang === "en" ? "Total" : "Total"}: <strong>{expenseTotal.toLocaleString()} FCFA</strong>
            </p>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Payment method" : "Mode de paiement"}</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Bank">Bank</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Supplier" : "Fournisseur"}</label>
                <input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{lang === "en" ? "Notes" : "Notes"}</label>
              <textarea rows={2} value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} />
            </div>
          </>
        )}

        {type === "health" && (
          <>
            <p className="fm-note">
              {lang === "en"
                ? "Record-keeping only. Do not treat this as a diagnosis or dosage prescription."
                : "Outil d'enregistrement uniquement. Ce n'est pas un diagnostic ni une prescription."}
            </p>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Treatment type" : "Type"}</label>
                <select value={treatmentType} onChange={(e) => setTreatmentType(e.target.value)}>
                  <option value="vaccination">{lang === "en" ? "Vaccination" : "Vaccination"}</option>
                  <option value="medication">{lang === "en" ? "Medication" : "Médicament"}</option>
                  <option value="treatment">{lang === "en" ? "Treatment" : "Traitement"}</option>
                  <option value="other">{lang === "en" ? "Other" : "Autre"}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Product / vaccine name" : "Produit / vaccin"}</label>
                <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>{lang === "en" ? "Purpose" : "Objectif"}</label>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Birds treated" : "Sujets traités"}</label>
                <input type="number" min={0} value={birdsTreated} onChange={(e) => setBirdsTreated(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Quantity used" : "Quantité utilisée"}</label>
                <input type="number" min={0} step="any" value={qtyUsed} onChange={(e) => setQtyUsed(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Unit" : "Unité"}</label>
                <input value={healthUnit} onChange={(e) => setHealthUnit(e.target.value)} />
              </div>
            </div>
            <div className="fm-form__row">
              <div className="form-group">
                <label>{lang === "en" ? "Administration method" : "Mode d'administration"}</label>
                <input value={adminMethod} onChange={(e) => setAdminMethod(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === "en" ? "Next scheduled date" : "Prochaine date"}</label>
                <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{lang === "en" ? "Veterinarian / technician" : "Vétérinaire / technicien"}</label>
              <input value={vetName} onChange={(e) => setVetName(e.target.value)} />
            </div>
            <label className="fm-check">
              <input
                type="checkbox"
                checked={markCompleted}
                onChange={(e) => setMarkCompleted(e.target.checked)}
              />
              {lang === "en" ? "Mark as completed today" : "Marquer comme effectué aujourd'hui"}
            </label>
            <div className="form-group">
              <label>{lang === "en" ? "Notes" : "Notes"}</label>
              <textarea rows={2} value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} />
            </div>
          </>
        )}

        {error && <p className="form-error-banner">{error}</p>}
        {success && <p className="form-success-banner">{success}</p>}

        <div className="fm-form__actions">
          <button type="submit" className="fm-btn fm-btn--primary" disabled={loading}>
            {loading
              ? lang === "en"
                ? "Saving..."
                : "Enregistrement..."
              : lang === "en"
                ? "Save"
                : "Enregistrer"}
          </button>
          <button
            type="button"
            className="fm-btn"
            disabled={loading}
            onClick={(e) => submit(e as unknown as FormEvent, true)}
          >
            {lang === "en" ? "Save & add another" : "Enregistrer & ajouter"}
          </button>
        </div>
      </form>
    </RecordFormShell>
  );
}

export default function RecordTypePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <RecordFormInner />
    </Suspense>
  );
}
