import { api } from './client';

export interface PayrollCalculation {
  // Config
  payPeriodFrequency: string;
  datePaid: number;
  jurisdiction: string;
  td1ClaimAmountFed: number;
  td1ClaimAmountProv: number;

  // Income
  salaryOrWagesIncome: number;
  vacationPay: number;
  cashIncomeForPayPeriod: number;

  // Tax deductions
  federalTaxDeduction: number;
  provincialTaxDeduction: number;
  totalTaxDeductions: number;

  // CPP / EI deductions
  cppOrQppDeductions: number;
  secondCppOrQppDeductions: number;
  employmentInsuranceDeductions: number;
  totalDeductions: number;
  netAmount: number;

  // Other amounts
  taxableIncomeForPayPeriod: number;
  pensionableEarningsForPayPeriod: number;
  insurableEarningsForPayPeriod: number;

  // Year-to-date (inputted)
  yearToDatePensionableEarnings: number;
  yearToDateCppOrQpp: number;
  yearToDateInsurableEarnings: number;
  yearToDateEmploymentInsurance: number;

  // Year-to-date (totals)
  totalPensionableEarnings: number;
  totalCppOrQpp: number;
  totalSecondCppOrQpp: number;
  totalInsurableEarnings: number;
  totalEmploymentInsurance: number;

  // Maximums
  adjustedMaximumCppContribution: number;
  secondCppQppContributionMaximum: number;
}

export type PayPeriodFrequency = 'WEEKLY_52PP' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';

export function calculatePayroll(hourlyRate: number, hours: number, payPeriodFrequency: PayPeriodFrequency) {
  return api.post<PayrollCalculation>('/payroll/calculate', {
    hourlyRate,
    hours,
    payPeriodFrequency,
  });
}
