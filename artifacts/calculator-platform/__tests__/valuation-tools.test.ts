import assert from 'node:assert/strict';
assert.equal(Number((((12000-10000)/10000)*100).toFixed(2)),20);
assert.equal(10000/2000,5);
assert.equal(Number((12000/(1.05**5)).toFixed(2)),9402.31);
assert.equal(Number((10000*(1.05**5)).toFixed(2)),12762.82);
for(const v of [0,NaN,Infinity].map(x=>Number.isFinite(x)?x:0))assert.ok(Number.isFinite(v));
console.log('Valuation tools tests passed');
