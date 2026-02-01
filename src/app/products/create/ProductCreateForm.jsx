"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ProductCreateForm() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [attributes, setAttributes] = useState([]);
    const [variants, setVariants] = useState([]);

    function addAttribute() {
        setAttributes([...attributes, { name: "", values: "" }]);
    }

    function updateAttribute(index, field, value) {
        const updated = [...attributes];
        updated[index][field] = value;
        setAttributes(updated);
    }

    function generateVariants() {
        if (!attributes.length) return;

        const parsed = attributes.map(attr => ({
            name: attr.name,
            values: attr.values.split(",").map(v => v.trim()).filter(Boolean),
        }));

        const combinations = parsed.reduce(
            (acc, attr) =>
                acc.flatMap(prev =>
                    attr.values.map(v => [...prev, { [attr.name]: v }])
                ),
            [[]]
        );

        const generated = combinations.map((combo, i) => ({
            sku: `${name.replace(/\s+/g, "-").toUpperCase()}-${i + 1}`,
            attributes: Object.assign({}, ...combo),
            price: 0,
            reorderLevel: 0,
        }));

        setVariants(generated);
    }

    async function handleSubmit() {
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    attributes: attributes.map(a => ({
                        name: a.name,
                        values: a.values.split(",").map(v => v.trim()),
                    })),
                    variants,
                }),
            });

            if (!res.ok) throw new Error("Failed to create product");

            toast.success("Product created successfully");
        } catch {
            toast.error("Could not create product");
        }
    }

    return (
        <div className="space-y-6">
            {/* Product Info */}
            <div className="space-y-4">
                <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white"
                    placeholder="Product name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                <textarea
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white"
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* Attributes */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-white font-medium">Attributes</h2>
                    <button
                        onClick={addAttribute}
                        className="text-sm text-emerald-400"
                    >
                        + Add Attribute
                    </button>
                </div>

                {attributes.map((attr, i) => (
                    <div key={i} className="flex gap-3">
                        <input
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white"
                            placeholder="Attribute name"
                            value={attr.name}
                            onChange={e =>
                                updateAttribute(i, "name", e.target.value)
                            }
                        />
                        <input
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white"
                            placeholder="Values (comma separated)"
                            value={attr.values}
                            onChange={e =>
                                updateAttribute(i, "values", e.target.value)
                            }
                        />
                    </div>
                ))}
            </div>

            {/* Generate Variants */}
            <button
                onClick={generateVariants}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded"
            >
                Generate Variants
            </button>

            {/* Variants */}
            {variants.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-white font-medium">Variants</h2>

                    {variants.map((v, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-4 gap-3 bg-zinc-900 border border-zinc-800 rounded p-3"
                        >
                            <input
                                className="bg-zinc-800 px-2 py-1 rounded text-white"
                                value={v.sku}
                                onChange={e => {
                                    const updated = [...variants];
                                    updated[i].sku = e.target.value;
                                    setVariants(updated);
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                className="bg-zinc-800 px-2 py-1 rounded text-white"
                                value={v.price}
                                onChange={e => {
                                    const updated = [...variants];
                                    updated[i].price = Number(e.target.value);
                                    setVariants(updated);
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Reorder level"
                                className="bg-zinc-800 px-2 py-1 rounded text-white"
                                value={v.reorderLevel}
                                onChange={e => {
                                    const updated = [...variants];
                                    updated[i].reorderLevel = Number(e.target.value);
                                    setVariants(updated);
                                }}
                            />
                            <div className="text-gray-400 text-sm">
                                {Object.entries(v.attributes)
                                    .map(([k, val]) => `${k}: ${val}`)
                                    .join(", ")}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded"
            >
                Save Product
            </button>
        </div>
    );
}