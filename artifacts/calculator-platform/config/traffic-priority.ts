export const TRAFFIC_PRIORITY = [
  { slug: 'age', priority: 'P0', cluster: 'health-lifestyle', variants: ['age-calculator','how-old-am-i','age-in-days','age-in-months','age-difference-calculator','birthday-calculator'] },
  { slug: 'bmi', priority: 'P0', cluster: 'health', variants: ['bmi-calculator','bmi-for-age','healthy-weight-calculator'] },
  { slug: 'calorie', priority: 'P0', cluster: 'health', variants: ['calorie-calculator','daily-calorie-calculator','calories-burned-calculator'] },
  { slug: 'height', priority: 'P0', cluster: 'health-lifestyle', variants: ['height-calculator','height-prediction-calculator','height-converter'] },
  { slug: 'discount', priority: 'P0', cluster: 'money', variants: ['discount-calculator','sale-price-calculator','percent-off-calculator'] },
  { slug: 'time', priority: 'P0', cluster: 'time', variants: ['time-calculator','time-duration-calculator','hours-calculator','minutes-calculator'] },
  { slug: 'margin', priority: 'P1', cluster: 'business', variants: ['margin-calculator','profit-margin-calculator','gross-margin-calculator'] },
  { slug: 'minecraft-circle-generator', priority: 'P1', cluster: 'gaming', variants: ['minecraft-circle-generator','minecraft-circle-chart','minecraft-oval-generator'] },
  { slug: 'calculator', priority: 'P1', cluster: 'math', variants: ['calculator','online-calculator','basic-calculator'] },
] as const;

export type TrafficPriority = (typeof TRAFFIC_PRIORITY)[number];
