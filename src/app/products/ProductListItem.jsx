export default function ProductListItem({ product }) {
    const totalStock = product.variants?.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
    );

    return (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-white">
                        {product.name}
                    </h2>

                    <p className="text-sm text-gray-400">
                        {product.variants.length} variants
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-sm text-gray-400">Total Stock</p>
                    <p className="text-xl font-semibold text-emerald-400">
                        {totalStock}
                    </p>
                </div>
            </div>
        </div>
    );
}