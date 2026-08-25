'use client';

import { useMemo, useState } from 'react';
import { calculateCollegeCost } from '@/lib/calculators/loanProducts';
import { formatCurrency } from '@/lib/utils';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

export function CollegeCostCalculator() {
  const [annualCost, setAnnualCost] = useState(30000);
  const [inflationRate, setInflationRate] = useState(4);
  const [yearsUntilCollege, setYearsUntilCollege] = useState(10);
  const [currentSavings, setCurrentSavings] = useState(10000);
  const [annualContribution, setAnnualContribution] = useState(6000);
  const [contributionGrowthRate, setContributionGrowthRate] = useState(3);
  const result = useMemo(() => calculateCollegeCost({ annualCost, inflationRate, yearsUntilCollege, currentSavings, annualContribution, contributionGrowthRate }), [annualCost, inflationRate, yearsUntilCollege, currentSavings, annualContribution, contributionGrowthRate]);
  const covered = result.totalFutureCost > 0 ? Math.min(100, (result.futureSavings / result.totalFutureCost) * 100) : 100;

  return <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title="College Cost Inputs">
        <Field label="Current Annual Cost ($)" htmlFor="college-annual-cost" hint="Tuition and expenses for one current year."><input id="college-annual-cost" type="number" value={annualCost} min={0} max={1000000} step={500} aria-label="Current annual college cost" onChange={(e) => setAnnualCost(+e.target.value || 0)} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Cost Inflation (%)" htmlFor="college-inflation"><input id="college-inflation" type="number" value={inflationRate} min={0} max={100} step={0.1} aria-label="College cost inflation rate" onChange={(e) => setInflationRate(+e.target.value || 0)} className={inputClass} /></Field><Field label="Years Until College" htmlFor="college-years"><input id="college-years" type="number" value={yearsUntilCollege} min={0} max={80} step={1} aria-label="Years until college" onChange={(e) => setYearsUntilCollege(+e.target.value || 0)} className={inputClass} /></Field></div>
        <Field label="Current Savings ($)" htmlFor="college-savings"><input id="college-savings" type="number" value={currentSavings} min={0} max={100000000} step={500} aria-label="Current college savings" onChange={(e) => setCurrentSavings(+e.target.value || 0)} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Annual Contribution ($)" htmlFor="college-contribution"><input id="college-contribution" type="number" value={annualContribution} min={0} max={10000000} step={100} aria-label="Annual college savings contribution" onChange={(e) => setAnnualContribution(+e.target.value || 0)} className={inputClass} /></Field><Field label="Contribution Growth (%)" htmlFor="college-growth"><input id="college-growth" type="number" value={contributionGrowthRate} min={0} max={100} step={0.1} aria-label="Annual contribution growth rate" onChange={(e) => setContributionGrowthRate(+e.target.value || 0)} className={inputClass} /></Field></div>
      </InputsPanel>
      <ResultsPanel title="Live College Cost Results">
        <ResultCard highlight label="Future Annual Cost" value={formatCurrency(result.futureAnnualCost)} sub="Estimated first year" />
        <ResultCard label="Four-Year Future Cost" value={formatCurrency(result.totalFutureCost)} />
        <ResultCard label="Projected Savings" value={formatCurrency(result.futureSavings)} />
        <ResultCard label="Funding Gap" value={formatCurrency(result.fundingGap)} sub={result.fundingGap === 0 ? 'Projected savings cover the modelled cost' : 'Additional funding in this model'} />
        <div className="sm:col-span-2 space-y-2" aria-label="Projected savings coverage"><div className="flex justify-between text-[11px] text-slate-400"><span>Savings coverage {covered.toFixed(1)}%</span><span>Gap {(100 - covered).toFixed(1)}%</span></div><div className="h-3 rounded-full overflow-hidden bg-amber-500/30 flex"><div className="bg-emerald-500" style={{ width: `${covered}%` }} /><div className="bg-amber-400 flex-1" /></div></div>
        {result.fundingGap > 0 && <p role="alert" className="sm:col-span-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">The projection shows a funding gap; test a different contribution or time horizon.</p>}
      </ResultsPanel>
    </div>
  </div>;
}
