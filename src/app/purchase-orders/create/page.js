"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import NavBar from '@/components/NavBar'

export default function CreatePOPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [supplierId, setSupplierId] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        const isInvalid = items.some(
            item => !item.productId || !item.variantId || item.orderedQty <= 0
        );
    
        if (isInvalid) {
            toast.warning("Please complete all item fields with valid quantities.");
            return;
        }
    
        try {
            const response = await fetch("/api/purchase-orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    supplierId,
                    items,
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                toast.success("Purchase Order created successfully");
                return;
            }
    
            // Role / auth aware errors
            if (response.status === 403) {
                toast.error("You are not authorized to create purchase orders.");
                return;
            }
    
            if (response.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                return;
            }
    
            if (response.status === 400) {
                toast.warning(data.error || "Invalid purchase order data.");
                return;
            }
    
            toast.error(data.error || "Failed to create purchase order.");
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Network error. Please check your connection.");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleFetch = async (url) => {
            const res = await fetch(url);
            // Return both the data and the status so we can check it later
            return {
                data: res.ok ? await res.json() : [],
                status: res.status
            };
        };
    
        Promise.all([
            handleFetch("/api/suppliers"),
            handleFetch("/api/products")
        ]).then(([supRes, prodRes]) => {
            // 1. Handle specialized errors once
            if (supRes.status === 401 || prodRes.status === 401) {
                toast.error("Session expired. Please log in again.");
            } else if (supRes.status === 403 || prodRes.status === 403) {
                toast.error("You don't have permission to view this data.");
            } else if (!supRes.ok || !prodRes.ok) {
                // Optional: catch-all for other 400/500 errors
                toast.warning("Some data failed to load.");
            }
    
            // 2. Set the data (fallback to empty array is handled in handleFetch)
            setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        }).catch(err => {
            console.error("Fetch error:", err);
            toast.error("Network error. Please check your connection.");
            setSuppliers([]);
            setProducts([]);
        });
    }, []);

    const addItem = () => setItems([
        ...items, 
        { productId: "", variantId: "", orderedQty: 1, unitPrice: 0 }
    ]);

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index, field, value) => {
        setItems(items.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [field]: value };
    
                // Logic to auto-populate price on variant change
                if (field === "variantId") {
                    const product = products.find(p => p._id === item.productId);
                    const variant = product?.variants.find(v => v._id === value);
                    if (variant) {
                        updatedItem.unitPrice = variant.price;
                    }
                }
    
                return updatedItem;
            }
            return item;
        }));
    };

    return (
        <>
        <NavBar/>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 transition-colors">

            <form className="max-w-4xl mx-auto space-y-6" onSubmit={handleSubmit}>
                <header className="mb-10">
                    <h1 className="text-2xl font-bold tracking-tight">Create Purchase Order</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Fill in the details to generate a new PO.</p>
                </header>


                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Supplier
                    </label>
                    <select
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-4 py-4 focus:border-blue-500 outline-none transition-all"
                        value={supplierId}
                        onChange={e => setSupplierId(e.target.value)}
                        required
                    >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-500">Select a supplier</option>
                        {suppliers?.map(s => (
                            <option key={s._id} value={s._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                {s.name}
                            </option>
                        ))}
                    </select>
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Line Items</h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                        >
                            + Add Item
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {items.map((item, index) => {
                            const product = products.find(p => p._id === item.productId);
                            return (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-md border border-slate-200 dark:border-slate-800 relative group"
                                >
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Product</label>
                                        <select
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-3 text-sm focus:border-blue-500 outline-none"
                                            value={item.productId}
                                            onChange={e => updateItem(index, "productId", e.target.value)}
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900">Choose Product</option>
                                            {products?.map(p => (
                                                <option key={p._id} value={p._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Variant</label>
                                        <select
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-3 text-sm focus:border-blue-500 outline-none"
                                            value={item.variantId}
                                            onChange={e => updateItem(index, "variantId", e.target.value)}
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900">Select Variant</option>
                                            {product?.variants.map(v => (
                                                <option key={v._id} value={v._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{v.sku}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Qty</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-3 text-sm focus:border-blue-500 outline-none appearance-none"
                                            placeholder="0"
                                            value={item.orderedQty}
                                            onChange={e => updateItem(index, "orderedQty", e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Price</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-3 text-sm outline-none cursor-not-allowed text-slate-500"
                                            placeholder="0.00"
                                            value={item.unitPrice}
                                            readOnly
                                            tabIndex="-1"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="absolute -right-2 -top-2 md:relative md:right-0 md:top-0 md:col-span-1 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors pt-4"
                                    >
                                        <span className="bg-white dark:bg-slate-800 md:bg-transparent rounded-full p-1 border border-slate-200 md:border-0 shadow-sm md:shadow-none">✕</span>
                                    </button>
                                </div>
                            );
                        })}

                        {items.length === 0 && (
                            <p className="text-center py-10 text-slate-400 text-sm italic">Add an item to get started.</p>
                        )}
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        disabled={loading} 
                        className="relative flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-10 rounded-md shadow-lg shadow-blue-500/20 active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-all min-w-[240px]"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </>
                        ) : (
                            "Create Purchase Order"
                        )}
                    </button>
                </div>
            </form>
        </div>
        </>
    );
}