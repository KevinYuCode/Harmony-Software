import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import { employees } from './schema';

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  console.log('Seeding database...');

  const ownerPassword = await bcrypt.hash('12345', 10);
  const emp1Password = await bcrypt.hash('pass123', 10);
  const emp2Password = await bcrypt.hash('pass456', 10);

  await db.insert(employees).values([
    { firstName: 'Admin', lastName: '', password: ownerPassword, role: 'owner' },
    { firstName: 'John', lastName: 'Smith', password: emp1Password, role: 'employee' },
    { firstName: 'Jane', lastName: 'Doe', password: emp2Password, role: 'employee' },
  ]);

  console.log('Seeded: Admin (password: 12345), John Smith (pass123), Jane Doe (pass456)');

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
