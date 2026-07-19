'use client';

import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';
import type { CalculatorInput, CalculatorOutput } from '@/lib/types';

interface Props {
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  calculateBody: string;
}

export function DynamicCalculator({ inputs, outputs, calculateBody }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');

  // Set default values on mount
  useEffect(() => {
    const initial: Record<string, string> = {};
    inputs.forEach((inp) => {
      initial[inp.name] = String(inp.defaultValue ?? '');
    });
    setValues(initial);
  }, [inputs]);

  // Recalculate on inputs change
  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    setError('');

    try {
      const inputsObj: Record<string, string | number> = {};
      inputs.forEach((inp) => {
        const val = values[inp.name];
        inputsObj[inp.name] = inp.type === 'number' ? Number(val || 0) : val;
      });

      // Run sandboxed calculation
      const runner = new Function('inputs', calculateBody);
      const outputObj = runner(inputsObj) as Record<string, unknown>;

      if (typeof outputObj === 'object' && outputObj !== null) {
        setResults(outputObj);
      } else {
        throw new Error('Invalid formula structure');
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Error in mathematical calculations.');
    }
  }, [values, calculateBody, inputs]);

  const handleInputChange = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Input panel */}
      <div 
        className="md:col-span-7 rounded-2xl border p-6 space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">
          Variables & Parameters
        </h2>

        <div className="space-y-4">
          {inputs.map((inp) => {
            const currentVal = values[inp.name] || '';
            
            return (
              <div key={inp.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {inp.label}
                  </label>
                  {inp.type === 'number' && (
                    <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                      {currentVal} {inp.suffix}
                    </span>
                  )}
                </div>

                {inp.type === 'number' ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={inp.min ?? 0}
                      max={inp.max ?? 100}
                      step={inp.step ?? 1}
                      value={Number(currentVal || 0)}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <input
                      type="number"
                      min={inp.min}
                      max={inp.max}
                      step={inp.step}
                      value={currentVal}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none font-medium"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => handleInputChange(inp.name, e.target.value)}
                    className="w-full p-3 border rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                )}

                {inp.helpText && (
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {inp.helpText}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Output results card */}
      <div className="md:col-span-5 space-y-6">
        <div 
          className="rounded-2xl border p-6 text-center space-y-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">
            Calculated Results
          </h2>

          {error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl">
              ⚠️ {error}
            </div>
          ) : (
            <div className="space-y-4">
              {outputs.map((out) => {
                const rawVal = results[out.name];
                const displayVal = typeof rawVal === 'number' ? formatNumber(rawVal, 2) : String(rawVal ?? '0');

                return (
                  <div 
                    key={out.name} 
                    className={`p-4 rounded-xl border ${
                      out.highlight ? 'bg-blue-500/5 border-blue-500/20' : ''
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {out.label}
                    </span>
                    <p className={`text-2xl font-black mt-1 ${out.highlight ? 'text-blue-500' : ''}`} style={{ color: 'var(--text-primary)' }}>
                      {displayVal} <span className="text-sm font-bold">{out.suffix}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
