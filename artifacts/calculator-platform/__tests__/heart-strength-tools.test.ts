import assert from 'node:assert/strict';
assert.equal(220-30,190);
assert.equal(Number((70*(1+10/30)).toFixed(2)),93.33);
assert.equal(Number((70/(1.75**2)).toFixed(2)),22.86);
assert.equal(Math.max(0,(70*4+175*.1-30*.5)/10),28.25);
assert.equal(Number.isFinite(1.2*70/1.75),true);
console.log('Heart strength tools tests passed');
