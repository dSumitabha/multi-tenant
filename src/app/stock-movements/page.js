"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import NavBar from '@/components/NavBar'

export default function StockMovementsPage() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMovements = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/stock-movements");
                const data = await res.json();

                if (res.status === 401) {
                    toast.error("Session expired. Please log in.");
                    setMovements([]);
                    return;
                }

                if (res.status === 403) {
                    toast.error("Unauthorized. Log in with authorized credentials.");
                    setMovements([]);
                    return;
                }

                if (!res.ok) {
                    toast.error(data.error || "Failed to fetch stock movements");
                    setMovements([]);
                    return;
                }

                setMovements(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                toast.error("Network error while fetching stock movements");
                setMovements([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMovements();
    }, []);

    return (
        <>
        <NavBar />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 transition-colors">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Track all inventory changes, including purchases, sales, and returns.
                </p>
            </header>

            {loading ? (
                <p className="text-center py-20 text-slate-400">Loading stock movements...</p>
            ) : movements.length === 0 ? (
                <p className="text-center py-20 text-slate-400">No stock movements found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-slate-200 dark:border-slate-800 rounded-md">
                        <thead className="bg-slate-100 dark:bg-slate-900/50">
                            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-4 py-2">Product</th>
                                <th className="px-4 py-2">Variant</th>
                                <th className="px-4 py-2">Direction</th>
                                <th className="px-4 py-2">Quantity</th>
                                <th className="px-4 py-2">Reason</th>
                                <th className="px-4 py-2">Source</th>
                                <th className="px-4 py-2">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map((m) => {
                                const productName = m?.product?.name ?? "N/A";
                                const variantSku = m?.variant?.sku ?? "N/A";
                                const variantAttrs = m?.variant?.attributes
                                    ? Object.entries(m.variant.attributes)
                                          .map(([key, val]) => `${key}: ${val}`)
                                          .join(", ")
                                    : "";
                                const direction = m?.direction ?? "-";
                                const quantity = m?.quantity ?? 0;
                                const reason = m?.reason ?? "-";
                                const sourceType = m?.source?.type ?? "-";
                                const sourceInfo =
                                    sourceType === "PO"
                                        ? m?.source?.supplierName ?? "Unknown Supplier"
                                        : sourceType === "SO"
                                        ? m?.source?.customerName ?? "Unknown Customer"
                                        : "-";
                                const timestamp = m?.createdAt
                                    ? new Date(m.createdAt).toLocaleString()
                                    : "-";

                                return (
                                    <tr
                                        key={m?._id}
                                        className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">{productName}</td>
                                        <td className="px-4 py-3">
                                            {variantSku} {variantAttrs && `(${variantAttrs})`}
                                        </td>
                                        <td className="px-4 py-3 font-medium">{direction}</td>
                                        <td className="px-4 py-3">{quantity}</td>
                                        <td className="px-4 py-3">{reason}</td>
                                        <td className="px-4 py-3">
                                            {sourceType}: {sourceInfo}
                                        </td>
                                        <td className="px-4 py-3">{timestamp}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </>
    );
}