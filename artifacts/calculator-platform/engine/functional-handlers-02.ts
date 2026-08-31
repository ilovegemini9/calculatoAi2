export type NumericInputs = Record<string, unknown>;
export type CalculatorResult = Record<string, number | string>;

const n = (v: unknown, name: string): number => {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`${name} must be a finite number`);
  return x;
};
const positive = (v: unknown, name: string): number => {
  const x = n(v, name);
  if (x <= 0) throw new Error(`${name} must be greater than zero`);
  return x;
};

export const HANDLERS_02: Record<string, (i: NumericInputs) => CalculatorResult> = {
  ratio: i => ({ ratio: `${n(i.a,'a')}:${n(i.b,'b')}` }),
  proportion: i => ({ d: n(i.b,'b') * n(i.c,'c') / positive(i.a,'a') }),
  factorial: i => { const x=n(i.n,'n'); if (!Number.isInteger(x)||x<0||x>170) throw new Error('n must be an integer from 0 to 170'); let r=1; for(let k=2;k<=x;k++) r*=k; return {factorial:r}; },
  permutation: i => { const a=n(i.n,'n'), r=n(i.r,'r'); if(!Number.isInteger(a)||!Number.isInteger(r)||a<0||r<0||r>a) throw new Error('n and r must be integers with 0 ≤ r ≤ n'); let v=1; for(let k=0;k<r;k++) v*=a-k; return {permutations:v}; },
  combination: i => { const a=n(i.n,'n'), r=n(i.r,'r'); if(!Number.isInteger(a)||!Number.isInteger(r)||a<0||r<0||r>a) throw new Error('n and r must be integers with 0 ≤ r ≤ n'); let k=Math.min(r,a-r),v=1; for(let j=1;j<=k;j++) v=v*(a-k+j)/j; return {combinations:v}; },
  'absolute-value': i => ({ absolute: Math.abs(n(i.x,'x')) }),
  'fraction-to-decimal': i => ({ decimal:n(i.numerator,'numerator')/positive(i.denominator,'denominator') }),
  'discount': i => { const p=n(i.price,'price'), d=n(i.discountPercent,'discountPercent'); return {discountAmount:p*d/100,finalPrice:p*(1-d/100)}; },
  'sales-tax': i => { const p=n(i.price,'price'), t=n(i.taxPercent,'taxPercent'); return {taxAmount:p*t/100,total:p*(1+t/100)}; },
  'break-even': i => { const f=n(i.fixedCosts,'fixedCosts'), p=n(i.pricePerUnit,'pricePerUnit'), v=n(i.variableCostPerUnit,'variableCostPerUnit'), m=p-v; if(m<=0) throw new Error('price per unit must exceed variable cost per unit'); return {breakEvenUnits:f/m,breakEvenRevenue:f/m*p}; },
  roi: i => { const gain=n(i.gain,'gain'), cost=positive(i.cost,'cost'); return {roiPercent:(gain-cost)/cost*100}; },
  commission: i => ({ commission:n(i.sales,'sales')*n(i.commissionRate,'commissionRate')/100 }),
  tip: i => { const b=n(i.bill,'bill'),t=n(i.tipPercent,'tipPercent'),p=positive(i.people,'people'); const tip=b*t/100,total=b+tip; return {tip,total,perPerson:total/p}; },
  'debt-to-income': i => ({ dtiPercent:n(i.monthlyDebt,'monthlyDebt')/positive(i.grossMonthlyIncome,'grossMonthlyIncome')*100 }),
  inflation: i => ({ futureAmount:n(i.amount,'amount')*Math.pow(1+n(i.inflationRate,'inflationRate')/100,n(i.years,'years')) }),
  'square-footage': i => ({ area:n(i.length,'length')*n(i.width,'width') }),
  'rectangle-area': i => ({ area:n(i.length,'length')*n(i.width,'width') }),
  'triangle-area': i => ({ area:n(i.base,'base')*n(i.height,'height')/2 }),
  'cylinder-volume': i => ({ volume:Math.PI*Math.pow(n(i.radius,'radius'),2)*n(i.height,'height') }),
  'sphere-volume': i => ({ volume:4*Math.PI*Math.pow(n(i.radius,'radius'),3)/3 }),
  'kinetic-energy': i => ({ energy:0.5*n(i.mass,'mass')*Math.pow(n(i.velocity,'velocity'),2) }),
  'potential-energy': i => ({ energy:n(i.mass,'mass')*n(i.gravity,'gravity')*n(i.height,'height') }),
  work: i => ({ work:n(i.force,'force')*n(i.distance,'distance')*Math.cos(n(i.angle,'angle')*Math.PI/180) }),
  power: i => ({ power:n(i.work,'work')/positive(i.time,'time') }),
  pressure: i => ({ pressure:n(i.force,'force')/positive(i.area,'area') }),
  'ohms-law': i => { const hasV=i.voltage!==undefined&&i.voltage!==''; const hasI=i.current!==undefined&&i.current!==''; const hasR=i.resistance!==undefined&&i.resistance!==''; if([hasV,hasI,hasR].filter(Boolean).length!==2) throw new Error('Provide exactly two of voltage, current, and resistance'); if(!hasV)return {voltage:n(i.current,'current')*n(i.resistance,'resistance')}; if(!hasI)return {current:n(i.voltage,'voltage')/positive(i.resistance,'resistance')}; return {resistance:n(i.voltage,'voltage')/positive(i.current,'current')}; },
  probability: i => ({ probability:n(i.favorable,'favorable')/positive(i.total,'total') }),
  variance: i => { const a=(i.values as number[]).map(Number),m=a.reduce((s,x)=>s+x,0)/a.length; return {variance:a.reduce((s,x)=>s+(x-m)**2,0)/a.length}; },
  median: i => { const a=(i.values as number[]).map(Number).sort((x,y)=>x-y); if(!a.length)throw new Error('values cannot be empty'); const m=Math.floor(a.length/2); return {median:a.length%2?a[m]:(a[m-1]+a[m])/2}; },
  mode: i => { const a=(i.values as number[]).map(Number), c=new Map<number,number>(); a.forEach(x=>c.set(x,(c.get(x)||0)+1)); const max=Math.max(...c.values()); return {mode:[...c].filter(([,v])=>v===max).map(([k])=>k).join(', ')}; },
  'molarity-dilution': i => ({ finalVolume:n(i.initialMolarity,'initialMolarity')*n(i.initialVolume,'initialVolume')/positive(i.finalMolarity,'finalMolarity') }),
  ph: i => ({ pH:-Math.log10(positive(i.hydrogenIonConcentration,'hydrogenIonConcentration')) }),
  'mass-moles': i => ({ moles:n(i.mass,'mass')/positive(i.molarMass,'molarMass') }),
  'moles-mass': i => ({ mass:n(i.moles,'moles')*positive(i.molarMass,'molarMass') }),
};
