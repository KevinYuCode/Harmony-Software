import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import puppeteer, { type Browser } from 'puppeteer';

const CRA_BASE_URL = 'https://apps.cra-arc.gc.ca';
const CRA_CALCULATOR_URL =
  `${CRA_BASE_URL}/ebci/rhpd/rest/api/ext/priv/calculator/SALARY/calculate`;
const CRA_APP_URL = `${CRA_BASE_URL}/ebci/rhpd/beta/step1`;

export interface CraCalculationResult {
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

interface CraSession {
  xsrfToken: string;
  cookies: string;
  obtainedAt: number;
}

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);
  private session: CraSession | null = null;
  private browser: Browser | null = null;

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  async getSession(): Promise<CraSession> {
    // Reuse session if less than 10 minutes old
    if (
      this.session &&
      Date.now() - this.session.obtainedAt < 10 * 60 * 1000
    ) {
      return this.session;
    }

    this.logger.log('Obtaining new CRA session via headless browser...');

    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0',
      );

      await page.goto(CRA_APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for the Angular app to bootstrap and XSRF cookie to be set
      // The string is evaluated in the browser context, not Node
      await page.waitForFunction(
        `document.cookie.includes('XSRF-TOKEN')`,
        { timeout: 15000 },
      );

      const allCookies = await page.cookies();

      let xsrfToken = '';
      const cookieParts: string[] = [];

      for (const cookie of allCookies) {
        cookieParts.push(`${cookie.name}=${cookie.value}`);
        if (cookie.name === 'XSRF-TOKEN') {
          xsrfToken = decodeURIComponent(cookie.value);
        }
      }

      if (!xsrfToken) {
        throw new Error('XSRF-TOKEN cookie was not set by the CRA application');
      }

      this.session = {
        xsrfToken,
        cookies: cookieParts.join('; '),
        obtainedAt: Date.now(),
      };

      this.logger.log('CRA session obtained successfully');
      return this.session;
    } finally {
      await page.close();
    }
  }

  private invalidateSession() {
    this.session = null;
  }

  private buildCraRequestBody(incomeAmount: number, vacationPay: number, payPeriodFrequency: string) {
    return {
      cppEqualizationFlag: false,
      clergyFlag: 'FALSE',
      calculationType: 'SALARY',
      td1ClaimAmountFed: 16452,
      td1ClaimAmountProv: 12989,
      quebecTaxableBenefitsFlag: false,
      quebecTaxableBenefits: null,
      employeeName: null,
      employerName: null,
      jurisdiction: 'ONTARIO',
      payPeriodFrequency,
      datePaid: new Date().toISOString(),
      incomeAmount,
      vacationPay,
      salaryType: 'NO_BONUS_PAY_NO_RETROACTIVE_PAY',
      retroactivePay: null,
      numberOfPayPeriodsOfRetroactivePay: null,
      deductionsFromRetroactivePay: null,
      totalCurrentBonusPayable: null,
      previousBonus: null,
      bonusF5YearToDate: null,
      retroF5YearToDate: null,
      deductionsFromBonus: null,
      taxableBenefitsFlag: false,
      unionDuesFlag: false,
      clergyType: 'NO_HOUSING',
      clergyResidenceDeductionFlag: null,
      clergyResidenceDeduction: null,
      clergyHousingAllowance: null,
      clergyHousingAllowanceUtilities: null,
      clergyHousingBenefit: null,
      clergyHousingBenefitUtilities: null,
      contributionEmployerRrspFlag: false,
      contributionRrspOrRppOrPrppFlag: false,
      taxIndigenousFlag: false,
      indigenousExemptAmount: null,
      indigenousExemptBonusRetroAmount: null,
      pensionableForIndigenousExemptAmountFlag: null,
      pensionableForIndigenousExemptBonusRetroAmountFlag: null,
      indigenousExemptAnnualRemunerationAmount: null,
      indigenousExemptCommissionIncomeAmount: null,
      pensionableForIndigenousExemptCommissionIncomeAmountFlag: null,
      pensionableForIndigenousExemptAnnualRemunerationAmountFlag: null,
      federalTd1DisplayableFlag: false,
      provincialTd1DisplayableFlag: false,
      federalClaimCode: 'CLAIM_CODE_1',
      requestedAdditionalTaxDeductions: null,
      td1ClaimCodeType: 'CLAIM_AMOUNT_TD1',
      provinceTerritoryClaimCode: 'CLAIM_CODE_1',
      cppQppType: 'CPP_QPP_YEAR_TO_DATE',
      numberPensionableMonths: 12,
      pensionableEarningsYearToDate: null,
      cppOrQppContributionsDeductedYearToDate: null,
      secondAdditionalCppOrQppContributionsDeductedYearToDate: null,
      employmentInsuranceType: 'EI_YEAR_TO_DATE',
      insurableEarningsYearToDate: null,
      employmentInsuranceDeductedYearToDate: null,
      employerEmploymentInsurancePremiumRate: 1.4,
    };
  }

  async calculateSingle(
    incomeAmount: number,
    session: CraSession,
    payPeriodFrequency = 'WEEKLY_52PP',
  ): Promise<CraCalculationResult> {
    const vacationPay = +(incomeAmount * 0.04).toFixed(2);
    const body = this.buildCraRequestBody(incomeAmount, vacationPay, payPeriodFrequency);

    const res = await fetch(CRA_CALCULATOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'X-XSRF-TOKEN': session.xsrfToken,
        Cookie: session.cookies,
        'rccr-client-id': randomUUID(),
        Referer: `${CRA_BASE_URL}/ebci/rhpd/beta/step3`,
        Origin: CRA_BASE_URL,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 403) {
        this.invalidateSession();
      }
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(
        `CRA calculator returned ${res.status}: ${text.slice(0, 200)}`,
      );
    }

    let rawText = await res.text();
    // CRA API prefixes response with )]}', — strip it
    if (rawText.startsWith(")]}',")) {
      rawText = rawText.slice(5).trim();
    }

    const data = JSON.parse(rawText);

    return {
      // Config
      payPeriodFrequency: data.attributes?.payPeriodFrequency ?? '',
      datePaid: data.attributes?.datePaid ?? 0,
      jurisdiction: data.attributes?.jurisdiction ?? '',
      td1ClaimAmountFed: data.td1ClaimAmountFed ?? 0,
      td1ClaimAmountProv: data.td1ClaimAmountProv ?? 0,

      // Income
      salaryOrWagesIncome: data.salaryOrWagesIncome ?? 0,
      vacationPay: data.vacationPay ?? 0,
      cashIncomeForPayPeriod: data.cashIncomeForPayPeriod ?? 0,

      // Tax deductions
      federalTaxDeduction: data.federalTaxDeduction ?? 0,
      provincialTaxDeduction: data.provincialTaxDeduction ?? 0,
      totalTaxDeductions: data.totalTaxDeductions ?? 0,

      // CPP / EI deductions
      cppOrQppDeductions: data.cppOrQppDeductions ?? 0,
      secondCppOrQppDeductions: data.secondCppOrQppDeductions ?? 0,
      employmentInsuranceDeductions: data.employmentInsuranceDeductions ?? 0,
      totalDeductions: data.totalAllDeductions ?? 0,
      netAmount: data.netAmount ?? 0,

      // Other amounts
      taxableIncomeForPayPeriod: data.taxableIncomeForPayPeriod ?? 0,
      pensionableEarningsForPayPeriod: data.pensionableEarningsForPayPeriod ?? 0,
      insurableEarningsForPayPeriod: data.insurableEarningsForPayPeriod ?? 0,

      // Year-to-date (inputted)
      yearToDatePensionableEarnings: data.yearToDatePensionableEarnings ?? 0,
      yearToDateCppOrQpp: data.yearToDateCppOrQpp ?? 0,
      yearToDateInsurableEarnings: data.yearToDateInsurableEarnings ?? 0,
      yearToDateEmploymentInsurance: data.yearToDateEmploymentInsurance ?? 0,

      // Year-to-date (totals)
      totalPensionableEarnings: data.totalPensionableEarnings ?? 0,
      totalCppOrQpp: data.totalCppOrQpp ?? 0,
      totalSecondCppOrQpp: data.totalSecondCppOrQpp ?? 0,
      totalInsurableEarnings: data.totalInsurableEarnings ?? 0,
      totalEmploymentInsurance: data.totalEmploymentInsurance ?? 0,

      // Maximums
      adjustedMaximumCppContribution: data.adjustedMaximumCppContribution ?? 0,
      secondCppQppContributionMaximum: data.secondCppQppContributionMaximum ?? 0,
    };
  }

}
