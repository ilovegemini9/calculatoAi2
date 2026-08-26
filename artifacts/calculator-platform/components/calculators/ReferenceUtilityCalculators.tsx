'use client';

import { useMemo, useState } from 'react';
import {
  generatePassword,
  passwordEntropy,
  passwordPool,
  randomIntegers,
  rollDice,
  secureRandomUnit,
  shoeSizes,
  type PasswordOptions,
  type RandomSort,
  type ShoeAgeGroup,
} from '@/lib/calculators/utilityExtras';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel, selectClass } from './ResultCard';

type Mode = 'random-number' | 'password' | 'dice-roller' | 'shoe-size';

const defaultPasswordOptions: PasswordOptions = {
  length: 16,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  excludeBrackets: false,
  noRepeats: false,
};

function Shell({ inputs, results }: { inputs: React.ReactNode; results: React.ReactNode }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{inputs}{results}</div>;
}

export function ReferenceUtilityCalculator({ mode }: { mode: Mode }) {
  if (mode === 'random-number') return <RandomNumberTool />;
  if (mode === 'password') return <PasswordGeneratorTool />;
  if (mode === 'dice-roller') return <DiceRollerTool />;
  return <ShoeSizeTool />;
}

function RandomNumberTool() {
  const [minimum, setMinimum] = useState(1);
  const [maximum, setMaximum] = useState(100);
  const [count, setCount] = useState(5);
  const [seed, setSeed] = useState('42');
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [sort, setSort] = useState<RandomSort>('none');
  const [refresh, setRefresh] = useState(0);
  const result = useMemo(() => randomIntegers({ minimum, maximum, count, seed: seed.trim() === '' ? undefined : Number(seed), allowDuplicates, sort }, () => refresh < 0 ? 0 : Math.random()), [minimum, maximum, count, seed, allowDuplicates, sort, refresh]);
  return <Shell
    inputs={<InputsPanel title="Random Number Inputs">
      <Field label="Minimum" htmlFor="random-minimum"><input id="random-minimum" type="number" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Maximum" htmlFor="random-maximum"><input id="random-maximum" type="number" value={maximum} onChange={(event) => setMaximum(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="How many" htmlFor="random-count"><input id="random-count" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Seed (optional)" htmlFor="random-seed" hint="A seed makes the sequence repeatable; leave blank for a fresh browser-generated sequence."><input id="random-seed" type="number" value={seed} onChange={(event) => setSeed(event.target.value)} className={inputClass} /></Field>
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)} /> Allow repeated values</label>
      <Field label="Order" htmlFor="random-sort"><select id="random-sort" value={sort} onChange={(event) => setSort(event.target.value as RandomSort)} className={selectClass}><option value="none">Keep generated order</option><option value="ascending">Ascending</option><option value="descending">Descending</option></select></Field>
      <button type="button" onClick={() => setRefresh((value) => value + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Generate again</button>
    </InputsPanel>}
    results={<ResultsPanel title="Random Number Results">
      <ResultCard highlight label="Generated values" value={result.error ?? (result.values.length ? result.values.join(', ') : 'No values')} />
      <ResultCard label="Range" value={`${result.minimum} to ${result.maximum}`} />
      <ResultCard label="Count" value={result.count.toString()} />
      <ResultCard label="Mode" value={result.seeded ? 'Repeatable seed' : 'Fresh browser sequence'} />
    </ResultsPanel>}
  />;
}

function PasswordGeneratorTool() {
  const [options, setOptions] = useState<PasswordOptions>(defaultPasswordOptions);
  const [refresh, setRefresh] = useState(0);
  const result = useMemo(() => generatePassword(options, () => refresh < 0 ? 0 : secureRandomUnit()), [options, refresh]);
  const pool = passwordPool(options);
  const update = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));
  const copy = () => { if (result.password && typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(result.password); };
  return <Shell
    inputs={<InputsPanel title="Password Settings">
      <Field label="Password length" htmlFor="password-length"><input id="password-length" type="number" min={4} max={128} value={options.length} onChange={(event) => update('length', Number(event.target.value))} className={inputClass} /></Field>
      <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {([['lowercase', 'Lowercase letters'], ['uppercase', 'Uppercase letters'], ['numbers', 'Numbers'], ['symbols', 'Symbols'], ['excludeAmbiguous', 'Exclude ambiguous characters'], ['excludeBrackets', 'Exclude brackets'], ['noRepeats', 'No repeated characters']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={options[key]} onChange={(event) => update(key, event.target.checked)} />{label}</label>)}
      </div>
      <button type="button" onClick={() => setRefresh((value) => value + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Regenerate</button>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Generated locally with browser randomness. Do not reuse a displayed password across accounts.</p>
    </InputsPanel>}
    results={<ResultsPanel title="Password Results">
      <ResultCard highlight label="Generated password" value={(result.error ?? result.password) || 'No output'} />
      <ResultCard label="Character pool" value={pool.length.toString()} />
      <ResultCard label="Estimated entropy" value={`${passwordEntropy(options.length, pool.length).toFixed(1)} bits`} />
      <div className="sm:col-span-2"><button type="button" onClick={copy} disabled={!result.password} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Copy password</button></div>
    </ResultsPanel>}
  />;
}

function DiceRollerTool() {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [refresh, setRefresh] = useState(0);
  const result = useMemo(() => rollDice(count, sides, () => refresh < 0 ? 0 : secureRandomUnit()), [count, sides, refresh]);
  return <Shell
    inputs={<InputsPanel title="Dice Inputs">
      <Field label="Number of dice" htmlFor="dice-count"><input id="dice-count" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Sides on each die" htmlFor="dice-sides" hint="Use 4, 6, 8, 10, 12, or 20 for common tabletop dice, or enter another side count."><input id="dice-sides" type="number" min={2} max={1000} value={sides} onChange={(event) => setSides(Number(event.target.value))} className={inputClass} /></Field>
      <button type="button" onClick={() => setRefresh((value) => value + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Roll dice</button>
    </InputsPanel>}
    results={<ResultsPanel title="Dice Results">
      <ResultCard highlight label="Rolls" value={result.rolls.join(', ')} />
      <ResultCard label="Total" value={result.total.toString()} />
      <ResultCard label="Dice" value={`${result.count} × d${result.sides}`} />
      <ResultCard label="Expected average" value={(result.count * (result.sides + 1) / 2).toFixed(2)} />
    </ResultsPanel>}
  />;
}

function ShoeSizeTool() {
  const [length, setLength] = useState(25);
  const [unit, setUnit] = useState<'cm' | 'mm' | 'in'>('cm');
  const [ageGroup, setAgeGroup] = useState<ShoeAgeGroup>('adult');
  const result = useMemo(() => shoeSizes(length, unit, ageGroup), [length, unit, ageGroup]);
  const hasResult = !('error' in result);
  return <Shell
    inputs={<InputsPanel title="Footwear Conversion Inputs">
      <Field label="Foot length" htmlFor="shoe-length" hint="Sizing varies by brand; use this as a reference estimate."><input id="shoe-length" type="number" min={1} max={450} step={0.1} value={length} onChange={(event) => setLength(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Length unit" htmlFor="shoe-unit"><select id="shoe-unit" value={unit} onChange={(event) => setUnit(event.target.value as 'cm' | 'mm' | 'in')} className={selectClass}><option value="cm">Centimeters</option><option value="mm">Millimeters</option><option value="in">Inches</option></select></Field>
      <Field label="Age group" htmlFor="shoe-age"><select id="shoe-age" value={ageGroup} onChange={(event) => setAgeGroup(event.target.value as ShoeAgeGroup)} className={selectClass}><option value="adult">Adults</option><option value="child">Kids (about 5–12)</option><option value="toddler">Infants and toddlers</option></select></Field>
    </InputsPanel>}
    results={<ResultsPanel title="Shoe Size Results">
      <ResultCard highlight label="Conversion" value={hasResult ? `${result.eu} EU / ${result.usWomen} US women` : result.error} />
      {hasResult && <><ResultCard label="US men" value={result.usMen.toString()} /><ResultCard label="UK / India" value={result.ukIndia.toString()} /><ResultCard label="Japan / Mexico" value={result.japanMexico.toString()} /><ResultCard label="China" value={result.china.toString()} /><ResultCard label="Foot length" value={`${result.footLengthCm.toFixed(1)} cm`} /></>}
    </ResultsPanel>}
  />;
}

export const RandomNumberCalculator = () => <ReferenceUtilityCalculator mode="random-number" />;
export const PasswordGeneratorCalculator = () => <ReferenceUtilityCalculator mode="password" />;
export const DiceRollerCalculator = () => <ReferenceUtilityCalculator mode="dice-roller" />;
export const ShoeSizeCalculator = () => <ReferenceUtilityCalculator mode="shoe-size" />;
