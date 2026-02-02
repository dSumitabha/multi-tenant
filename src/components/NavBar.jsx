"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export default function DashboardNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navItems = [
        { name: "Dashboard", href: "/" },
        { name: "Products", href: "/products" },
        { name: "Sales Orders", href: "/sales-orders" },
        { name: "Purchase Orders", href: "/purchase-orders" },
        { name: "Stock Movements", href: "/stock-movements" },
    ];

    const handleLogout = async () => {
        setIsLoggingOut(true);

        const logoutPromise = fetch("/api/auth/logout", { method: "POST" }).then(
            async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Logout failed");

                router.push("/login");
                return data;
            }
        );

        toast.promise(logoutPromise, {
            loading: "Logging out...",
            success: () => "Logged out successfully!",
            error: (err) => err.message,
            finally: () => setIsLoggingOut(false),
        });
    };

    return (
        <nav className="h-14 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-8 flex items-center shadow-sm transition-colors">
            <ul className="flex space-x-6 flex-1">
                {navItems.map((item) => (
                    <li key={item.name}>
                        <Link
                            href={item.href}
                            className={`text-sm font-medium transition-colors ${
                                pathname === item.href
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                            }`}
                        >
                            {item.name}
                        </Link>
                    </li>
                ))}
            </ul>
            <div>
                <button
                    className="px-4 py-2 border  text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-200 focus:outline-none disabled:opacity-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
            </div>
        </nav>
    );
}