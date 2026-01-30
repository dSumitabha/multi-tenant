export function requireRole(userRole, allowedRoles = []) {
    if (!allowedRoles.includes(userRole)) {
        throw new Error("FORBIDDEN");
    }
}