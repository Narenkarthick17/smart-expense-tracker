import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin seed.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      console.log(`Upgraded existing user to ADMIN: ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN' },
  });

  console.log(`Created admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
