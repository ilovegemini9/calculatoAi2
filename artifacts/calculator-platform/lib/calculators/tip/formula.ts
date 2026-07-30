export interface TipInput {
  billAmount: number;
  tipPercent: number;
  splitPeople: number;
}

export interface TipResult {
  tipAmount: number;
  totalBill: number;
  tipPerPerson: number;
  totalPerPerson: number;
}

export function calculateTip(input: TipInput): TipResult {
  const tipAmount = (input.billAmount * input.tipPercent) / 100;
  const totalBill = input.billAmount + tipAmount;
  const people = Math.max(1, input.splitPeople);

  return {
    tipAmount: Math.round(tipAmount * 100) / 100,
    totalBill: Math.round(totalBill * 100) / 100,
    tipPerPerson: Math.round((tipAmount / people) * 100) / 100,
    totalPerPerson: Math.round((totalBill / people) * 100) / 100,
  };
}
