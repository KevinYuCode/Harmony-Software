import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('calculate')
  async calculate(
    @Body() body: { hourlyRate: number; hours: number; payPeriodFrequency?: string },
  ) {
    const { hourlyRate, hours, payPeriodFrequency = 'WEEKLY_52PP' } = body;

    const validFrequencies = ['WEEKLY_52PP', 'BI_WEEKLY', 'SEMI_MONTHLY', 'MONTHLY'];
    if (!validFrequencies.includes(payPeriodFrequency)) {
      throw new HttpException(
        `payPeriodFrequency must be one of: ${validFrequencies.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!hourlyRate || hourlyRate <= 0) {
      throw new HttpException(
        'hourlyRate must be a positive number',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!hours || hours <= 0 || hours > 168) {
      throw new HttpException(
        'hours must be between 1 and 168',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const incomeAmount = +(hourlyRate * hours).toFixed(2);
      const session = await this.payrollService.getSession();
      return await this.payrollService.calculateSingle(incomeAmount, session, payPeriodFrequency);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to calculate payroll: ${message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
