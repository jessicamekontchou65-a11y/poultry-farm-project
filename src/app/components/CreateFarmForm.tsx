"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Farm } from "@/lib/types";
import { useAuth } from "../AuthContext";

export default function CreateFarmForm({ onCreated }: { onCreated: (farm: Farm) => void }) {
  const { token } = useAuth();
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("Creating farm...");
    const response = await api.create<Farm>(
      "/farms",
      {
        name: formData.get("name"),
        farmType: formData.get("farmType"),
        location: formData.get("location"),
        city: formData.get("city"),
        region: formData.get("region"),
        description: formData.get("description")
      },
      token
    );
    onCreated(response.data);
    setMessage("Farm submitted for admin approval.");
  }

  return (
    <form className="connected-form" action={submit}>
      <input name="name" placeholder="Farm name" required />
      <select name="farmType" required defaultValue="broiler">
        <option value="broiler">Broiler</option>
        <option value="layer">Layer</option>
        <option value="mixed_poultry">Mixed poultry</option>
        <option value="local_chicken">Local chicken</option>
      </select>
      <input name="location" placeholder="Location" required />
      <input name="city" placeholder="City" />
      <input name="region" placeholder="Region" />
      <textarea name="description" placeholder="Description" rows={3} />
      <button type="submit">Create farm</button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
