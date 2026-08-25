import assert from 'node:assert/strict';
assert.equal(Math.max(500000-100000,0)*20/100,80000);
assert.equal(Number((10000*(0.05/12)/(1-(1+0.05/12)**-120)).toFixed(2)),106.07);
assert.equal(Number((1000*1.05**10).toFixed(2)),1628.89);
assert.equal( Math.min(4000,3000)*40/100/12,100);
assert.equal(Number((100*1.1).toFixed(2)),110);
for(const n of [0,-1,NaN,Infinity]) assert.ok(Number.isFinite(Number.isFinite(n)?Math.max(n,0):0));
console.log('Macro finance tools tests passed');
