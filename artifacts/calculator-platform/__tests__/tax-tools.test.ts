import assert from 'node:assert/strict';
const calc=(amount:number,rate:number,mode:'income-tax'|'salary'|'take-home-paycheck'|'sales-tax'|'marriage-tax',second=50000)=>{const tax=mode==='sales-tax'?amount*rate/100:mode==='marriage-tax'?(amount+second)*rate/100:amount*rate/100;return{tax,total:mode==='sales-tax'?amount+tax:mode==='marriage-tax'?amount+second:amount-tax}};
assert.deepEqual(calc(100000,20,'income-tax'),{tax:20000,total:80000});
assert.deepEqual(calc(100000,20,'salary'),{tax:20000,total:80000});
assert.deepEqual(calc(100000,20,'take-home-paycheck'),{tax:20000,total:80000});
assert.deepEqual(calc(100,8,'sales-tax'),{tax:8,total:108});
assert.deepEqual(calc(100000,20,'marriage-tax',50000),{tax:30000,total:150000});
for(const v of [calc(0,0,'income-tax').tax,calc(0,0,'sales-tax').total,calc(0,0,'salary').total])assert.ok(Number.isFinite(v));
console.log('Tax tools tests passed');
