<script lang="ts">
  import { activities, logs as logsStore } from '../stores/activities';
  import type { Activity, TimeLog } from '../types';
  import CatchUpModal from './CatchUpModal.svelte';

  export let activity: Activity;
  export let logs: TimeLog[];
  export let onEdit: (activity: Activity) => void;

  let viewMode: 'total' | 'average' = 'total';
  let showCatchUpModal = false;
  let totalProgress = { logged: 0, scheduled: 0, percentage: 0 };
  let averageProgress = { actual: 0, target: 0, percentage: 0 };

  function calculateDaysElapsed(): number {
    const start = new Date(activity.startDate);
    const end = new Date(activity.endDate);
    const today = new Date();
    const endDate = today < end ? today : end;
    return Math.ceil((endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  function calculateTotalHoursLogged(): number {
    const activityLogs = logs.filter(log => log.activityId === activity.id);
    return activityLogs.reduce((sum, log) => sum + (log.hoursSpent ?? 0), 0);
  }

  // For completion-based activities: count completions
  function calculateTotalCompletions(): number {
    const activityLogs = logs.filter(log => log.activityId === activity.id);
    return activityLogs.reduce((sum, log) => sum + (log.count ?? (log.completed ? 1 : 0)), 0);
  }

  function calculateCompletionsThisWeek(): number {
    const start = new Date(activity.startDate);
    const today = new Date();
    // days since start
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / msPerDay);
    const weekIndex = Math.floor(daysSinceStart / 7);
    const weekStart = new Date(start.getTime() + weekIndex * 7 * msPerDay);
    const weekEnd = new Date(weekStart.getTime() + 6 * msPerDay);

    const activityLogs = logs.filter(log => log.activityId === activity.id);
    return activityLogs.reduce((sum, log) => {
      const d = new Date(log.date);
      const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (nd >= new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()) && nd <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate())) {
        return sum + (log.count ?? (log.completed ? 1 : 0));
      }
      return sum;
    }, 0);
  }

  function calculateTotalProgress() {
    const daysElapsed = calculateDaysElapsed();
    const totalHoursLogged = calculateTotalHoursLogged();
    if (activity.activityType === 'completion') {
      const totalCompletions = calculateTotalCompletions();
      const weeksElapsed = Math.floor(daysElapsed / 7) + 1;
      const totalScheduled = weeksElapsed * (activity.targetPerWeek ?? 0);
      const percentage = totalScheduled > 0 ? Math.min((totalCompletions / totalScheduled) * 100, 100) : 0;
      return { logged: totalCompletions, scheduled: totalScheduled, percentage };
    }

    const totalHoursScheduled = daysElapsed * (activity.avgHoursPerDay ?? 0);
    const percentage = totalHoursScheduled > 0 ? Math.min((totalHoursLogged / totalHoursScheduled) * 100, 100) : 0;
    return { logged: totalHoursLogged, scheduled: totalHoursScheduled, percentage };
  }

  function calculateAverageProgress() {
    const daysElapsed = calculateDaysElapsed();
    const totalHoursLogged = calculateTotalHoursLogged();
    if (activity.activityType === 'completion') {
      const currentWeekCompletions = calculateCompletionsThisWeek();
      const target = activity.targetPerWeek ?? 0;
      const percentage = target > 0 ? Math.min((currentWeekCompletions / target) * 100, 100) : 0;
      return { actual: currentWeekCompletions, target, percentage } as any;
    }

    const actualAvgHoursPerDay = daysElapsed > 0 ? totalHoursLogged / daysElapsed : 0;
    const targetAvgHoursPerDay = activity.avgHoursPerDay ?? 0;
    const percentage = targetAvgHoursPerDay > 0 ? Math.min((actualAvgHoursPerDay / targetAvgHoursPerDay) * 100, 100) : 0;
    return { actual: actualAvgHoursPerDay, target: targetAvgHoursPerDay, percentage };
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete "${activity.name}"? This will also delete all associated time logs.`)) {
      // Delete the activity
      activities.update(activities => activities.filter(a => a.id !== activity.id));
      // Delete all logs for this activity
      logsStore.update(logs => logs.filter(log => log.activityId !== activity.id));
    }
  }

  // Make calculations explicitly reactive to logs prop changes
  $: daysElapsed = calculateDaysElapsed();
  
  // Explicitly depend on logs prop to ensure recalculation when logs change
  $: totalHoursLogged = logs ? calculateTotalHoursLogged() : 0;
  
  $: if (logs && daysElapsed !== undefined && totalHoursLogged !== undefined) {
    if (activity.activityType === 'completion') {
      const totalCompletions = calculateTotalCompletions();
      const weeksElapsed = Math.floor(daysElapsed / 7) + 1;
      const scheduled = weeksElapsed * (activity.targetPerWeek ?? 0);
      const percentage = scheduled > 0 ? Math.min((totalCompletions / scheduled) * 100, 100) : 0;
      totalProgress = { logged: totalCompletions, scheduled, percentage };
    } else {
      const scheduled = daysElapsed * (activity.avgHoursPerDay ?? 0);
      const percentage = scheduled > 0 ? Math.min((totalHoursLogged / scheduled) * 100, 100) : 0;
      totalProgress = { logged: totalHoursLogged, scheduled, percentage };
    }
  } else {
    totalProgress = { logged: 0, scheduled: 0, percentage: 0 };
  }
  
  $: if (logs && daysElapsed !== undefined) {
    if (activity.activityType === 'completion') {
      const currentWeek = calculateCompletionsThisWeek();
      const target = activity.targetPerWeek ?? 0;
      const percentage = target > 0 ? Math.min((currentWeek / target) * 100, 100) : 0;
      averageProgress = { actual: currentWeek, target, percentage } as any;
    } else {
      const actual = daysElapsed > 0 ? totalHoursLogged / daysElapsed : 0;
      const target = activity.avgHoursPerDay ?? 0;
      const percentage = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
      averageProgress = { actual, target, percentage };
    }
  } else {
    averageProgress = activity.activityType === 'completion' ? { actual: 0, target: activity.targetPerWeek ?? 0, percentage: 0 } as any : { actual: 0, target: activity.avgHoursPerDay ?? 0, percentage: 0 };
  }
  
  $: currentProgress = viewMode === 'total' ? totalProgress : averageProgress;
</script>

<div class="activity-card">
  <div class="activity-header">
    <h2 class="activity-name">{activity.name}</h2>
    <div class="view-toggle">
      <button
        class="toggle-btn {viewMode === 'total' ? 'active' : ''}"
        on:click={() => viewMode = 'total'}
      >
        Total
      </button>
      <button
        class="toggle-btn {viewMode === 'average' ? 'active' : ''}"
        on:click={() => viewMode = 'average'}
      >
        Average
      </button>
    </div>
  </div>

  {#if viewMode === 'total'}
    <div class="progress-display">
      <div class="progress-values">
        {#if activity.activityType === 'completion'}
          <span class="value-label">{totalProgress.logged} / {totalProgress.scheduled} completions</span>
        {:else}
          <span class="value-label">{totalProgress.logged.toFixed(1)} / {totalProgress.scheduled.toFixed(1)} hours</span>
        {/if}
        <span class="progress-percentage">{totalProgress.percentage.toFixed(0)}%</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            style="width: {totalProgress.percentage}%"
          ></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="progress-display">
      <div class="progress-values">
        {#if activity.activityType === 'completion'}
          <span class="value-label">{averageProgress.actual} / {averageProgress.target} this week</span>
        {:else}
          <span class="value-label">{averageProgress.actual.toFixed(1)} / {averageProgress.target.toFixed(1)} hrs/day</span>
        {/if}
        <span class="progress-percentage">{averageProgress.percentage.toFixed(0)}%</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            style="width: {averageProgress.percentage}%"
          ></div>
        </div>
      </div>
    </div>
  {/if}

    <div class="activity-details">
    <span class="detail-item">Goal: {activity.activityType === 'completion' ? `${activity.targetPerWeek} / week` : `${activity.avgHoursPerDay}h/day`}</span>
    <span class="detail-item">
      {new Date(activity.startDate).toLocaleDateString()} - {new Date(activity.endDate).toLocaleDateString()}
    </span>
    <span class="detail-item">{daysElapsed} days elapsed</span>
  </div>

  <div class="activity-actions">
    <button class="action-btn btn-catchup" on:click={() => showCatchUpModal = true}>
      Catch Up
    </button>
    <button class="action-btn btn-edit" on:click={() => onEdit(activity)}>
      Edit
    </button>
    <button class="action-btn btn-delete" on:click={handleDelete}>
      Delete
    </button>
  </div>
</div>

<CatchUpModal 
  isOpen={showCatchUpModal} 
  {activity} 
  {logs} 
  onClose={() => showCatchUpModal = false} 
/>

<style>
  .activity-card {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }

  .activity-card:hover {
    background-color: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .activity-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: rgba(255, 255, 255, 0.87);
    flex: 1;
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.25rem;
  }

  .toggle-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.6);
  }

  .toggle-btn:hover {
    color: rgba(255, 255, 255, 0.8);
    background-color: rgba(255, 255, 255, 0.05);
  }

  .toggle-btn.active {
    background-color: #646cff;
    color: white;
  }

  .toggle-btn.active:hover {
    background-color: #535bf2;
  }

  .progress-display {
    margin-bottom: 1rem;
  }

  .progress-values {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .value-label {
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }

  .progress-percentage {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }

  .progress-container {
    display: flex;
    align-items: center;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #646cff 0%, #535bf2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .activity-details {
    display: flex;
    gap: 1.5rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
  }

  .activity-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-catchup {
    background-color: rgba(100, 108, 255, 0.2);
    color: #646cff;
  }

  .btn-catchup:hover {
    background-color: rgba(100, 108, 255, 0.3);
  }

  .btn-edit {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
  }

  .btn-edit:hover {
    background-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.87);
  }

  .btn-delete {
    background-color: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }

  .btn-delete:hover {
    background-color: rgba(248, 113, 113, 0.3);
  }

  @media (prefers-color-scheme: light) {
    .activity-card {
      background-color: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.1);
    }

    .activity-card:hover {
      background-color: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.15);
    }

    .activity-name {
      color: #213547;
    }

    .view-toggle {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .toggle-btn {
      color: rgba(0, 0, 0, 0.6);
    }

    .toggle-btn:hover {
      color: rgba(0, 0, 0, 0.8);
      background-color: rgba(0, 0, 0, 0.05);
    }

    .toggle-btn.active {
      background-color: #646cff;
      color: white;
    }

    .value-label {
      color: rgba(0, 0, 0, 0.7);
    }

    .progress-percentage {
      color: rgba(0, 0, 0, 0.6);
    }

    .progress-bar {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .activity-details {
      color: rgba(0, 0, 0, 0.5);
    }

    .activity-actions {
      border-top-color: rgba(0, 0, 0, 0.1);
    }

    .btn-catchup {
      background-color: rgba(100, 108, 255, 0.1);
      color: #646cff;
    }

    .btn-catchup:hover {
      background-color: rgba(100, 108, 255, 0.15);
    }

    .btn-edit {
      background-color: rgba(0, 0, 0, 0.05);
      color: rgba(0, 0, 0, 0.7);
    }

    .btn-edit:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #213547;
    }

    .btn-delete {
      background-color: rgba(220, 38, 38, 0.1);
      color: #dc2626;
    }

    .btn-delete:hover {
      background-color: rgba(220, 38, 38, 0.15);
    }
  }

  @media (max-width: 768px) {
    .activity-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .view-toggle {
      width: 100%;
      justify-content: stretch;
    }

    .toggle-btn {
      flex: 1;
    }

    .activity-details {
      flex-direction: column;
      gap: 0.5rem;
    }

    .activity-actions {
      flex-direction: column;
    }

    .action-btn {
      width: 100%;
    }
  }
</style>

