import type { CalculatorSpec } from './calculator-batch-01';

export const CALCULATOR_BATCH_05: CalculatorSpec[] = [
  { slug: 'parallelogram-area', name: 'Parallelogram Area Calculator', category: 'math', inputs: ['base', 'height'], outputs: ['area'], formula: 'A=b×h' },
  { slug: 'trapezoid-area', name: 'Trapezoid Area Calculator', category: 'math', inputs: ['base1', 'base2', 'height'], outputs: ['area'], formula: 'A=(b₁+b₂)h/2' },
  { slug: 'rhombus-area', name: 'Rhombus Area Calculator', category: 'math', inputs: ['diagonal1', 'diagonal2'], outputs: ['area'], formula: 'A=d₁d₂/2' },
  { slug: 'sphere-volume', name: 'Sphere Volume Calculator', category: 'math', inputs: ['radius'], outputs: ['volume'], formula: 'V=4πr³/3' },
  { slug: 'cylinder-volume', name: 'Cylinder Volume Calculator', category: 'math', inputs: ['radius', 'height'], outputs: ['volume'], formula: 'V=πr²h' },
];
