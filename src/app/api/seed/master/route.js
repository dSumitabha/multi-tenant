import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMasterConnection } from "@/lib/db/masterDbConnect";
import { getTenantModel } from "@/models/Tenant";
import { getUserModel } from "@/models/User";

import tenants from "@/seeders/Tenant";
import users from "@/seeders/User";

export async function GET() {
  const conn = await getMasterConnection();

  const TenantModel = getTenantModel(conn);
  const UserModel = getUserModel(conn);

  // insert tenants
  const createdTenants = await TenantModel.insertMany(tenants);

  // map slug -> _id
  const tenantMap = {};
  createdTenants.forEach(t => {
    tenantMap[t.slug] = t._id;
  });

  // insert users
  for (const user of users) {
    await UserModel.create({
      tenantId: tenantMap[user.tenantSlug],
      name: user.name,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
    });
  }

  return NextResponse.json({ message: "Tenant and User Seeded successfully to the master db" });
}