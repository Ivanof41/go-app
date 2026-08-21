import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    throw new Error(
      "Faltan ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_NAME en las variables de entorno.",
    );
  }

  const passwordHash = await hashPassword(password);

  await db
    .insert(users)
    .values({ email: email.toLowerCase().trim(), passwordHash, name, role: "admin" })
    .onConflictDoNothing({ target: users.email });

  console.log(`Listo: usuario admin "${email}" creado (o ya existía).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
