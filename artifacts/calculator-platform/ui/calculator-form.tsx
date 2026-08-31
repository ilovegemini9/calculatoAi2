import React, { useMemo, useState } from 'react';

export type CalculatorUIResult = Record<string, string | number>;
export type CalculatorCalculate = (slug: string, inputs: Record<string, unknown>) => CalculatorUIResult;

export interface CalculatorUIProps {
  slug: string;
  title: string;
  fields: string[];
  calculate: CalculatorCalculate;
}

export function CalculatorForm({ slug, title, fields, calculate }: CalculatorUIProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const result = useMemo(() => {
    if (fields.some((field) => values[field] === undefined || values[field] === '')) return null;
    try {
      setError('');
      return calculate(slug, values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to calculate');
      return null;
    }
  }, [calculate, fields, slug, values]);

  return (
    <section aria-labelledby={`${slug}-title`} className="calculator-card">
      <h1 id={`${slug}-title`}>{title}</h1>
      <div className="calculator-fields">
        {fields.map((field) => (
          <label key={field}>
            <span>{field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</span>
            <input
              inputMode="decimal"
              value={values[field] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              aria-label={field}
            />
          </label>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {result && (
        <output aria-live="polite">
          {Object.entries(result).map(([key, value]) => (
            <div key={key}><strong>{key}:</strong> {String(value)}</div>
          ))}
        </output>
      )}
    </section>
  );
}
