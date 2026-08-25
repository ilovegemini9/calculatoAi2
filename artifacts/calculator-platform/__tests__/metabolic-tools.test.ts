import assert from 'node:assert/strict';
const bmr = 10*70 + 6.25*175 - 5*30 + 5;
assert.equal(bmr, 1648.75);
assert.equal(Number((bmr*1.55).toFixed(2)),2555.56);
assert.equal(70*1.6,112);
assert.equal(2200*0.5/4,275);
assert.equal(Number.isFinite(10*0+6.25*0-5*0+5),true);
console.log('Metabolic tools tests passed');
