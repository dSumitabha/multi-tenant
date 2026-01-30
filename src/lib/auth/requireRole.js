export function requireRole(userRole, allowedRoles = []) {
    if (!allowedRoles.includes(userRole)) {
        const err = new Error("FORBIDDEN");
        err.status = 403;
        throw err;
    }
}