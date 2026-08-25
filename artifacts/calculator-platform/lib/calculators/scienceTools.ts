function nonNegative(value:number){return Number.isFinite(value)?Math.max(0,value):0}
export function mileage(startOdometer:number,endOdometer:number){return Math.max(0,nonNegative(endOdometer)-nonNegative(startOdometer));}
export function density(mass:number,volume:number){const m=nonNegative(mass),v=nonNegative(volume);return v>0?m/v:0;}
export function massConversion(kilograms:number){const kg=nonNegative(kilograms);return{kilograms:kg,pounds:kg*2.20462262185,grams:kg*1000};}
export function weightForce(massKg:number){return nonNegative(massKg)*9.80665;}
export function speed(distance:number,timeHours:number){const d=nonNegative(distance),t=nonNegative(timeHours);return t>0?d/t:0;}
