export const MAX_EXTRACTIONS = 3;
export const MAX_CHATS = 20;

export type JobStats = {
  total: number;
  PENDING: number;
  INTERVIEW: number;
  REJECTED: number;
  HIRED: number;
};

export const EMPTY_STATS: JobStats = {
  total: 0,
  PENDING: 0,
  INTERVIEW: 0,
  REJECTED: 0,
  HIRED: 0,
};

export interface DashboardStatsProps {
  stats: JobStats;
}