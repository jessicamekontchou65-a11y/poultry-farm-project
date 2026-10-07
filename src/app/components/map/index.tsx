"use client";

import dynamic from "next/dynamic";

// Leaflet needs `window`, so the maps only load in the browser.
const loading = () => <div className="osm-map osm-map--loading" style={{ height: 320 }} aria-busy="true" />;

export const LocationsMap = dynamic(() => import("./LocationsMap"), { ssr: false, loading });
export const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false, loading });
export * from "./geo";
