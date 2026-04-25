import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/layout'
import { Input } from '@harmony/ui/components/input'
import { Label } from '@harmony/ui/components/label'
import { Button } from '@harmony/ui/components/button'
import { calculatePayroll, type PayrollCalculation } from '../api/payroll'

function fmt(value: number): string {
  return value.toFixed(2)
}

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? 'font-semibold' : ''}`}>
      <span className={bold ? 'text-sm' : 'text-sm text-muted-foreground'}>{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  )
}

const INPUT_CLASS = 'w-32 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export function CppTablePage() {
  const [hourlyRateInput, setHourlyRateInput] = useState('17.60')
  const [hoursInput, setHoursInput] = useState('4')
  const [submitted, setSubmitted] = useState<{ rate: number; hours: number } | null>(null)

  const hourlyRate = parseFloat(hourlyRateInput) || 0
  const hours = parseFloat(hoursInput) || 0

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['payroll', 'BI_WEEKLY', submitted?.rate, submitted?.hours],
    queryFn: () => calculatePayroll(submitted!.rate, submitted!.hours, 'BI_WEEKLY'),
    enabled: submitted !== null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const handleCalculate = () => {
    if (hourlyRate > 0 && hours > 0) {
      setSubmitted({ rate: hourlyRate, hours })
    }
  }

  const d = data as PayrollCalculation | undefined
  const dash = '—'

  return (
    <Layout
      title="Payroll Calculator"
      description="Calculate wages, deductions, and net pay using the CRA payroll calculator."
    >
      <div className="flex flex-col gap-4">
        {isError && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <strong>CRA Calculator Error:</strong> Unable to fetch payroll deductions.
            {error instanceof Error && (
              <div className="mt-1 text-xs opacity-75">{error.message}</div>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-6">
          {/* Inputs row */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min={0}
                  step={0.25}
                  value={hourlyRateInput}
                  onChange={(e) => setHourlyRateInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCalculate() }}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min={0}
                  step={0.5}
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCalculate() }}
                  className={INPUT_CLASS}
                />
              </div>
              <Button onClick={handleCalculate} disabled={isLoading || hourlyRate <= 0 || hours <= 0}>
                {isLoading ? 'Calculating...' : 'Calculate'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[4, 8, 12, 16, 60].map((h) => (
                <Button
                  key={h}
                  variant={hoursInput === String(h) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHoursInput(String(h))}
                >
                  {h}h
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            Pay frequency: Bi-weekly (26 pay periods a year)
          </div>

          <div className="divide-y divide-border">
            <ResultRow label="Hours" value={d ? String(submitted!.hours) : dash} />
            <ResultRow label="Hourly Rate" value={d ? fmt(submitted!.rate) : dash} />
            <ResultRow label="Salary/Wage Income" value={d ? fmt(d.salaryOrWagesIncome) : dash} />
            <ResultRow label="4% Vacation Pay" value={d ? fmt(d.vacationPay) : dash} />
            <ResultRow label="Total cash income" value={d ? fmt(d.cashIncomeForPayPeriod) : dash} bold />
            <ResultRow label="Federal tax deduction" value={d ? fmt(d.federalTaxDeduction) : dash} />
            <ResultRow label="Provincial tax deduction" value={d ? fmt(d.provincialTaxDeduction) : dash} />
            <ResultRow label="Total tax deductions" value={d ? fmt(d.totalTaxDeductions) : dash} />
            <ResultRow label="CPP deductions" value={d ? fmt(d.cppOrQppDeductions) : dash} />
            <ResultRow label="EI deductions" value={d ? fmt(d.employmentInsuranceDeductions) : dash} />
            <ResultRow label="Total deductions" value={d ? fmt(d.totalDeductions) : dash} bold />
            <ResultRow label="Net amount" value={d ? fmt(d.netAmount) : dash} bold />
          </div>
        </div>
      </div>
    </Layout>
  )
}
