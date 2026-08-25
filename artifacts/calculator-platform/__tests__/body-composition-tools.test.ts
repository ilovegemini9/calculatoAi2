import assert from 'node:assert/strict';
assert.equal(Number((22*1.75**2).toFixed(2)),67.38);
assert.equal(Number((18.5*1.75**2).toFixed(2)),56.66);
assert.equal(Number((0.407*70+0.267*175-19.2).toFixed(2)),56.02);
assert.equal(Number((4*3.5*70/200*30).toFixed(2)),147);
assert.equal(Number((2200*.25/9).toFixed(2)),61.11);
console.log('Body composition tools tests passed');
