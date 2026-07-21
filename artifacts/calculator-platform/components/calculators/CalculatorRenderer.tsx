'use client';

import { AgeCalculator } from './AgeCalculator';
import { BMICalculator } from './BMICalculator';
import { CalorieCalculator } from './CalorieCalculator';
import { GPACalculator } from './GPACalculator';
import { LoanCalculator } from './LoanCalculator';
import { MortgageCalculator } from './MortgageCalculator';
import { MortgageAmortizationCalculator } from './MortgageAmortizationCalculator';
import { HouseAffordabilityCalculator } from './HouseAffordabilityCalculator';
import { RentCalculator } from './RentCalculator';
import { RentVsBuyCalculator } from './RentVsBuyCalculator';
import { PercentageCalculator } from './PercentageCalculator';
import { TipCalculator } from './TipCalculator';

interface Props {
  slug: string;
}

export function CalculatorRenderer({ slug }: Props) {
  switch (slug) {
    case 'age':                  return <AgeCalculator />;
    case 'bmi':                  return <BMICalculator />;
    case 'calorie':              return <CalorieCalculator />;
    case 'gpa':                  return <GPACalculator />;
    case 'loan':                 return <LoanCalculator />;
    case 'mortgage':             return <MortgageCalculator />;
    case 'mortgage-amortization': return <MortgageAmortizationCalculator />;
    case 'house-affordability':  return <HouseAffordabilityCalculator />;
    case 'rent':                 return <RentCalculator />;
    case 'rent-vs-buy':          return <RentVsBuyCalculator />;
    case 'percentage':           return <PercentageCalculator />;
    case 'tip':                  return <TipCalculator />;
    default:                     return <div className="p-8 text-slate-500 text-center">Calculator not found.</div>;
  }
}
