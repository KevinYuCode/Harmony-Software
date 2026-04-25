import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '../db';
import { employees } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(employeeId: string, password: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId));

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, employee.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: employee.id, role: employee.role };
    return {
      token: this.jwtService.sign(payload),
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
      },
    };
  }

  async adminLogin(password: string) {
    const [owner] = await db
      .select()
      .from(employees)
      .where(eq(employees.role, 'owner'))
      .limit(1);

    if (!owner) {
      throw new UnauthorizedException('No admin account found');
    }

    const passwordValid = await bcrypt.compare(password, owner.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: owner.id, role: owner.role };
    return {
      token: this.jwtService.sign(payload),
      employee: {
        id: owner.id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: owner.role,
      },
    };
  }
}
