import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const email = "ignacio.gomez286@gmail.com";
  const password = "Hola2803";
  const name = "Ignacio Gómez";

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, name },
    create: { email, password: hashed, name },
  });

  console.log("✓ Usuario creado:", user.email);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
