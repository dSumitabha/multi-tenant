import InventorySummary from "@/components/InventorySummary";
import NavBar from '@/components/NavBar'

export default function Home() {
  return (
    <>
    <NavBar />
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 transition-colors">
        <div className="max-w-6xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">
                    Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Inventory overview across products and variants
                </p>
            </header>

            <InventorySummary />
        </div>
    </div>
    </>
  );
}