import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  async findAll() {
    return this.employeesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async create(
    @Body() body: { firstName: string; lastName: string; password: string; role?: 'owner' | 'employee' },
  ) {
    return this.employeesService.create(body.firstName, body.lastName, body.password, body.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async update(
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; password?: string; role?: 'owner' | 'employee' },
  ) {
    return this.employeesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async delete(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }
}
