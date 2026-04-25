import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Get()
  async findByMonth(
    @Query('employeeId') employeeId: string | undefined,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('all') all: string | undefined,
    @Request() req: { user: { id: string; role: string } },
  ) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (all === 'true' || all === '1') {
      if (req.user.role !== 'owner') {
        throw new ForbiddenException();
      }
      return this.timeEntriesService.findAllByMonth(m, y);
    }
    if (!employeeId) {
      throw new ForbiddenException('employeeId is required');
    }
    return this.timeEntriesService.findByMonth(employeeId, m, y);
  }

  @Post()
  async create(
    @Body() body: { employeeId: string; date: string; startTime: string; endTime: string },
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.timeEntriesService.create(body, req.user.id, req.user.role);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { startTime?: string; endTime?: string },
    @Request() req: any,
  ) {
    return this.timeEntriesService.update(id, body, req.user.id, req.user.role);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.timeEntriesService.delete(id, req.user.id, req.user.role);
  }
}
