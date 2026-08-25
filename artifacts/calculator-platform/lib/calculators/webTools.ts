function safe(value:number){return Number.isFinite(value)?Math.max(0,value):0}
export function bandwidth(dataMegabytes:number,seconds:number){const mb=safe(dataMegabytes),s=safe(seconds);return{mbps:s>0?mb*8/s:0,megabytesPerSecond:s>0?mb/s:0};}
export function base64Encode(value:string){try{return typeof btoa==='function'?btoa(unescape(encodeURIComponent(value))):Buffer.from(value,'utf8').toString('base64')}catch{return''}}
export function base64Decode(value:string){try{return typeof atob==='function'?decodeURIComponent(escape(atob(value))):Buffer.from(value,'base64').toString('utf8')}catch{return''}}
export function urlEncode(value:string){try{return encodeURIComponent(value)}catch{return''}}
export function urlDecode(value:string){try{return decodeURIComponent(value)}catch{return''}}
export function timeDuration(hours:number,minutes:number,seconds:number){const total=safe(hours)*3600+safe(minutes)*60+safe(seconds);return{totalSeconds:total,hours:Math.floor(total/3600),minutes:Math.floor(total%3600/60),seconds:Math.floor(total%60)};}
export function dayOfWeek(isoDate:string){const date=new Date(`${isoDate}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==isoDate)return'';return new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(date);}
