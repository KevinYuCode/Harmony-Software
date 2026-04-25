import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '../db';
import { employees, timeEntries } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

@Injectable()
export class TimeEntriesService {
  async findByMonth(employeeId: string, month: number, year: number) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employeeId, employeeId),
          gte(timeEntries.date, firstDay),
          lte(timeEntries.date, lastDate),
        ),
      );
  }

  async findAllByMonth(month: number, year: number) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return db
      .select()
      .from(timeEntries)
      .where(and(gte(timeEntries.date, firstDay), lte(timeEntries.date, lastDate)));
  }

  async create(
    data: {
      employeeId: string;
      date: string;
      startTime: string;
      endTime: string;
    },
    userId: string,
    userRole: string,
  ) {
    if (userRole === 'employee') {
      if (data.employeeId !== userId) {
        throw new ForbiddenException();
      }
    } else if (userRole === 'owner') {
      const [target] = await db
        .select({ id: employees.id, role: employees.role })
        .from(employees)
        .where(eq(employees.id, data.employeeId));
      if (!target) {
        throw new NotFoundException('Employee not found');
      }
      if (target.role === 'owner' && target.id !== userId) {
        throw new ForbiddenException('Cannot log time for other owners');
      }
    } else {
      throw new ForbiddenException();
    }

    const [entry] = await db.insert(timeEntries).values(data).returning();
    return entry;
  }

  async update(
    id: string,
    data: { startTime?: string; endTime?: string },
    userId: string,
    userRole: string,
  ) {
    const [existing] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));

    if (!existing) throw new NotFoundException('Time entry not found');
    if (existing.employeeId !== userId && userRole !== 'owner') {
      throw new ForbiddenException();
    }

    const [updated] = await db
      .update(timeEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return updated;
  }

  async delete(id: string, userId: string, userRole: string) {
    const [existing] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));

    if (!existing) throw new NotFoundException('Time entry not found');
    if (existing.employeeId !== userId && userRole !== 'owner') {
      throw new ForbiddenException();
    }

    await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return { success: true };
  }
}
