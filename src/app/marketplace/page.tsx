"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Truck,
  Wheat,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import AppNav from "../components/AppNav";
import { useLanguage } from "../LanguageContext";

const regions = ["Littoral", "Centre", "West", "Northwest", "Southwest"];

function productImage(product: Product) {
  return product.images?.[0] ?? "/images/seed/modern-poultry-farm.png";
}

function formatPrice(value: number) {
  return `${(value ?? 0).toLocaleString()} XAF`;
}

export default function MarketplacePage() {
  const { t, lang } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [productType, setProductType] = useState("");
  const [farmId, setFarmId] = useState("");
  const [shopId, setShopId] = useState("");
  const [status, setStatus] = useState(lang === "en" ? "Loading marketplace..." : "Chargement du marché...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextProductType = params.get("productType") ?? params.get("type") ?? "";
    setProductType(nextProductType);
    setFarmId(params.get("farmId") ?? "");
    setShopId(params.get("shopId") ?? "");
  }, []);

  useEffect(() => {
    api
      .list<Category>("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setStatus(lang === "en" ? "Loading curated stock..." : "Chargement des produits...");

    api
      .list<Product>("/products", {
        search,
        categoryId: categoryFilter,
        region: regionFilter,
        priceMin: minPrice,
        priceMax: maxPrice,
        productType,
        farmId,
        shopId,
        approvalStatus: "approved",
        status: "available",
      })
      .then((response) => {
        if (!active) return;
        setProducts(response.data);
        setStatus("");
      })
      .catch((error) => {
        if (!active) return;
        setStatus(
          error instanceof Error
            ? error.message
            : lang === "en"
              ? "Unable to load marketplace stock"
              : "Impossible de charger le marché"
        );
      });

    return () => {
      active = false;
    };
  }, [search, categoryFilter, regionFilter, minPrice, maxPrice, productType, farmId, shopId, lang]);

  const activeFilterCount = [search, categoryFilter, regionFilter, minPrice, maxPrice, productType, farmId, shopId].filter(Boolean).length;
  const featuredProduct = products[0];
  const farmProducts = products.filter((product) => product.productType === "farm_product").length;
  const shopProducts = products.filter((product) => product.productType === "shop_product").length;
  const lowStock = products.filter((product) => product.quantity > 0 && product.quantity < 10).length;
  const priceRange = useMemo(() => {
    if (!products.length) return "XAF";
    const prices = products.map((product) => product.price ?? 0);
    return `${Math.min(...prices).toLocaleString()} - ${Math.max(...prices).toLocaleString()} XAF`;
  }, [products]);

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setRegionFilter("");
    setMinPrice("");
    setMaxPrice("");
    setProductType("");
    setFarmId("");
    setShopId("");
  };

  return (
    <main className="app-page marketplace-pro-page">
      <AppNav />

      <section className="market-pro-hero">
        <div className="market-pro-hero__copy">
          <span className="market-pro-kicker">
            <ShieldCheck size={16} />
            {t("market.eyebrow")}
          </span>
          <h1>{t("market.title")}</h1>
          <p>
            {lang === "en"
              ? "Source live birds, eggs, chicks, feed, vaccines, and farm equipment from verified PoultryHub sellers with clean inventory and confident purchasing."
              : "Achetez poulets, œufs, poussins, aliments, vaccins et équipements auprès de vendeurs PoultryHub vérifiés avec un stock clair."}
          </p>
          <div className="market-pro-search">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("market.search_placeholder")}
            />
            <button type="button">
              {lang === "en" ? "Search" : "Rechercher"}
            </button>
          </div>
          <div className="market-pro-trust-row">
            <span><BadgeCheck size={16} /> Verified farms</span>
            <span><Truck size={16} /> Local delivery ready</span>
            <span><Clock3 size={16} /> Fresh stock signals</span>
          </div>
        </div>

        <div className="market-pro-hero__feature" aria-label="Featured marketplace product">
          <div className="market-pro-feature-card">
            <div className="market-pro-feature-media">
              <img
                src={featuredProduct ? productImage(featuredProduct) : "/images/seed/eggs-poultry-products.png"}
                alt={featuredProduct?.name ?? "PoultryHub marketplace products"}
              />
              <span><Sparkles size={15} /> Featured stock</span>
            </div>
            <div className="market-pro-feature-body">
              <p>{featuredProduct?.productType === "shop_product" ? "Shop supply" : "Farm product"}</p>
              <h2>{featuredProduct?.name ?? "Verified poultry marketplace"}</h2>
              <strong>{featuredProduct ? formatPrice(featuredProduct.price) : "Fresh stock available"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="market-pro-metrics" aria-label="Marketplace metrics">
        <div>
          <Package size={20} />
          <span>{products.length}</span>
          <p>{lang === "en" ? "Approved products" : "Produits approuvés"}</p>
        </div>
        <div>
          <Wheat size={20} />
          <span>{farmProducts}</span>
          <p>{lang === "en" ? "Farm listings" : "Produits de ferme"}</p>
        </div>
        <div>
          <Store size={20} />
          <span>{shopProducts}</span>
          <p>{lang === "en" ? "Shop supplies" : "Fournitures"}</p>
        </div>
        <div>
          <SlidersHorizontal size={20} />
          <span>{priceRange}</span>
          <p>{lang === "en" ? "Current price range" : "Fourchette de prix"}</p>
        </div>
      </section>

      <section className="market-pro-command">
        <div className="market-pro-category-strip">
          <button className={!categoryFilter ? "active" : ""} onClick={() => setCategoryFilter("")}>
            {t("market.all_categories")}
          </button>
          {categories.slice(0, 7).map((category) => (
            <button
              key={category._id}
              className={categoryFilter === category._id ? "active" : ""}
              onClick={() => setCategoryFilter(category._id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="market-pro-filter-summary">
          <Filter size={16} />
          {activeFilterCount
            ? lang === "en"
              ? `${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}`
              : `${activeFilterCount} filtre${activeFilterCount > 1 ? "s" : ""} actif${activeFilterCount > 1 ? "s" : ""}`
            : lang === "en"
              ? "All verified stock"
              : "Tout le stock vérifié"}
        </div>
      </section>

      <div className="market-pro-layout">
        <aside className="market-pro-filters">
          <div className="market-pro-filters__head">
            <div>
              <span>{lang === "en" ? "Refine" : "Affiner"}</span>
              <h2>{t("market.filters")}</h2>
            </div>
            <SlidersHorizontal size={20} />
          </div>

          <label>
            <span>{lang === "en" ? "Product source" : "Source du produit"}</span>
            <select value={productType} onChange={(event) => setProductType(event.target.value)}>
              <option value="">{lang === "en" ? "All sources" : "Toutes les sources"}</option>
              <option value="farm_product">{lang === "en" ? "Farm products" : "Produits de ferme"}</option>
              <option value="shop_product">{lang === "en" ? "Shop supplies" : "Fournitures boutique"}</option>
            </select>
          </label>

          <label>
            <span>{lang === "en" ? "Region" : "Région"}</span>
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option value="">{t("market.all_locations")}</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </label>

          <label>
            <span>{lang === "en" ? "Price range" : "Prix"}</span>
            <div className="market-pro-price-row">
              <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" placeholder="Min" />
              <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" placeholder="Max" />
            </div>
          </label>

          <div className="market-pro-filter-note">
            <ShieldCheck size={18} />
            <p>{lang === "en" ? "Only approved sellers and available stock appear in this marketplace." : "Seuls les vendeurs approuvés et stocks disponibles apparaissent ici."}</p>
          </div>

          <button className="market-pro-clear" type="button" onClick={clearFilters}>
            {t("market.clear_filters")}
          </button>
        </aside>

        <section className="market-pro-results">
          <div className="market-pro-results-head">
            <div>
              <span>{lang === "en" ? "Marketplace stock" : "Stock du marché"}</span>
              <h2>
                {lang === "en"
                  ? `${products.length} verified listing${products.length === 1 ? "" : "s"}`
                  : `${products.length} annonce${products.length === 1 ? "" : "s"} vérifiée${products.length === 1 ? "" : "s"}`}
              </h2>
            </div>
            {lowStock > 0 && (
              <p>{lowStock} {lang === "en" ? "low-stock item(s)" : "article(s) presque épuisé(s)"}</p>
            )}
          </div>

          {status && (
            <div className="market-pro-state">
              <Package size={28} />
              <p>{status}</p>
            </div>
          )}

          {!status && products.length === 0 && (
            <div className="market-pro-state">
              <ShoppingBag size={28} />
              <h3>{lang === "en" ? "No matching stock" : "Aucun stock correspondant"}</h3>
              <p>
                {lang === "en"
                  ? "Try widening the region, source, or price filters."
                  : "Essayez d'élargir la région, la source ou les filtres de prix."}
              </p>
            </div>
          )}

          {!status && products.length > 0 && (
            <div className="market-pro-grid">
              {products.map((product, index) => (
                <article key={product._id} className="market-pro-card" style={{ animationDelay: `${index * 45}ms` }}>
                  <Link href={`/products/${product._id}`} className="market-pro-card__media">
                    <img src={productImage(product)} alt={product.name} />
                    <span className={product.productType === "farm_product" ? "farm" : "shop"}>
                      {product.productType === "farm_product" ? "Farm" : "Shop"}
                    </span>
                  </Link>
                  <div className="market-pro-card__body">
                    <div className="market-pro-card__meta">
                      <span><BadgeCheck size={14} /> Approved</span>
                      <span className={product.quantity < 10 ? "low" : ""}>{product.quantity} {product.unit}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description || (lang === "en" ? "Verified PoultryHub marketplace product." : "Produit vérifié PoultryHub.")}</p>
                    <div className="market-pro-card__foot">
                      <div>
                        <small>{lang === "en" ? "Unit price" : "Prix unitaire"}</small>
                        <strong>{formatPrice(product.price)}</strong>
                      </div>
                      <Link href={`/products/${product._id}`}>
                        {lang === "en" ? "Inspect" : "Voir"}
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
