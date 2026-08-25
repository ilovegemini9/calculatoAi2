function finite(value:number){return Number.isFinite(value)?value:0}

export function scientificNotation(value:number){
  const x=finite(value);
  if(x===0)return{coefficient:0,exponent:0};
  const exponent=Math.floor(Math.log10(Math.abs(x)));
  return{coefficient:x/10**exponent,exponent};
}

export function bigNumberAdd(a:string,b:string){
  try{return(BigInt(a||'0')+BigInt(b||'0')).toString();}catch{return'0';}
}

export function commonFactor(a:number,b:number){
  const x=Math.abs(Math.trunc(finite(a))),y=Math.abs(Math.trunc(finite(b))),limit=Math.min(x,y);
  if(limit===0)return[];
  const out:number[]=[];
  for(let i=1;i*i<=limit;i++){
    if(x%i===0&&y%i===0){out.push(i);if(i*i!==limit&&x%(limit/i)===0&&y%(limit/i)===0)out.push(limit/i);}
  }
  return out.sort((m,k)=>m-k);
}

export function addDateDays(date:string,days:number){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return'';
  const d=new Date(date+'T00:00:00Z');
  if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==date)return'';
  d.setUTCDate(d.getUTCDate()+Math.trunc(finite(days)));
  return d.toISOString().slice(0,10);
}

function clockMinutes(value:string){
  const match=/^(\d{2}):(\d{2})$/.exec(value);
  if(!match)return NaN;
  const hours=Number(match[1]),minutes=Number(match[2]);
  return hours<=23&&minutes<=59?hours*60+minutes:NaN;
}

export function timeDifference(start:string,end:string){
  const a=clockMinutes(start),b=clockMinutes(end);
  return Number.isFinite(a)&&Number.isFinite(b)?b-a:0;
}

export function hoursWorked(start:string,end:string,breakMinutes:number){
  const elapsed=timeDifference(start,end);
  const adjusted=elapsed-Math.max(0,finite(breakMinutes));
  return Math.max(0,adjusted)/60;
}

export function gradeResult(earned:number,total:number){
  const e=Math.max(0,finite(earned)),t=Math.max(0,finite(total));
  const percentage=t>0?Math.min(100,e/t*100):0;
  const letter=percentage>=90?'A':percentage>=80?'B':percentage>=70?'C':percentage>=60?'D':'F';
  return{percentage,letter};
}

export function heightFromFeetInches(feet:number,inches:number){
  const totalInches=Math.max(0,finite(feet))*12+Math.max(0,finite(inches));
  return{totalInches,centimeters:totalInches*2.54,meters:totalInches*0.0254};
}

export function concreteVolume(lengthFeet:number,widthFeet:number,depthInches:number){
  const length=Math.max(0,finite(lengthFeet)),width=Math.max(0,finite(widthFeet)),depth=Math.max(0,finite(depthInches))/12;
  const cubicFeet=length*width*depth;
  return{cubicFeet,cubicYards:cubicFeet/27};
}
