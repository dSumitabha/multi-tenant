"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProductListItem from "./ProductListItem";
import NavBar from '@/components/NavBar'

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/products");

                if (res.status === 401) {
                    toast.error("Session expired. Please login again.");
                    setError("unauthorized");
                    return;
                }

                if (res.status === 403) {
                    toast.error("You aren't authorized to view products.");
                    setError("forbidden");
                    return;
                }

                const data = await res.json();

                if (!Array.isArray(data)) {
                    throw new Error("Invalid response");
                }

                setProducts(data);
            } catch (err) {
                toast.error("Failed to load products");
                setError("error");
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 transition-colors">
                <div className="max-w-6xl mx-auto space-y-6">
                    <header>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Products
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Browse and manage all products in your inventory
                        </p>
                    </header>

                    {loading && (
                        <div className="p-6 text-slate-500 dark:text-slate-400">
                            Loading products…
                        </div>
                    )}

                    {error && (
                        <div className="p-6 text-slate-500 dark:text-slate-400">
                            No products to display.
                        </div>
                    )}

                    {!loading && !error && products.length > 0 && (
                        <div className="grid gap-4">
                            {products.map((product) => (
                                <ProductListItem
                                    key={product._id}
                                    product={product}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}