import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTip } from '../lib/calculators/tip/formula';

describe('calculateTip — standard calculations', () => {
  it('$100, 20%, 2 people', () => {
    const r = calculateTip({ billAmount: 100, tipPercent: 20, splitPeople: 2 });
    assert.strictEqual(r.tipAmount,     20);
    assert.strictEqual(r.totalBill,    120);
    assert.strictEqual(r.tipPerPerson,  10);
    assert.strictEqual(r.totalPerPerson, 60);
  });

  it('$75, 18%, 3 people: tip=13.5, total=88.5, per-person=4.5/29.5', () => {
    const r = calculateTip({ billAmount: 75, tipPercent: 18, splitPeople: 3 });
    assert.strictEqual(r.tipAmount,      13.5);
    assert.strictEqual(r.totalBill,      88.5);
    assert.strictEqual(r.tipPerPerson,    4.5);
    assert.strictEqual(r.totalPerPerson, 29.5);
  });

  it('$200, 25%, 5 people: tip=50, total=250, per-person=10/50', () => {
    const r = calculateTip({ billAmount: 200, tipPercent: 25, splitPeople: 5 });
    assert.strictEqual(r.tipAmount,       50);
    assert.strictEqual(r.totalBill,      250);
    assert.strictEqual(r.tipPerPerson,    10);
    assert.strictEqual(r.totalPerPerson,  50);
  });
});

describe('calculateTip — edge cases', () => {
  it('0% tip → tipAmount=0, totalBill=billAmount', () => {
    const r = calculateTip({ billAmount: 100, tipPercent: 0, splitPeople: 4 });
    assert.strictEqual(r.tipAmount, 0);
    assert.strictEqual(r.totalBill, 100);
    assert.strictEqual(r.tipPerPerson, 0);
    assert.strictEqual(r.totalPerPerson, 25);
  });

  it('splitPeople=0 clamped to 1', () => {
    const r = calculateTip({ billAmount: 50, tipPercent: 15, splitPeople: 0 });
    assert.strictEqual(r.tipPerPerson, r.tipAmount);
    assert.strictEqual(r.totalPerPerson, r.totalBill);
  });

  it('negative splitPeople clamped to 1', () => {
    const r = calculateTip({ billAmount: 50, tipPercent: 15, splitPeople: -5 });
    assert.strictEqual(r.tipPerPerson, r.tipAmount);
    assert.strictEqual(r.totalPerPerson, r.totalBill);
  });
});

describe('calculateTip — invariants', () => {
  it('totalBill = billAmount + tipAmount', () => {
    const r = calculateTip({ billAmount: 87.50, tipPercent: 18, splitPeople: 2 });
    assert.ok(Math.abs(r.totalBill - (87.50 + r.tipAmount)) < 0.01);
  });

  it('tipPerPerson × people ≈ tipAmount', () => {
    const people = 4;
    const r = calculateTip({ billAmount: 120, tipPercent: 20, splitPeople: people });
    assert.ok(Math.abs(r.tipPerPerson * people - r.tipAmount) < 0.01);
  });

  it('totalPerPerson × people ≈ totalBill', () => {
    const people = 3;
    const r = calculateTip({ billAmount: 99, tipPercent: 15, splitPeople: people });
    assert.ok(Math.abs(r.totalPerPerson * people - r.totalBill) < 0.01);
  });

  it('values are rounded to 2 decimal places', () => {
    const r = calculateTip({ billAmount: 33.33, tipPercent: 15, splitPeople: 1 });
    [r.tipAmount, r.totalBill, r.tipPerPerson, r.totalPerPerson].forEach((v) => {
      const decimals = (v.toString().split('.')[1] ?? '').length;
      assert.ok(decimals <= 2, `${v} has more than 2 decimal places`);
    });
  });
});
