"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const SIZES = ["S", "M", "L"];
  const COLORS = ["Red", "Blue", "Black"];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    selectedSizes: [],
    selectedColors: [],
  });

  const toggleSelection = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // ... (keep your existing variants logic here)
    setLoading(false);
  };

  // Re-usable Tailwind class constants for consistency
  const cardStyle = "bg-[#111827] border border-gray-800 rounded-2xl p-6 mb-6 shadow-2xl";
  const inputStyle = "w-full mt-2 p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600";
  const labelStyle = "text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1";

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 p-4 md:p-10 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Add New Product</h1>
          <p className="text-gray-400 mt-1">Fill in the information below to create a new product entry.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Basics */}
          <div className={cardStyle}>
            <h2 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest">General Details</h2>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Product Name</label>
                <input
                  required
                  className={inputStyle}
                  placeholder="Enter product title..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelStyle}>Description</label>
                <textarea
                  rows="4"
                  className={inputStyle}
                  placeholder="Tell customers about this product..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Numbers */}
          <div className={cardStyle}>
            <h2 className="text-sm font-bold text-emerald-400 mb-6 uppercase tracking-widest">Inventory & Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyle}>Base Price (USD)</label>
                <input
                  type="number"
                  className={inputStyle}
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <label className={labelStyle}>Stock Per Variant</label>
                <input
                  type="number"
                  className={inputStyle}
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Attributes */}
          <div className={cardStyle}>
            <h2 className="text-sm font-bold text-purple-400 mb-6 uppercase tracking-widest">Variant Selection</h2>
            <div className="space-y-8">
              <div>
                <label className={labelStyle}>Available Sizes</label>
                <div className="flex gap-3 mt-3">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSelection("selectedSizes", size)}
                      className={`h-12 w-16 rounded-xl border-2 font-bold transition-all ${
                        formData.selectedSizes.includes(size)
                          ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelStyle}>Available Colors</label>
                <div className="flex gap-3 mt-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleSelection("selectedColors", color)}
                      className={`px-6 py-2 rounded-xl border-2 font-bold transition-all ${
                        formData.selectedColors.includes(color)
                          ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-6 mt-10 pb-10">
            <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-white font-medium transition-colors">
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Publishing..." : "Publish Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}