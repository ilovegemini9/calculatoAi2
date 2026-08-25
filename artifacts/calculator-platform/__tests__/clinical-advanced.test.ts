import assert from 'node:assert/strict';import{egfrCkdEpi2021,pace,widmarkBac}from'../lib/calculators/clinicalAdvanced';
assert.equal(pace(5,30).pace,6);assert.equal(pace(0,30).pace,0);
const eg=egfrCkdEpi2021(.9,50,'male');assert.ok(Math.abs(eg-104.0490129932253)<1e-9);assert.ok(egfrCkdEpi2021(.9,50,'female')>0);
const bac=widmarkBac(40,70,2,'male');assert.ok(bac.peak>0);assert.ok(bac.estimated<bac.peak);assert.equal(widmarkBac(0,70,2,'male').estimated,0);
for(const v of[pace(Number.NaN,1).pace,egfrCkdEpi2021(0,0,'male'),widmarkBac(Infinity,70,2,'male').estimated])assert.ok(Number.isFinite(v));
console.log('Clinical advanced production tests passed');
