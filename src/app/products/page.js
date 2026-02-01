"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProductListItem from "./ProductListItem";

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

    if (loading) {
        return <p className="text-gray-400 p-6">Loading products…</p>;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="p-6 text-gray-400">
                    No products to display.
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold text-white mb-6">
                Products
            </h1>

            <div className="grid gap-4">
                {products.map((product) => (
                    <ProductListItem
                        key={product._id}
                        product={product}
                    />
                ))}
            </div>
        </div>
    );
}