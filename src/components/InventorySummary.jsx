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
                        <tr className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                            <th className="px-3 py-2 text-left w-fit whitespace-nowrap">
                                Product
                            </th>
                            <th className="px-3 py-2 text-left w-fit whitespace-nowrap">
                                SKU
                            </th>

                            <th className="px-2 py-2 text-right w-fit whitespace-normal break-words leading-tight">
                                Available Stock
                            </th>

                            <th className="px-2 py-2 text-right w-fit whitespace-normal break-words leading-tight">
                                Incoming Stock
                            </th>

                            <th className="px-2 py-2 text-right w-fit whitespace-normal break-words leading-tight">
                                Reserved Stock
                            </th>

                            <th className="px-2 py-2 text-right w-fit whitespace-normal break-words leading-tight">
                                Unit Price
                            </th>

                            <th className="px-2 py-2 text-right w-fit whitespace-normal break-words leading-tight">
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

                        {items.map((item, index) => {
                            const totalStock = (item?.availableQty ?? 0) + (item?.pendingPOQty ?? 0);
                            const isLowStock = totalStock < 50;

                            return (
                                <tr
                                    key={item?.variantId ?? index}
                                    className="border-t border-slate-200 dark:border-slate-800 relative"
                                >
                                    <td className="px-4 py-3">{item?.productName ?? "—"}</td>

                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                        {item?.sku ?? "—"}
                                    </td>

                                    <td
                                        className={`px-4 py-3 text-center font-semibold ${
                                            item?.availableQty > 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-slate-500 dark:text-slate-400"
                                        }`}
                                    >
                                        {item?.availableQty ?? 0}
                                    </td>

                                    <td className="px-4 py-3 text-center">{item?.pendingPOQty ?? 0}</td>
                                    <td className="px-4 py-3 text-center">{item?.pendingSOQty ?? 0}</td>

                                    <td className="px-4 py-3 text-right">₹{item?.unitPrice ?? 0}</td>

                                    <td className="px-4 py-3 text-right font-medium flex items-center justify-end space-x-2">
                                        <span>₹{item?.inventoryValue ?? 0}</span>
                                        <span className={`w-3 h-3 rounded-full ${isLowStock ? "bg-red-500 animate-pulse" : "invisible"}`} title={isLowStock ? "Low Stock" : ""}></span>
                                    </td>
                                </tr>
                            );
                        })}

                    </tbody>
                </table>
            </div>
        </section>
    );
}