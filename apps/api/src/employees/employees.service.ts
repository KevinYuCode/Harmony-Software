import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../db';
import { employees } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class EmployeesService {
  async findAll() {
    const result = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        role: employees.role,
      })
      .from(employees);
    return result;
  }

  async create(
    firstName: string,
    lastName: string,
    password: string,
    role: 'owner' | 'employee' = 'employee',
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [employee] = await db
      .insert(employees)
      .values({ firstName, lastName, password: hashedPassword, role })
      .returning({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        role: employees.role,
      });
    return employee;
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      password?: string;
      role?: 'owner' | 'employee';
    },
  ) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const [employee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        role: employees.role,
      });

    return employee;
  }

  async delete(id: string) {
    await db.delete(employees).where(eq(employees.id, id));
    return { success: true };
  }
}
