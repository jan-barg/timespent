export interface Activity {
    id: string;
    name: string;
    avgHoursPerDay: number;
    startDate: string; // ISO date string
    endDate: string;
  }
  
  export interface TimeLog {
    id: string;
    activityId: string;
    hoursSpent: number;
    date: string; // ISO date string
  }