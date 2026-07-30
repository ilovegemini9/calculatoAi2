export interface TipInput {
  billAmount: number;
  tipPercent: number; // e.g. 15
  splitPeople: number; // e.g. 2
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
  const tipPerPerson = tipAmount / people;
  const totalPerPerson = totalBill / people;

  return {
    tipAmount: Math.round(tipAmount * 100) / 100,
    totalBill: Math.round(totalBill * 100) / 100,
    tipPerPerson: Math.round(tipPerPerson * 100) / 100,
    totalPerPerson: Math.round(totalPerPerson * 100) / 100
  };
}
