'use client';

import { useMemo, useState } from 'react';
import { calculateBreakEven, calculateCapitalGains, calculateDcf, calculateDividend } from '@/lib/calculators/investingGaps';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'dcf' | 'break-even' | 'capital-gains' | 'dividend';

function money(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function NumericField({ id, label, value, setValue, step = 1, min = 0, hint }: { id: string; label: string; value: number; setValue: (value: number) => void; step?: number; min?: number; hint?: string }) {
  return <Field label={label} htmlFor={id} hint={hint}><input id={id} type="number" min={min} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} className={inputClass} /></Field>;
}

export function InvestingGapCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(mode === 'dcf' ? 100000 : mode === 'break-even' ? 50000 : mode === 'capital-gains' ? 200000 : 100);
  const [b, setB] = useState(mode === 'dcf' ? 5 : mode === 'break-even' ? 100 : mode === 'capital-gains' ? 300000 : 2.4);
  const [c, setC] = useState(mode === 'dcf' ? 10 : mode === 'break-even' ? 40 : mode === 'capital-gains' ? 5000 : 60);
  const [d, setD] = useState(mode === 'dcf' ? 2 : mode === 'capital-gains' ? 25000 : 0);
  const [e, setE] = useState(mode === 'dcf' ? 5 : mode === 'capital-gains' ? 20 : 10);

  const result = useMemo(() => {
    if (mode === 'dcf') return calculateDcf(a, b, c, d, e);
    if (mode === 'break-even') return calculateBreakEven(a, b, c);
    if (mode === 'capital-gains') return calculateCapitalGains(a, b, c, d, e);
    return calculateDividend(a, b, c);
  }, [mode, a, b, c, d, e]);

  if (mode === 'dcf') {
    const r = result as ReturnType<typeof calculateDcf>;
    return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InputsPanel title="DCF Inputs">
        <NumericField id="dcf-cash-flow" label="Current annual free cash flow" value={a} setValue={setA} step={1000} />
        <NumericField id="dcf-growth" label="Forecast growth rate (%)" value={b} setValue={setB} step={0.1} />
        <NumericField id="dcf-discount" label="Discount rate / WACC (%)" value={c} setValue={setC} step={0.1} />
        <NumericField id="dcf-terminal-growth" label="Terminal growth rate (%)" value={d} setValue={setD} step={0.1} hint="Keep this below the discount rate." />
        <NumericField id="dcf-years" label="Forecast period (years)" value={e} setValue={setE} step={1} min={1} />
      </InputsPanel>
      <ResultsPanel title="DCF Results">
        <ResultCard highlight label="Estimated enterprise value" value={r.error ?? money(r.enterpriseValue)} />
        <ResultCard label="Present value of forecast" value={r.error ? '—' : money(r.presentValueForecast)} />
        <ResultCard label="Present value of terminal value" value={r.error ? '—' : money(r.presentValueTerminal)} />
        <ResultCard label="Terminal value" value={r.error ? '—' : money(r.terminalValue)} sub={r.error ? 'Adjust the rate assumptions before interpreting the estimate.' : `Final forecast-year cash flow: ${money(r.finalYearCashFlow)}.`} />
      </ResultsPanel>
    </div>;
  }

  if (mode === 'break-even') {
    const r = result as ReturnType<typeof calculateBreakEven>;
    return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InputsPanel title="Break-even Inputs">
        <NumericField id="break-even-fixed" label="Fixed costs" value={a} setValue={setA} step={1000} />
        <NumericField id="break-even-price" label="Selling price per unit" value={b} setValue={setB} step={0.01} />
        <NumericField id="break-even-variable" label="Variable cost per unit" value={c} setValue={setC} step={0.01} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>The model assumes one product, stable unit economics, and fixed costs that do not change with volume.</p>
      </InputsPanel>
      <ResultsPanel title="Break-even Results">
        <ResultCard highlight label="Break-even units" value={r.error ?? r.breakEvenUnits.toLocaleString('en-US', { maximumFractionDigits: 2 })} />
        <ResultCard label="Break-even revenue" value={r.error ? '—' : money(r.breakEvenRevenue)} />
        <ResultCard label="Contribution margin / unit" value={money(r.contributionMargin)} sub="Selling price minus variable cost per unit." />
      </ResultsPanel>
    </div>;
  }

  if (mode === 'capital-gains') {
    const r = result as ReturnType<typeof calculateCapitalGains>;
    return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InputsPanel title="Capital Gains Inputs">
        <NumericField id="capital-gains-purchase" label="Purchase price / original basis" value={a} setValue={setA} step={1000} />
        <NumericField id="capital-gains-sale" label="Sale price" value={b} setValue={setB} step={1000} />
        <NumericField id="capital-gains-costs" label="Selling costs" value={c} setValue={setC} step={100} />
        <NumericField id="capital-gains-improvements" label="Capital improvements" value={d} setValue={setD} step={1000} />
        <NumericField id="capital-gains-rate" label="Estimated tax rate (%)" value={e} setValue={setE} step={0.1} />
      </InputsPanel>
      <ResultsPanel title="Capital Gains Results">
        <ResultCard highlight label="Realized gain / loss" value={money(r.realizedGain)} />
        <ResultCard label="Adjusted basis" value={money(r.adjustedBasis)} />
        <ResultCard label="Net sale proceeds" value={money(r.netSaleProceeds)} />
        <ResultCard label="Estimated tax" value={money(r.estimatedTax)} />
        <ResultCard label="After-tax proceeds" value={money(r.afterTaxProceeds)} sub="This educational estimate does not apply jurisdiction-specific exclusions, holding-period rules, or filing status." />
      </ResultsPanel>
    </div>;
  }

  const r = result as ReturnType<typeof calculateDividend>;
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <InputsPanel title="Dividend Inputs">
      <NumericField id="dividend-shares" label="Number of shares" value={a} setValue={setA} step={1} />
      <NumericField id="dividend-per-share" label="Annual dividend per share" value={b} setValue={setB} step={0.01} />
      <NumericField id="dividend-price" label="Current share price" value={c} setValue={setC} step={0.01} />
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>Use the announced annual dividend per share. Dividend payments can change and are not guaranteed.</p>
    </InputsPanel>
    <ResultsPanel title="Dividend Results">
      <ResultCard highlight label="Annual dividend income" value={r.error ?? money(r.annualIncome)} />
      <ResultCard label="Monthly equivalent" value={money(r.monthlyIncome)} />
      <ResultCard label="Quarterly equivalent" value={money(r.quarterlyIncome)} />
      <ResultCard label="Portfolio value" value={money(r.portfolioValue)} />
      <ResultCard label="Indicated dividend yield" value={r.error ? '—' : `${r.dividendYieldPercent.toFixed(2)}%`} sub="Yield is annual dividend income divided by the entered share value." />
    </ResultsPanel>
  </div>;
}

export const DcfCalculator = () => <InvestingGapCalculator mode="dcf" />;
export const BreakEvenCalculator = () => <InvestingGapCalculator mode="break-even" />;
export const CapitalGainsCalculator = () => <InvestingGapCalculator mode="capital-gains" />;
export const DividendCalculator = () => <InvestingGapCalculator mode="dividend" />;
