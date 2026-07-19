export interface AgeInput {
  birthDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthdayDays: number;
  nextBirthdayWeekday: string;
}

export function calculateAge(input: AgeInput): AgeResult {
  const birth = new Date(input.birthDate + 'T00:00:00');
  const target = new Date(input.targetDate + 'T00:00:00');

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffTime = target.getTime() - birth.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalMonths = years * 12 + months;
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;
  const totalMinutes = totalHours * 60;

  const nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBday.getTime() < target.getTime()) {
    nextBday.setFullYear(target.getFullYear() + 1);
  }

  const daysToNextBday = Math.ceil(
    (nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const nextBirthdayWeekday = weekdays[nextBday.getDay()];

  return {
    years,
    months,
    days,
    totalMonths,
    totalWeeks,
    totalDays,
    totalHours,
    totalMinutes,
    nextBirthdayDays: daysToNextBday === 366 ? 0 : daysToNextBday,
    nextBirthdayWeekday,
  };
}
