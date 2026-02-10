export const getEditDeadline = (
  year: number,
  month: number,
  cutoffDay: number,
  useNextMonth: boolean
): Date => {
  const safeCutoff = Math.max(1, Math.min(31, cutoffDay));
  const targetMonth = useNextMonth ? (month === 12 ? 1 : month + 1) : month;
  const targetYear = useNextMonth ? (month === 12 ? year + 1 : year) : year;
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const day = Math.min(safeCutoff, daysInTargetMonth);

  return new Date(targetYear, targetMonth - 1, day, 23, 59, 59, 999);
};

export const isEditWindowOpen = (
  year: number,
  month: number,
  cutoffDay: number,
  useNextMonth: boolean,
  now: Date = new Date()
): boolean => {
  const deadline = getEditDeadline(year, month, cutoffDay, useNextMonth);
  return now.getTime() <= deadline.getTime();
};
