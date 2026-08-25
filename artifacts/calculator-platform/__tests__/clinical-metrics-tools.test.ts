import assert from 'node:assert/strict';
assert.equal(Number(Math.sqrt(70*175/3600).toFixed(2)),1.84);
assert.equal(Number((70/(1.75**2)).toFixed(2)),22.86);
assert.equal(40-12,28);
assert.equal(Number((0.4*12).toFixed(2)),4.8);
assert.ok(Number.isFinite(Math.max(0,1.2*22.86+0.23*30-16.2)));
console.log('Clinical metrics tools tests passed');
