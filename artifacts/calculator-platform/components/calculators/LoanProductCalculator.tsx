'use client';

import { useMemo, useState } from 'react';
import { calculatePayment, calculateRepayment, calculateStudentLoan, type InstallmentRow } from '@/lib/calculators/loanProducts';
import { formatCurrency } from '@/lib/utils';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

export type LoanProductMode = 'payment' | 'repayment' | 'student-loan';

interface Props { mode: LoanProductMode }

function NumberInput({ id, label, value, min = 0, max, step = 100, hint, onChange }: { id: string; label: string; value: number; min?: number; max?: number; step?: number; hint?: string; onChange: (value: number) => void }) {
  return <Field label={label} htmlFor={id} hint={hint}><input id={id} type="number" value={value} min={min} max={max} step={step} aria-label={label} onChange={(e) => onChange(+e.target.value || 0)} className={inputClass} /></Field>;
}

export function LoanProductCalculator({ mode }: Props) {
  const [principal, setPrincipal] = useState(mode === 'repayment' ? 20000 : mode === 'student-loan' ? 30000 : 25000);
  const [annualRate, setAnnualRate] = useState(mode === 'student-loan' ? 5.5 : 6.5);
  const [termYears, setTermYears] = useState(5);
  const [fees, setFees] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(500);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(100);
  const [originationFeeRate, setOriginationFeeRate] = useState(1);

  const view = useMemo(() => {
    if (mode === 'repayment') {
      const result = calculateRepayment({ balance: principal, annualRate, monthlyPayment });
      return { monthlyPayment: result.monthlyPayment, totalInterest: result.totalInterest, totalCost: result.totalPayments, balance: result.status === 'payable' ? 0 : result.balance, rows: result.amortization, note: result.status === 'payment-too-low' ? 'Increase the monthly payment above the monthly interest to repay this balance.' : result.status === 'no-balance' ? 'No balance remains.' : `${result.payments} payments to payoff`, warning: result.status === 'payment-too-low' };
    }
    if (mode === 'student-loan') {
      const result = calculateStudentLoan({ principal, annualRate, termYears, originationFeeRate, extraMonthlyPayment });
      return { monthlyPayment: result.monthlyPayment, totalInterest: result.totalInterest, totalCost: result.totalCost, balance: 0, rows: result.amortization, note: `${result.payoffMonths} months to payoff; interest saved ${formatCurrency(result.interestSaved)}`, warning: false };
    }
    const result = calculatePayment({ principal, annualRate, termYears, fees });
    return { monthlyPayment: result.monthlyPayment, totalInterest: result.totalInterest, totalCost: result.totalCost, balance: 0, rows: result.amortization, note: `${result.termMonths} monthly payments`, warning: false };
  }, [mode, principal, annualRate, termYears, fees, monthlyPayment, extraMonthlyPayment, originationFeeRate]);

  const principalShare = view.totalCost > 0 ? Math.max(0, Math.min(100, (principal / view.totalCost) * 100)) : 0;
  const title = mode === 'payment' ? 'Payment Calculator' : mode === 'repayment' ? 'Repayment Calculator' : 'Student Loan Calculator';

  return <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title={`${title} Inputs`}>
        <NumberInput id={`${mode}-principal`} label={mode === 'repayment' ? 'Current Balance ($)' : 'Loan Amount ($)'} value={principal} max={10000000} hint={mode === 'repayment' ? 'Balance still outstanding.' : 'Amount borrowed before optional fees.'} onChange={setPrincipal} />
        <NumberInput id={`${mode}-rate`} label="Annual Interest Rate (%)" value={annualRate} max={100} step={0.01} onChange={setAnnualRate} />
        {mode === 'repayment' && <NumberInput id="repayment-monthly" label="Monthly Payment ($)" value={monthlyPayment} max={1000000} onChange={setMonthlyPayment} />}
        {mode === 'payment' && <><NumberInput id="payment-term" label="Term (years)" value={termYears} min={1} max={50} step={1} onChange={setTermYears} /><NumberInput id="payment-fees" label="Fees Added ($)" value={fees} max={1000000} onChange={setFees} /></>}
        {mode === 'student-loan' && <><NumberInput id="student-term" label="Term (years)" value={termYears} min={1} max={50} step={1} onChange={setTermYears} /><NumberInput id="student-fee" label="Origination Fee (%)" value={originationFeeRate} max={25} step={0.01} onChange={setOriginationFeeRate} /><NumberInput id="student-extra" label="Extra Monthly Payment ($)" value={extraMonthlyPayment} max={1000000} onChange={setExtraMonthlyPayment} hint="Optional amount paid above the scheduled payment." /></>}
      </InputsPanel>
      <ResultsPanel title={`Live ${title} Results`}>
        <ResultCard highlight label="Monthly Payment" value={formatCurrency(view.monthlyPayment)} sub={view.note} />
        <ResultCard label="Total Interest" value={formatCurrency(view.totalInterest)} />
        <ResultCard label={mode === 'repayment' ? 'Total Payments' : 'Total Cost'} value={formatCurrency(view.totalCost)} />
        <ResultCard label="Starting Balance" value={formatCurrency(principal)} sub={mode === 'student-loan' ? `Extra payment ${formatCurrency(extraMonthlyPayment)}` : undefined} />
        <div className="sm:col-span-2 space-y-2" aria-label="Principal and interest split"><div className="flex justify-between text-[11px] text-slate-400"><span>Principal {principalShare.toFixed(1)}%</span><span>Interest {(100 - principalShare).toFixed(1)}%</span></div><div className="h-3 rounded-full overflow-hidden bg-red-500/30 flex"><div className="bg-blue-500" style={{ width: `${principalShare}%` }} /><div className="bg-red-400 flex-1" /></div></div>
        {view.warning && <p role="alert" className="sm:col-span-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{view.note}</p>}
      </ResultsPanel>
    </div>
    {view.rows.length > 0 && <AmortizationTable rows={view.rows} title={mode === 'repayment' ? 'Repayment Schedule Snapshot' : 'Annual Amortization Snapshot'} />}
  </div>;
}

function AmortizationTable({ rows, title }: { rows: InstallmentRow[]; title: string }) {
  const snapshots = rows.length > 12 ? rows.filter((row) => row.period % 12 === 0 || row.period === 1).slice(0, 12) : rows;
  return <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}><div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}><h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</h3></div><div className="overflow-x-auto"><table className="w-full text-xs" aria-label={title}><thead><tr style={{ backgroundColor: 'var(--bg-input)' }}>{['Period', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => <th key={h} scope="col" className="text-left px-4 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>)}</tr></thead><tbody>{snapshots.map((row) => <tr key={row.period} className="border-t" style={{ borderColor: 'var(--border)' }}><td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{row.period}</td><td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.payment)}</td><td className="px-4 py-3 text-green-600">{formatCurrency(row.principal)}</td><td className="px-4 py-3 text-red-500">{formatCurrency(row.interest)}</td><td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.balance)}</td></tr>)}</tbody></table></div></div>;
}

export function PaymentCalculator() { return <LoanProductCalculator mode="payment" />; }
export function RepaymentCalculator() { return <LoanProductCalculator mode="repayment" />; }
export function StudentLoanCalculator() { return <LoanProductCalculator mode="student-loan" />; }
