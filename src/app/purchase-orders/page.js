"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const NEXT_ACTION_LABEL = {
    DRAFT: "Mark as Sent",
    SENT: "Confirm Order",
    CONFIRMED: "Mark as Received"
};


export default function PurchaseOrdersPage() {
    const [loading, setLoading] = useState(true);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        async function fetchPOs() {
            try {
                const res = await fetch("/api/purchase-orders");

                if (res.status === 401) {
                    toast.error("Session expired. Please login again.");
                    return;
                }

                if (res.status === 403) {
                    toast.error("You don’t have permission to view purchase orders.");
                    return;
                }

                const data = await res.json();

                if (!res.ok) {
                    toast.error(data.error || "Failed to load purchase orders");
                    return;
                }

                setPurchaseOrders(data.data || []);
            } catch (err) {
                toast.error("Network error while loading purchase orders");
            } finally {
                setLoading(false);
            }
        }

        fetchPOs();
    }, []);

    async function handleNextStatus(poId) {
        if (updatingId) return;
    
        try {
            setUpdatingId(poId);
    
            const res = await fetch(`/api/purchase-orders/${poId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: "NEXT" })
            });
    
            const data = await res.json();
    
            if (res.status === 401) {
                toast.error("Session expired. Please login again.");
                return;
            }
    
            if (res.status === 403) {
                toast.error("You don’t have permission to update this order.");
                return;
            }
    
            if (!res.ok) {
                toast.error(data.error || "Failed to update status");
                return;
            }
    
            // 🔁 optimistic local update
            setPurchaseOrders(prev =>
                prev.map(po =>
                    po._id === poId
                        ? { ...po, status: data.status }
                        : po
                )
            );
    
            toast.success(`Order status updated to ${data.status}`);
        } catch {
            toast.error("Network error while updating status");
        } finally {
            setUpdatingId(null);
        }
    }    

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    Purchase Orders
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    View and manage all purchase orders
                </p>
            </div>

            {loading ? (
                <div className="text-slate-500 dark:text-slate-400">
                    Loading purchase orders…
                </div>
            ) : purchaseOrders.length === 0 ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 text-slate-500 dark:text-slate-400">
                    No purchase orders found.
                </div>
            ) : (
                <div className="space-y-4">
                    {purchaseOrders.map(po => (
                        <div
                            key={po._id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Supplier
                                    </p>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                        {po.supplier.name}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
                                        bg-slate-100 text-slate-700
                                        dark:bg-slate-800 dark:text-slate-200">
                                        {po.status}
                                    </span>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(po.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="px-6 py-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-slate-500 dark:text-slate-400">
                                            <th className="py-2">Product</th>
                                            <th className="py-2">Variant</th>
                                            <th className="py-2 text-right">Qty</th>
                                            <th className="py-2 text-right">Unit Price</th>
                                            <th className="py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {po.items.map((item, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-t border-slate-100 dark:border-slate-800"
                                            >
                                                <td className="py-3 text-slate-800 dark:text-slate-100">
                                                    {item.product.name}
                                                </td>
                                                <td className="py-3 text-slate-600 dark:text-slate-300">
                                                    <div>{item.variant.sku}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {Object.entries(item.variant.attributes || {})
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(", ")}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right text-slate-700 dark:text-slate-200">
                                                    {item.orderedQty}
                                                </td>
                                                <td className="py-3 text-right text-slate-700 dark:text-slate-200">
                                                    ₹{item.unitPrice}
                                                </td>
                                                <td className="py-3 text-right font-medium text-slate-800 dark:text-slate-100">
                                                    ₹{item.lineTotal}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
{/* Footer */}
<div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
    <p className="text-sm text-slate-500 dark:text-slate-400">
        {po.itemCount} item{po.itemCount > 1 ? "s" : ""}
    </p>

    <div className="flex items-center gap-4">
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            ₹{po.totalAmount}
        </p>

        {NEXT_ACTION_LABEL[po.status] && (
            <button
                onClick={() => handleNextStatus(po._id)}
                disabled={updatingId === po._id}
                className={`
                    rounded-lg px-4 py-2 text-sm font-medium
                    transition
                    ${
                        updatingId === po._id
                            ? "cursor-not-allowed bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    }
                `}
            >
                {updatingId === po._id
                    ? "Updating…"
                    : NEXT_ACTION_LABEL[po.status]}
            </button>
        )}
    </div>
</div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}