# Stock Movement Architecture

## Purpose

The Stock Movement system is the core consistency mechanism of the inventory domain. It guarantees that stock is never mutated directly and that every change in inventory can be audited, reasoned about, and reproduced deterministically.

This design is intentionally ledger-based and append-only, prioritizing correctness and traceability over convenience.

---

## Design Decision: Ledger-Based Stock Management

### Decision

All inventory changes are recorded as immutable stock movement records. Product and Variant documents never store authoritative stock values.

### Rationale

Directly mutating stock counters leads to:

* Lost updates during concurrent operations
* No historical audit trail
* Complex rollback logic
* Difficulty reasoning about partial receipts, cancellations, and adjustments

A ledger-based approach ensures:

* Complete auditability
* Deterministic stock reconstruction
* Clear separation between intent (orders, receipts) and effect (stock change)
* Safe concurrency handling using database guarantees

### Consequences

* Stock queries require aggregation or cached projections
* Writes are more frequent, but safe
* Reads can be optimized with indexes and snapshots

This tradeoff is intentional and aligned with real-world inventory systems.

---

## Stock Movement Collection Design

### Collection Scope

* Stored inside each tenant database
* No `tenantId` field
* Tenant isolation enforced by database boundary

### Schema

```
StockMovement
    _id
    productId          ObjectId   // references Product
    variantId          ObjectId   // references embedded Variant
    direction          "IN" | "OUT" | "ADJUSTMENT"
    quantity           Number      // always positive
    reason             "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT"
    sourceType         "PO" | "SO" | "RETURN" | "MANUAL"
    sourceId           ObjectId    // PurchaseOrder or SalesOrder ID
    createdAt          Date
```

### Invariants

* Records are append-only
* No updates or deletes are allowed
* Quantity is always positive
* Direction determines stock effect

```
IN          => +quantity
OUT         => -quantity
ADJUSTMENT  => +/-quantity depending on business rule
```

StockMovement documents are created only by internal services, never via public CRUD APIs.

---

## Embedded vs Separate Collection

### Decision

Stock movements are stored in a dedicated collection, not embedded in Product documents.

### Reasons

* High write frequency compared to product updates
* Potentially unbounded growth over time
* Independent indexing and query patterns
* Avoids document bloat and MongoDB document size limits

Embedding movements inside Product would:

* Break scalability
* Make archival and analytics difficult
* Increase write contention on Product documents

A separate collection is the only safe and scalable choice.

---

## Stock Computation Strategy

### Authoritative Stock

The authoritative stock value for a variant is the sum of all its stock movements.

```
currentStock = SUM(
    CASE direction
        WHEN IN  THEN quantity
        WHEN OUT THEN -quantity
    END
)
```

This computation is always correct but not always efficient for frequent reads.

---

## Performance Optimization: Stock Snapshots

### Problem

Aggregating movements on every read does not scale with:

* 10,000+ products
* Frequent dashboard queries
* Real-time order validation

### Solution

Maintain a derived Stock Snapshot per variant.

```
StockSnapshot
    variantId
    currentStock
    updatedAt
```

### Rules

* Snapshots are derived data
* Updated transactionally when movements are inserted
* Can be rebuilt from StockMovement at any time
* Never edited directly

The ledger remains the source of truth.

---

## Concurrency and Atomicity

All stock-affecting operations use MongoDB transactions:

1. Validate available stock from snapshot
2. Insert StockMovement records
3. Update StockSnapshot
4. Commit transaction

This guarantees:

* No negative stock
* Safe concurrent operations
* Consistent reads

---

## Relationship to Other Domains

### Purchase Orders

* Do not modify stock directly
* Stock is increased only on receipt
* Each receipt creates StockMovement records
* Partial receipts generate multiple movements

### Sales Orders

* Create OUT movements during fulfillment
* Stock checks happen inside transactions
* Cancellations create compensating movements

---

## What This Design Enables

* Accurate low-stock alerts (considering pending POs)
* Reliable analytics and historical reporting
* Safe concurrent order processing
* Clear audit trail for every stock change

This architecture forms the foundation for all future inventory features without requiring refactoring.
