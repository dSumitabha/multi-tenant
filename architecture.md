# Multi-Tenant Inventory Management System – Architecture Notes

## Overview
This system is designed as a multi-tenant SaaS platform where each business (tenant) operates with strict data isolation while sharing a common application layer. The architecture prioritizes correctness, security, and scalability over early feature completeness.

At the current stage, the system focuses on establishing a solid multi-tenant foundation, authentication flow, and tenant resolution before expanding inventory and order complexity.

---

## Tenant Isolation Strategy
**Approach:** Database-level isolation (one database per tenant)

Each tenant is assigned a dedicated MongoDB database (e.g., `tenant_apex`, `tenant_nexus`). All business-specific data such as products, inventory, suppliers, and orders live exclusively inside the tenant database.  
A separate master database stores global metadata.

### Why This Approach
- Strong isolation guarantees
- No need to include `tenantId` in every document
- Simpler queries and business logic
- Easier tenant lifecycle management (backup, migration, deletion)
- Clear mental model for development and review

### Trade-offs
- Higher number of database connections
- Slightly increased infrastructure overhead
- Cross-tenant analytics require aggregation at the application layer

These trade-offs are acceptable for a SaaS system prioritizing safety and correctness.

---

## Master Database Design
The master database stores only cross-tenant and authentication-related data.

### Tenant
- `name`
- `slug`
- `dbName`
- `status`

### User
- `tenantId`
- `name`
- `email`
- `passwordHash`
- `role` (owner, manager, staff)
- `isActive`

No inventory or operational data exists in the master database.

---

## Authentication & Tenant Resolution

### Authentication
Authentication uses a stateless JWT-based approach. User credentials are validated against the master database during login. On success, a signed JWT containing `userId`, `tenantId`, and `role` is issued with a fixed expiration.

The token is stored in an HTTP-only cookie. Token issuance and verification are deliberately separated to keep cryptographic concerns centralized and reusable.

### Request-Level Authentication Enforcement
All protected API requests pass through a centralized authentication gate. The JWT is read from the cookie, verified, and converted into a trusted identity context. Client-supplied tenant identifiers are never accepted or trusted.

### Tenant Resolution Flow
Tenant context is resolved entirely on the server:

- API request arrives  
- JWT is verified and `tenantId` is extracted  
- Tenant metadata is fetched from the master database  
- Tenant status is validated (active required)  
- Tenant-specific database connection is selected  

This guarantees strict tenant isolation and eliminates tenant spoofing via request parameters.

### Tenant Resolution Caching
Resolved tenant metadata is cached in memory using a short TTL. Cache entries are keyed by `tenantId` and refreshed on expiry. This reduces master database load while preserving correctness and security.

### Database Connection Strategy
A long-lived master database connection is maintained for global data. Tenant database connections are resolved dynamically and cached per database name. Each request operates exclusively on the tenant database derived from the authenticated identity, making the database itself the isolation boundary.

### Authorization Design
Authentication and authorization are intentionally separated. Roles are embedded in the JWT, while role-based access control is applied incrementally at the API level. This allows authorization rules to evolve alongside business features without destabilizing the authentication layer.

---

## Inventory Modeling Approach

### Product and Variant Model
Products represent logical items, while variants represent sellable SKUs. Each variant maintains its own stock level.

This enables:
- Accurate SKU-level stock tracking
- Correct inventory valuation
- Scalable analytics

### Stock Movement Model
All inventory changes are recorded as immutable stock movement records with timestamps, direction (IN/OUT), business reason, and source reference. These records are used for audit and traceability, not direct stock calculation.

---

## Inventory & Order Management

### Centralized Inventory Logic
Inventory mutation is implemented as a centralized service. All stock changes flow through a single controlled function that validates product and variant state, prevents negative stock, updates snapshots, and records immutable stock movements.

### Stock Snapshot Strategy
Current stock is stored in a snapshot model optimized for fast reads. Snapshots are derived data and updated only through the inventory service.

### Orders as Intent
Purchase Orders and Sales Orders represent business intent, not inventory state. Creating or editing orders never mutates stock, preventing premature stock inflation or deduction.

### Purchase Order Behavior
Purchase Orders follow a strict lifecycle from `DRAFT` to `RECEIVED`. Inventory is updated only when a PO is marked `RECEIVED`, representing physical receipt of goods. Status changes and stock updates run inside a database transaction and use idempotency to prevent duplicate increments.

### Sales Order Behavior
Sales Orders progress from `DRAFT` to `FULFILLED` or `RETURNED`. Stock is deducted only on fulfillment and restored on return. All inventory changes are transactional and idempotent.

### Transactional Safety
All inventory-impacting operations run inside tenant-scoped database transactions, ensuring atomicity, consistency, and isolation across retries and failures.

### Operational Visibility
Dashboards combine stock snapshots with pending inbound (PO) and outbound (SO) intent to provide accurate, real-time inventory visibility without distorting actual stock levels.

---

## Concurrency and Data Integrity
To prevent race conditions such as overselling, stock updates are performed using atomic database operations or MongoDB transactions when multiple collections are involved.

---

## Design Philosophy
The system is developed incrementally with a strong emphasis on correctness and architectural clarity. Core structural decisions are implemented early, allowing future features to build on a stable foundation without requiring major refactors.