# Timespent

A time and completion tracking application built with Svelte and Vite. Track your activities with two flexible tracking modes: time-based (hours per day) or completion-based (completions per week).

## Features

### Activity Types

Timespent supports two types of activities to match different tracking needs:

#### Time-Based Activities
- Track activities by hours spent per day
- Set a target number of hours per day (e.g., "2 hours/day" for exercise)
- Log the number of hours spent on the activity
- View progress showing total hours logged vs. scheduled hours
- Compare daily average hours logged vs. target

#### Completion-Based Activities
- Track activities by number of completions per week
- Set a target number of completions per week (e.g., "3 times/week" for gym visits)
- Log each completion with a count
- View progress showing total completions this week vs. target
- Automatically calculate which week an activity is in based on the start date

### Progress Tracking

#### Activity Cards
Each activity displays:
- **Activity name** with activity type indicator
- **Progress bar** showing your progress toward goals
- **Toggle views**: Switch between total progress and average/current week progress
- **Time-based**: Total hours logged vs. scheduled, or daily average vs. target
- **Completion-based**: Total completions vs. expected, or current week completions vs. target
- **Activity details**: Goal, date range, and days elapsed
- **Action buttons**: Edit, Delete, and Catch Up

#### Year Progress Bar
At the top of the app, a visual progress indicator shows:
- Today's date with proper ordinal suffix (st, nd, rd, th)
- Calendar year completion percentage
- Updates automatically as time passes
- Format: "Today is [Month] [Day][suffix], [Year]. The year is [%] done."

### Goal Management

#### Add Goals
- Create new activities with a name, type, and date range
- **Time-based**: Set hours per day target
- **Completion-based**: Set target completions per week
- Edit existing activities and their logs

#### Edit Activities
- Modify activity name, type, and targets
- View and edit all time logs or completions for the activity
- Add, edit, or delete individual log entries
- Seamlessly switch between viewing logs and editing activity details

### Logging

#### Log Time Modal
Quick logging interface to record activity:
- Select activity (filtered to active activities)
- Input adapts based on activity type:
  - **Time-based**: Enter hours spent
  - **Completion-based**: Enter number of completions
- Select the date the activity occurred
- One-click logging from anywhere in the app

#### Time Logs
Each activity maintains a detailed log of entries:
- **Time-based logs**: Store hours spent on a specific date
- **Completion-based logs**: Store number of completions on a specific date
- View logs in reverse chronological order (newest first)
- Edit or delete individual entries
- Logs automatically persist to browser storage

### Catch-Up Calculator

For each activity, use the Catch-Up modal to plan your recovery:

#### Time-Based Activities
- View total hours planned vs. logged
- See if you're ahead or behind schedule
- Set a target catch-up date
- Calculate the hours per day needed to catch up by that date
- "On track" message if you're meeting your goals

#### Completion-Based Activities
- View total completions expected vs. logged
- See how many completions you've missed so far
- Set a target catch-up date
- See expected completions by that date
- Track missed completions up to the catch-up date

### Data Persistence

All data is automatically saved to browser localStorage:
- **Activities**: Stored with all metadata (name, type, targets, dates)
- **Logs**: All time and completion entries persist across sessions
- **No server required**: Works completely offline
- Automatic sync when changes are made

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173` (or the next available port if that's in use).

## Usage

### Creating Your First Activity

1. Click the **+** button in the top-right corner
2. Enter activity name (e.g., "Exercise", "Reading", "Meditation")
3. Select activity type:
   - **Time-based (hours)**: For activities measured in hours per day
   - **Completion-based (count/week)**: For activities measured in repetitions per week
4. Set your target:
   - Time-based: Hours per day (e.g., 1.5)
   - Completion-based: Completions per week (e.g., 3)
5. Select start and end dates
6. Click Save

### Logging Activity

1. Click **Log Time** button at the top
2. Select the activity from the dropdown
3. Enter the amount (hours or completions depending on type)
4. Select the date
5. Click Save

### Viewing Progress

- **Activity cards** show real-time progress with visual progress bars
- Toggle between **Total** and **Average** views for different perspectives
- For completion-based activities, "Average" shows current week progress
- Days elapsed counter helps you track your journey

### Planning Catch-Ups

1. Click **Catch Up** button on any activity card
2. View your current progress statistics
3. Set a target date to catch up by
4. See the hourly or completion requirements needed
5. Plan your strategy based on the calculations

## Technical Stack

- **Framework**: Svelte 4
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Scoped CSS with dark/light theme support
- **Storage**: Browser localStorage (no backend required)
- **Package Manager**: npm

## File Structure

```
src/
├── App.svelte                 # Main application component
├── main.ts                    # Entry point
├── app.css                    # Global styles
└── lib/
    ├── components/
    │   ├── ActivityCard.svelte      # Activity display and progress
    │   ├── AddGoalModal.svelte      # Create/edit activities and logs
    │   ├── CatchUpModal.svelte      # Catch-up calculator
    │   ├── LogTimeModal.svelte      # Quick logging interface
    │   └── YearProgressBar.svelte   # Year progress indicator
    ├── stores/
    │   └── activities.ts            # Svelte stores for state management
    └── types/
        └── index.ts                 # TypeScript interfaces
```

## Data Model

### Activity Interface
```typescript
interface Activity {
  id: string;
  name: string;
  activityType: 'time' | 'completion';
  avgHoursPerDay?: number;           // For time-based activities
  targetPerWeek?: number;            // For completion-based activities
  startDate: string;                 // ISO date string
  endDate: string;                   // ISO date string
}
```

### TimeLog Interface
```typescript
interface TimeLog {
  id: string;
  activityId: string;
  hoursSpent?: number;              // For time-based logs
  completed?: boolean;              // For completion-based logs
  count?: number;                   // Number of completions
  date: string;                     // ISO date string
}
```

## Features in Detail

### Week Calculation for Completion-Based Activities
- Week 1: Days 1-7 from start date
- Week 2: Days 8-14 from start date
- And so on...
- Current week is automatically determined based on today's date
- Logs are counted in their respective week

