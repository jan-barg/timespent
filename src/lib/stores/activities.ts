import { writable } from 'svelte/store';
import type { Activity, TimeLog } from '../types';

// Helper function to safely access localStorage
function getStoredItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore errors (e.g., quota exceeded)
  }
}

// Load from localStorage or use empty arrays
const storedActivities = getStoredItem('activities');
const storedLogs = getStoredItem('logs');

export const activities = writable<Activity[]>(
  storedActivities ? JSON.parse(storedActivities) : []
);

export const logs = writable<TimeLog[]>(
  storedLogs ? JSON.parse(storedLogs) : []
);

// Save to localStorage whenever they change
activities.subscribe(value => {
  setStoredItem('activities', JSON.stringify(value));
});

logs.subscribe(value => {
  setStoredItem('logs', JSON.stringify(value));
});