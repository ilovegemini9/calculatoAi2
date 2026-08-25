type IPv4Parts=[number,number,number,number];
function validOctet(value:number){return Number.isInteger(value)&&value>=0&&value<=255}
function parseIp(ip:string):IPv4Parts|null{const parts=ip.trim().split('.').map(Number);return parts.length===4&&parts.every(validOctet)?parts as IPv4Parts:null}
function ipNumber(parts:IPv4Parts){return parts[0]*16777216+parts[1]*65536+parts[2]*256+parts[3]}
function formatIp(value:number){const x=Math.max(0,Math.min(4294967295,Math.trunc(value)));return`${Math.floor(x/16777216)}.${Math.floor(x/65536)%256}.${Math.floor(x/256)%256}.${x%256}`}
export function subnetInfo(ip:string,prefix:number){const parsed=parseIp(ip),p=Math.trunc(prefix);if(!parsed||p<0||p>32)return{valid:false,network:'',broadcast:'',firstUsable:'',lastUsable:'',totalAddresses:0,usableHosts:0};const value=ipNumber(parsed),mask=p===0?0:(0xffffffff<<(32-p))>>>0;const network=(value&mask)>>>0,broadcast=(network+(2**(32-p))-1);const total=2**(32-p),usable=p<31?Math.max(0,total-2):total;return{valid:true,network:formatIp(network),broadcast:formatIp(broadcast),firstUsable:formatIp(p<31?network+1:network),lastUsable:formatIp(p<31?broadcast-1:broadcast),totalAddresses:total,usableHosts:usable};}
const conversionFactors:{[key:string]:number}={meters:1,kilometers:1000,feet:0.3048,miles:1609.344,inches:0.0254};
export type LengthUnit=keyof typeof conversionFactors;
export function convertLength(value:number,from:LengthUnit,to:LengthUnit){const x=Number.isFinite(value)?value:0;const meters=x*conversionFactors[from];return meters/conversionFactors[to];}
