"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Shop } from "@/lib/types";
import { useAuth } from "../AuthContext";

export default function CreateShopForm({ onCreated }: { onCreated: (shop: Shop) => void }) {
  const { token } = useAuth();
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("Creating shop...");
    const response = await api.create<Shop>(
      "/shops",
      {
        name: formData.get("name"),
        location: formData.get("location"),
        city: formData.get("city"),
        region: formData.get("region"),
        description: formData.get("description")
      },
      token
    );
    onCreated(response.data);
    setMessage("Shop submitted for admin approval.");
  }

  return (
    <form className="connected-form" action={submit}>
      <input name="name" placeholder="Shop name" required />
      <input name="location" placeholder="Location" required />
      <input name="city" placeholder="City" />
      <input name="region" placeholder="Region" />
      <textarea name="description" placeholder="Description" rows={3} />
      <button type="submit">Create shop</button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
