"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NavBar from '@/components/NavBar'

const STATUS_FLOW = {
    DRAFT: "CONFIRMED",
    CONFIRMED: "FULFILLED",
    FULFILLED: "RETURNED"
};

export default function SalesOrderIndexPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/sales-orders");
    
                if (res.status === 401) {
                    toast.error("Session expired. Please log in.");
                    setOrders([]);
                    return;
                }

                if (res.status === 403) {
                    toast.error("Unauthorized. Log in with authorized credentials.");
                    setOrders([]);
                    return;
                }

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData?.error || "Failed to fetch sales orders");
                }
    
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load sales orders");
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
    
        fetchOrders();
    }, []);    

    async function handleNextStatus(orderId) {
        if (updatingId) return;
    
        const order = orders.find(o => o._id === orderId);
        if (!order) return;
    
        const nextStatus = STATUS_FLOW?.[order?.status];
        if (!nextStatus) {
            toast.warning("No further status transition allowed.");
            return;
        }
    
        try {
            setUpdatingId(orderId);
    
            const res = await fetch(`/api/sales-orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
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
                toast.error(data.error || "Failed to update order status.");
                return;
            }
    
            // Optimistic local update
            setOrders(prev =>
                prev.map(o =>
                    o._id === orderId ? { ...o, status: data.status } : o
                )
            );
    
            toast.success(`Order status updated to ${data.status}`);
        } catch (err) {
            console.error("Status update error:", err);
            toast.error("Network error while updating order status.");
        } finally {
            setUpdatingId(null);
        }
    }    

    return (
        <>
        <NavBar />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 transition-colors">
            <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Sales Orders
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        View and manage customer sales orders
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => router.push("/sales-orders/create")}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    >
                        Create
                    </button>
                </div>
            </header>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th className="text-left px-6 py-4">Customer</th>
                                <th className="text-left px-6 py-4">Items</th>
                                <th className="text-left px-6 py-4">Status</th>
                                <th className="text-left px-6 py-4">Created</th>
                                <th className="text-right px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400">
                                        Loading sales orders…
                                    </td>
                                </tr>
                            )}

                            {!loading && orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                                        No sales orders found.
                                    </td>
                                </tr>
                            )}

                            {orders.map(order => {
                                const items = Array.isArray(order?.items) ? order.items : [];
                                const nextStatus = STATUS_FLOW?.[order?.status];

                                return (
                                    <tr
                                        key={order?._id ?? Math.random()}
                                        className="border-t border-slate-100 dark:border-slate-800 align-top"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {order?.customerName || "—"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                {items.length === 0 && (
                                                    <p className="text-xs text-slate-400 italic">
                                                        No items
                                                    </p>
                                                )}

                                                {items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-xs bg-slate-50 dark:bg-slate-950/60
                                                                border border-slate-200 dark:border-slate-800
                                                                rounded-md px-3 py-2"
                                                    >
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                                {item?.productName || "Unnamed Product"}
                                                            </p>

                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                                                                <span>
                                                                    <strong>SKU:</strong> {item?.variantSku || "—"}
                                                                </span>

                                                                {item?.variantAttributes &&
                                                                    Object.entries(item.variantAttributes).length > 0 && (
                                                                        <span className="italic">
                                                                            {Object.entries(item.variantAttributes)
                                                                                .map(([k, v]) => `${k}: ${v}`)
                                                                                .join(" | ")}
                                                                        </span>
                                                                    )}

                                                                <span>
                                                                    <strong>Qty:</strong> {item?.orderedQty ?? 0}
                                                                </span>

                                                                <span>
                                                                    <strong>Total:</strong> ₹{(Number(item?.orderedQty) || 0) * (Number(item?.unitPrice) || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold
                                                bg-slate-200 dark:bg-slate-700
                                                text-slate-700 dark:text-slate-200">
                                                {order?.status || "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {order?.createdAt
                                                ? new Date(order.createdAt).toLocaleDateString()
                                                : "—"}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                disabled={!STATUS_FLOW?.[order?.status] || updatingId === order?._id}
                                                onClick={() => handleNextStatus(order._id)}
                                                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-md
                                                    bg-slate-900 dark:bg-slate-100
                                                    text-white dark:text-slate-900
                                                    disabled:opacity-40 disabled:cursor-not-allowed
                                                    hover:opacity-90 transition-all"
                                            >
                                                {updatingId === order?._id
                                                    ? "Updating…"
                                                    : STATUS_FLOW?.[order?.status]
                                                        ? `Mark as ${STATUS_FLOW[order?.status]}`
                                                        : "Completed"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    );
}