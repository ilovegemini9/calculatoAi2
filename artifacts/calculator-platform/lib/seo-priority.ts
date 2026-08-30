import { TRAFFIC_PRIORITY } from '../config/traffic-priority';

const priorityMap = new Map(TRAFFIC_PRIORITY.map((item) => [item.slug, item]));

export function getTrafficPriority(slug: string) {
  return priorityMap.get(slug);
}

export function isPriorityCalculator(slug: string) {
  return priorityMap.has(slug);
}

export function getPriorityVariants(slug: string) {
  return priorityMap.get(slug)?.variants ?? [];
}
