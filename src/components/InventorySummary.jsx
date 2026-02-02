"use client";

import { useEffect, useState } from "react";

export default function InventorySummary() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchInventory() {
            try {
                const res = await fetch("/api/dashboard/inventory");

                if (!res.ok) {
                    throw new Error("Failed to fetch inventory");
                }

                const json = await res.json();
                setData(json ?? null);
            } catch (err) {
                setError(err?.message ?? "Something went wrong");
            } finally {
                setLoading(false);
            }
        }

        fetchInventory();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Loading inventory…
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-6">
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            </div>
        );
    }

    const items = data?.items ?? [];
    const totalInventoryValue = data?.totalInventoryValue ?? 0;

    return (
        <section className="space-y-4">
            {/* KPI Card */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Total Inventory Value
                </p>
                <p className="mt-1 text-2xl font-semibold">
                    ₹{totalInventoryValue.toLocaleString?.() ?? 0}
                </p>
            </div>

            {/* Inventory Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">
                                Product
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                                SKU
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                Available
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                Unit Price
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                Inventory Value
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                                >
                                    No inventory data available
                                </td>
                            </tr>
                        )}

                        {items.map((item, index) => (
                            <tr
                                key={item?.variantId ?? index}
                                className="border-t border-slate-200 dark:border-slate-800"
                            >
                                <td className="px-4 py-3">
                                    {item?.productName ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                    {item?.sku ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {item?.availableQty ?? 0}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    ₹{item?.unitPrice ?? 0}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                    ₹{item?.inventoryValue ?? 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}