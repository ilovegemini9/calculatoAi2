import type { CalculatorSpec } from './calculator-batch-01';
import { CALCULATOR_BATCH_01 } from './calculator-batch-01';
import { CALCULATOR_BATCH_02 } from './calculator-batch-02';
import { CALCULATOR_BATCH_03 } from './calculator-batch-03';
import { CALCULATOR_BATCH_04 } from './calculator-batch-04';

export type CalculatorInputs = Record<string, number | string | number[]>;
export type CalculatorResult = Record<string, number | string | boolean | number[]>;
export type CalculatorHandler = (inputs: CalculatorInputs) => CalculatorResult;

const n = (inputs: CalculatorInputs, key: string): number => {
  const value = inputs[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid numeric input: ${key}`);
  return value;
};
const positive = (inputs: CalculatorInputs, key: string): number => {
  const value = n(inputs, key);
  if (value <= 0) throw new Error(`${key} must be greater than zero`);
  return value;
};
const values = (inputs: CalculatorInputs): number[] => {
  const raw = inputs.values;
  if (!Array.isArray(raw) || raw.length === 0 || raw.some(v => typeof v !== 'number' || !Number.isFinite(v))) throw new Error('values must be a non-empty numeric array');
  return raw;
};
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a,b] = [b,a%b]; return a; };
const factorial = (x: number): number => { if (!Number.isInteger(x) || x < 0 || x > 170) throw new Error('n must be an integer from 0 to 170'); let r=1; for(let i=2;i<=x;i++) r*=i; return r; };
const roundSig = (x: number, sig: number): number => { if (x === 0) return 0; const p = sig - Math.floor(Math.log10(Math.abs(x))) - 1; const f = 10 ** p; return Math.round(x*f)/f; };

const handlers: Record<string, CalculatorHandler> = {
  percentage: i => ({ percentage: n(i,'whole') === 0 ? (()=>{throw new Error('whole cannot be zero')})() : n(i,'part')/n(i,'whole')*100 }),
  'percentage-increase': i => ({ increasePercent: (n(i,'new')-n(i,'original'))/positive(i,'original')*100 }),
  'percentage-decrease': i => ({ decreasePercent: (n(i,'original')-n(i,'new'))/positive(i,'original')*100 }),
  average: i => { const v=values(i); return { mean:v.reduce((a,b)=>a+b,0)/v.length }; },
  mean: i => { const v=values(i); return { mean:v.reduce((a,b)=>a+b,0)/v.length }; },
  median: i => { const v=[...values(i)].sort((a,b)=>a-b); const m=Math.floor(v.length/2); return { median:v.length%2?v[m]:(v[m-1]+v[m])/2 }; },
  mode: i => { const v=values(i), counts=new Map<number,number>(); v.forEach(x=>counts.set(x,(counts.get(x)||0)+1)); const max=Math.max(...counts.values()); return { mode:[...counts].filter(([,c])=>c===max).map(([x])=>x) }; },
  'standard-deviation': i => { const v=values(i); const sample=i.sample === true; const mean=v.reduce((a,b)=>a+b,0)/v.length; const variance=v.reduce((s,x)=>s+(x-mean)**2,0)/(v.length-(sample?1:0)); return { standardDeviation:Math.sqrt(variance) }; },
  variance: i => { const v=values(i); const mean=v.reduce((a,b)=>a+b,0)/v.length; return { variance:v.reduce((s,x)=>s+(x-mean)**2,0)/v.length }; },
  'square-root': i => { const x=n(i,'value'); if(x<0) throw new Error('value must be non-negative'); return { root:Math.sqrt(x) }; },
  'cube-root': i => ({ root:Math.cbrt(n(i,'value')) }),
  root: i => { const x=n(i,'value'), k=positive(i,'index'); if(x<0 && Number.isInteger(k) && k%2===0) throw new Error('even root of a negative value is not real'); return { root:Math.sign(x)*Math.pow(Math.abs(x),1/k) }; },
  exponent: i => ({ power:Math.pow(n(i,'base'),n(i,'exponent')) }),
  modulo: i => ({ remainder:n(i,'dividend')%positive(i,'divisor') }),
  gcd: i => { const v=values(i); return { gcd:v.reduce((a,b)=>gcd(a,b)) }; },
  lcm: i => { const v=values(i); return { lcm:v.reduce((a,b)=>Math.abs(a*b)/gcd(a,b)) }; },
  factorial: i => ({ factorial:factorial(n(i,'n')) }),
  permutation: i => { const a=n(i,'n'), r=n(i,'r'); if(!Number.isInteger(a)||!Number.isInteger(r)||a<0||r<0||r>a) throw new Error('n and r must be integers with 0 ≤ r ≤ n'); return { permutations:factorial(a)/factorial(a-r) }; },
  combination: i => { const a=n(i,'n'), r=n(i,'r'); if(!Number.isInteger(a)||!Number.isInteger(r)||a<0||r<0||r>a) throw new Error('n and r must be integers with 0 ≤ r ≤ n'); return { combinations:factorial(a)/(factorial(r)*factorial(a-r)) }; },
  'absolute-value': i => ({ absolute:Math.abs(n(i,'x')) }),
  'absolute-change': i => ({ change:n(i,'newValue')-n(i,'oldValue') }),
  slope: i => { const dx=n(i,'x2')-n(i,'x1'); if(dx===0) throw new Error('x1 and x2 cannot be equal'); return { slope:(n(i,'y2')-n(i,'y1'))/dx }; },
  'distance-between-points': i => ({ distance:Math.hypot(n(i,'x2')-n(i,'x1'),n(i,'y2')-n(i,'y1')) }),
  midpoint: i => ({ x:(n(i,'x1')+n(i,'x2'))/2, y:(n(i,'y1')+n(i,'y2'))/2 }),
  circumference: i => ({ circumference:2*Math.PI*positive(i,'radius') }),
  'circle-area': i => ({ area:Math.PI*positive(i,'radius')**2 }),
  'circle-diameter': i => ({ diameter:2*positive(i,'radius') }),
  'rectangle-area': i => ({ area:positive(i,'length')*positive(i,'width') }),
  'rectangle-perimeter': i => ({ perimeter:2*(positive(i,'length')+positive(i,'width')) }),
  'triangle-area': i => ({ area:0.5*positive(i,'base')*positive(i,'height') }),
  'triangle-perimeter': i => ({ perimeter:n(i,'a')+n(i,'b')+n(i,'c') }),
  square: i => { const s=positive(i,'side'); return { area:s*s, perimeter:4*s }; },
  cube: i => { const s=positive(i,'side'); return { volume:s**3, surfaceArea:6*s*s }; },
  'pythagorean-theorem': i => { const a=positive(i,'a'),b=positive(i,'b'); return { c:Math.hypot(a,b) }; },
  'herons-formula': i => { const a=positive(i,'a'),b=positive(i,'b'),c=positive(i,'c'); const s=(a+b+c)/2; const rad=s*(s-a)*(s-b)*(s-c); if(rad<0) throw new Error('invalid triangle sides'); return { area:Math.sqrt(rad) }; },
  'sector-area': i => ({ area:0.5*positive(i,'radius')**2*n(i,'angle')*Math.PI/180 }),
  'arc-length': i => ({ arcLength:positive(i,'radius')*n(i,'angle')*Math.PI/180 }),
  discount: i => { const p=positive(i,'price'), d=n(i,'discountPercent'); return { discountAmount:p*d/100, finalPrice:p*(1-d/100) }; },
  'sales-tax': i => { const p=positive(i,'price'), t=n(i,'taxPercent'); return { taxAmount:p*t/100, total:p*(1+t/100) }; },
  margin: i => { const r=positive(i,'revenue'), c=n(i,'cost'); const profit=r-c; return { profit, marginPercent:profit/r*100 }; },
  markup: i => ({ markupPercent:(n(i,'sellingPrice')-positive(i,'cost'))/positive(i,'cost')*100 }),
  'simple-interest': i => { const p=positive(i,'principal'), rate=n(i,'rate'), time=n(i,'time'); const interest=p*rate*time; return { interest,total:p+interest }; },
  'compound-interest': i => { const p=positive(i,'principal'), rate=n(i,'rate'), periods=positive(i,'periods'), time=n(i,'time'); const total=p*Math.pow(1+rate/periods,periods*time); return { total, interest:total-p }; },
  roi: i => ({ roiPercent:(n(i,'gain')-positive(i,'cost'))/positive(i,'cost')*100 }),
  commission: i => ({ commission:positive(i,'sales')*n(i,'commissionRate')/100 }),
  tip: i => { const bill=positive(i,'bill'), tip=bill*n(i,'tipPercent')/100, people=positive(i,'people'); return { tip,total:bill+tip,perPerson:(bill+tip)/people }; },
  'debt-to-income': i => ({ dtiPercent:positive(i,'monthlyDebt')/positive(i,'grossMonthlyIncome')*100 }),
  inflation: i => ({ futureAmount:positive(i,'amount')*Math.pow(1+n(i,'inflationRate'),n(i,'years')) }),
  'future-value': i => ({ futureValue:n(i,'presentValue')*Math.pow(1+n(i,'rate'),n(i,'periods')) }),
  'present-value': i => ({ presentValue:n(i,'futureValue')/Math.pow(1+n(i,'rate'),n(i,'periods')) }),
  'break-even': i => { const fixed=positive(i,'fixedCosts'), margin=n(i,'pricePerUnit')-n(i,'variableCostPerUnit'); if(margin<=0) throw new Error('price per unit must exceed variable cost'); const units=fixed/margin; return { breakEvenUnits:units, breakEvenRevenue:units*n(i,'pricePerUnit') }; },
  'price-per-unit': i => ({ unitPrice:positive(i,'totalPrice')/positive(i,'quantity') }),
  'hourly-to-salary': i => ({ annualSalary:n(i,'hourlyRate')*positive(i,'hoursPerWeek')*positive(i,'weeksPerYear') }),
  'salary-to-hourly': i => ({ hourlyRate:n(i,'salary')/(positive(i,'hoursPerWeek')*positive(i,'weeksPerYear')) }),
  speed: i => ({ speed:n(i,'distance')/positive(i,'time') }),
  acceleration: i => ({ acceleration:n(i,'deltaVelocity')/positive(i,'time') }),
  force: i => ({ force:n(i,'mass')*n(i,'acceleration') }),
  density: i => ({ density:n(i,'mass')/positive(i,'volume') }),
  'kinetic-energy': i => ({ energy:0.5*n(i,'mass')*n(i,'velocity')**2 }),
  'potential-energy': i => ({ energy:n(i,'mass')*n(i,'gravity')*n(i,'height') }),
  work: i => ({ work:n(i,'force')*n(i,'distance')*Math.cos(n(i,'angle')*Math.PI/180) }),
  power: i => ({ power:n(i,'work')/positive(i,'time') }),
  pressure: i => ({ pressure:n(i,'force')/positive(i,'area') }),
  'ohms-law': i => { const v=i.voltage, c=i.current, r=i.resistance; const count=[v,c,r].filter(x=>typeof x==='number'&&Number.isFinite(x)).length; if(count!==2) throw new Error('Provide exactly two of voltage, current, and resistance'); if(typeof v!=='number') return { voltage:n(i,'current')*n(i,'resistance') }; if(typeof c!=='number') return { current:n(i,'voltage')/positive(i,'resistance') }; return { resistance:n(i,'voltage')/positive(i,'current') }; },
  momentum: i => ({ momentum:n(i,'mass')*n(i,'velocity') }),
  impulse: i => ({ impulse:n(i,'force')*n(i,'time') }),
  frequency: i => ({ frequency:n(i,'cycles')/positive(i,'time') }),
  wavelength: i => ({ wavelength:n(i,'waveSpeed')/positive(i,'frequency') }),
  period: i => ({ period:1/positive(i,'frequency') }),
  'angular-velocity': i => ({ angularVelocity:n(i,'angle')/positive(i,'time') }),
  torque: i => ({ torque:n(i,'leverArm')*n(i,'force')*Math.sin(n(i,'angle')*Math.PI/180) }),
  'specific-heat': i => ({ specificHeat:n(i,'heat')/(positive(i,'mass')*n(i,'temperatureChange')) }),
  'heat-transfer': i => ({ heat:n(i,'mass')*n(i,'specificHeat')*n(i,'temperatureChange') }),
  molarity: i => ({ molarity:n(i,'moles')/positive(i,'liters') }),
  ph: i => ({ pH:-Math.log10(positive(i,'hydrogenIonConcentration')) }),
  'mass-moles': i => ({ moles:n(i,'mass')/positive(i,'molarMass') }),
  'moles-mass': i => ({ mass:n(i,'moles')*positive(i,'molarMass') }),
  'percent-yield': i => ({ percentYield:n(i,'actualYield')/positive(i,'theoreticalYield')*100 }),
  'mole-fraction': i => ({ fraction:n(i,'componentMoles')/positive(i,'totalMoles') }),
  probability: i => ({ probability:n(i,'favorable')/positive(i,'total') }),
  'z-score': i => ({ z:(n(i,'value')-n(i,'mean'))/positive(i,'standardDeviation') }),
  'weighted-average': i => { const v=values(i), w=values({values:i.weights as number[]}); if(v.length!==w.length) throw new Error('values and weights must have equal length'); const total=w.reduce((a,b)=>a+b,0); if(total===0) throw new Error('weights cannot sum to zero'); return { average:v.reduce((s,x,k)=>s+x*w[k],0)/total }; },
  'geometric-mean': i => { const v=values(i); if(v.some(x=>x<=0)) throw new Error('values must be positive'); return { mean:Math.exp(v.reduce((s,x)=>s+Math.log(x),0)/v.length) }; },
  'harmonic-mean': i => { const v=values(i); if(v.some(x=>x===0)) throw new Error('values cannot be zero'); return { mean:v.length/v.reduce((s,x)=>s+1/x,0) }; },
  rounding: i => ({ rounded:Number(n(i,'value').toFixed(n(i,'decimalPlaces'))) }),
  'significant-figures': i => ({ rounded:roundSig(n(i,'value'),n(i,'figures')) }),
  'unit-rate': i => ({ rate:n(i,'quantity')/positive(i,'units') }),
  'cagr': i => ({ cagr:Math.pow(n(i,'ending')/positive(i,'beginning'),1/positive(i,'years'))-1 }),
  'calorie-deficit': i => ({ deficit:n(i,'maintenanceCalories')-n(i,'targetCalories') }),
  'bmi': i => ({ bmi:n(i,'weightKg')/positive(i,'heightM')**2 }),
  'bmi-prime': i => ({ bmiPrime:n(i,'bmi')/25 }),
  'calorie': i => ({ dailyCalories:n(i,'bmr')*n(i,'activityFactor') }),
  tdee: i => ({ tdee:n(i,'bmr')*n(i,'activityFactor') }),
  'calorie-burn': i => ({ calories:n(i,'met')*3.5*n(i,'weight')/200*positive(i,'duration') }),
  'pace': i => ({ pace:n(i,'time')/positive(i,'distance') }),
  'running-pace': i => ({ pace:n(i,'time')/positive(i,'distance') }),
  'running-speed': i => ({ speed:n(i,'distance')/positive(i,'time') }),
  'cycling-speed': i => ({ speed:n(i,'distance')/positive(i,'time') }),
  'baseball-batting-average': i => ({ average:n(i,'hits')/positive(i,'atBats') }),
  'miles-per-hour-to-kmh': i => ({ kmh:n(i,'mph')*1.609344 }),
  'kmh-to-mph': i => ({ mph:n(i,'kmh')/1.609344 }),
  'kilometers-to-miles': i => ({ miles:n(i,'kilometers')*0.621371192237 }),
  'miles-to-kilometers': i => ({ kilometers:n(i,'miles')*1.609344 }),
  'pounds-to-kilograms': i => ({ kilograms:n(i,'pounds')*0.45359237 }),
  'kilograms-to-pounds': i => ({ pounds:n(i,'kilograms')/0.45359237 }),
  'liters-to-gallons': i => ({ gallons:n(i,'liters')*0.2641720524 }),
  'gallons-to-liters': i => ({ liters:n(i,'gallons')*3.785411784 }),
  'square-meters-to-square-feet': i => ({ squareFeet:n(i,'squareMeters')*10.7639104167 }),
  'square-feet-to-square-meters': i => ({ squareMeters:n(i,'squareFeet')*0.09290304 }),
  'newtons-to-pounds-force': i => ({ poundsForce:n(i,'newtons')*0.224808943 }),
  'watts-to-horsepower': i => ({ horsepower:n(i,'watts')/745.699872 }),
  'hours-to-minutes': i => ({ minutes:n(i,'hours')*60 }),
  'minutes-to-seconds': i => ({ seconds:n(i,'minutes')*60 }),
  'celsius-to-fahrenheit': i => ({ fahrenheit:n(i,'celsius')*9/5+32 }),
  'fahrenheit-to-celsius': i => ({ celsius:(n(i,'fahrenheit')-32)*5/9 }),
  'meters-to-feet': i => ({ feet:n(i,'meters')*3.280839895 }),
  'feet-to-meters': i => ({ meters:n(i,'feet')*0.3048 }),
  'molarity-dilution': i => ({ finalVolume:n(i,'initialMolarity')*n(i,'initialVolume')/positive(i,'finalMolarity') }),
  'confidence-interval': i => { const mean=n(i,'sampleMean'), sd=positive(i,'standardDeviation'), size=positive(i,'sampleSize'), z=1.96; const m=z*sd/Math.sqrt(size); return { lower:mean-m, upper:mean+m }; },
  percentile: i => { const v=[...values(i)].sort((a,b)=>a-b), p=n(i,'target'); if(p<0||p>100) throw new Error('target percentile must be between 0 and 100'); const pos=(v.length-1)*p/100, lo=Math.floor(pos), hi=Math.ceil(pos); return { value:v[lo]+(v[hi]-v[lo])*(pos-lo) }; },
  quartile: i => { const v=[...values(i)].sort((a,b)=>a-b); const q=(p:number)=>{const pos=(v.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return v[lo]+(v[hi]-v[lo])*(pos-lo)}; return {q1:q(.25),q2:q(.5),q3:q(.75)}; },
  'square-footage': i => ({ area:positive(i,'length')*positive(i,'width') }),
  volume: i => ({ volume:positive(i,'length')*positive(i,'width')*positive(i,'height') }),
  'cylinder-volume': i => ({ volume:Math.PI*positive(i,'radius')**2*positive(i,'height') }),
  'sphere-volume': i => ({ volume:4*Math.PI*positive(i,'radius')**3/3 }),
};

export const CALCULATOR_SPECS: CalculatorSpec[] = [...CALCULATOR_BATCH_01,...CALCULATOR_BATCH_02,...CALCULATOR_BATCH_03,...CALCULATOR_BATCH_04];

export function calculate(slug: string, inputs: CalculatorInputs): CalculatorResult {
  const handler = handlers[slug];
  if (!handler) throw new Error(`Calculator '${slug}' has no functional handler yet`);
  return handler(inputs);
}

export function getCalculatorSpec(slug: string): CalculatorSpec {
  const spec = CALCULATOR_SPECS.find(x=>x.slug===slug);
  if (!spec) throw new Error(`Unknown calculator: ${slug}`);
  return spec;
}

export function listFunctionalCalculators(): string[] { return CALCULATOR_SPECS.filter(x=>handlers[x.slug]).map(x=>x.slug); }
