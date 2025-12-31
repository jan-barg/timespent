export interface Activity {
  id: string;
  name: string;
  // type of activity: time-based (hours) or completion-based (count per week)
  activityType: 'time' | 'completion';
  // For time-based activities (activityType === 'time')
  avgHoursPerDay?: number;
  // For completion-based activities (activityType === 'completion')
  targetPerWeek?: number;
  startDate: string; // ISO date string
  endDate: string;
}

export interface TimeLog {
  id: string;
  activityId: string;
  // For time-based logs use hoursSpent
  hoursSpent?: number;
  // For completion-based logs mark completion (true) or use count for multi-completions
  completed?: boolean;
  count?: number;
  date: string; // ISO date string
}