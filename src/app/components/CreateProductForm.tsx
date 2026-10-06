"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuth } from "../AuthContext";

export default function CreateProductForm({ onCreated }: { onCreated: (product: Product) => void }) {
  const { token } = useAuth();
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("Creating product...");
    const response = await api.create<Product>(
      "/products",
      {
        name: formData.get("name"),
        productType: formData.get("productType"),
        categoryId: formData.get("categoryId"),
        price: Number(formData.get("price")),
        quantity: Number(formData.get("quantity")),
        unit: formData.get("unit"),
        description: formData.get("description")
      },
      token
    );
    onCreated(response.data);
    setMessage("Product submitted for marketplace approval.");
  }

  return (
    <form className="connected-form" action={submit}>
      <input name="name" placeholder="Product name" required />
      <select name="productType" defaultValue="farm_product" required>
        <option value="farm_product">Farm product</option>
        <option value="shop_product">Shop product</option>
      </select>
      <input name="categoryId" placeholder="Category ID" required />
      <input name="price" type="number" min="1" placeholder="Price XAF" required />
      <input name="quantity" type="number" min="0" placeholder="Quantity" required />
      <input name="unit" placeholder="Unit, e.g. tray, kg, bird" required />
      <textarea name="description" placeholder="Description" rows={3} />
      <button type="submit">Create product</button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
