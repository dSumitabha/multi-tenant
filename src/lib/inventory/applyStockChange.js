export async function applyStockChange({
    tenantConn,
    productId,
    variantId,
    direction,
    quantity,
    reason,
    sourceType,
    sourceId = null,
    idempotencyKey = null
}) {
    const Product = getProductModel(tenantConn);
    const StockMovement = getStockMovementModel(tenantConn);
    const StockSnapshot = getStockSnapshotModel(tenantConn);

    if (idempotencyKey) {
        const existing = await StockMovement.findOne({ idempotencyKey });
        if (existing) {
            return {
                success: true,
                skipped: true,
                currentStock: null
            };
        }
    }

    const product = await Product.findOne({
        _id: productId,
        isActive: true,
        "variants._id": variantId
    });

    if (!product) {
        throw new Error("Product or variant not found");
    }

    const variant = product.variants.id(variantId);

    if (!variant.isActive) {
        throw new Error("Variant inactive");
    }

    if (direction === "OUT" && variant.stock < quantity) {
        throw new Error("Insufficient stock");
    }

    variant.stock = direction === "IN" ? variant.stock + quantity : variant.stock - quantity;

    await product.save();

    await StockSnapshot.findOneAndUpdate(
        { productId, variantId },
        { $set: { availableQty: variant.stock } },
        { upsert: true }
    );

    await StockMovement.create({
        productId,
        variantId,
        direction,
        quantity,
        reason,
        sourceType,
        sourceId,
        idempotencyKey
    });

    return {
        success: true,
        currentStock: variant.stock
    };
}