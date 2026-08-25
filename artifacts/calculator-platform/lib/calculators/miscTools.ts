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
