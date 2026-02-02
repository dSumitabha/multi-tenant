"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DashboardNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: "Dashboard", href: "/" },
        { name: "Products", href: "/products" },
        { name: "Sales Orders", href: "/sales-orders" },
        { name: "Purchase Orders", href: "/purchase-orders" },
        { name: "Stock Movements", href: "/stock-movements" },
    ];

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data?.error || "Failed to logout");
                return;
            }

            toast.success("Logged out successfully!");
            router.push("/login");
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Try again.");
        }
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
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}