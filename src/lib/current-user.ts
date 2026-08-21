import { cache } from "react";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  return user ?? null;
});
