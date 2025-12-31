<script lang="ts">
  import { onMount } from 'svelte';
  import { activities, logs } from './lib/stores/activities';
  import type { Activity, TimeLog } from './lib/types';
  import AddGoalModal from './lib/components/AddGoalModal.svelte';
  import LogTimeModal from './lib/components/LogTimeModal.svelte';
  import ActivityCard from './lib/components/ActivityCard.svelte';
  import YearProgressBar from './lib/components/YearProgressBar.svelte';

  let showAddGoalModal = false;
  let showLogTimeModal = false;
  let editingActivity: Activity | null = null;

  function handleEditActivity(activity: Activity) {
    editingActivity = activity;
    showAddGoalModal = true;
  }

  function handleCloseAddGoalModal() {
    showAddGoalModal = false;
    editingActivity = null;
  }

  // Only set dummy data if there's no saved data
  onMount(() => {
    // Check if stores are empty (no saved data)
    if ($activities.length === 0 && $logs.length === 0) {
      const dummyActivities: Activity[] = [
        {
          id: '1',
          name: 'Exercise',
          activityType: 'time',
          avgHoursPerDay: 1.5,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        },
        {
          id: '2',
          name: 'Reading',
          activityType: 'time',
          avgHoursPerDay: 1,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        },
        {
          id: '3',
          name: 'Coding Practice',
          activityType: 'time',
          avgHoursPerDay: 2,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      ];

      const dummyLogs: TimeLog[] = [
        { id: '1', activityId: '1', hoursSpent: 1.5, date: '2024-01-15' },
        { id: '2', activityId: '1', hoursSpent: 1.5, date: '2024-01-16' },
        { id: '3', activityId: '2', hoursSpent: 800, date: '2024-01-15' },
        { id: '4', activityId: '3', hoursSpent: 2.5, date: '2024-01-15' },
        { id: '5', activityId: '3', hoursSpent: 2, date: '2024-01-16' }
      ];

      activities.set(dummyActivities);
      logs.set(dummyLogs);
    }
  });

  $: activitiesList = $activities;
  $: logsList = $logs;
</script>

<main>
  <YearProgressBar />
  <header class="header">
    <button class="btn btn-primary" on:click={() => showLogTimeModal = true}>
      Log Time
    </button>
    <h1 class="title">Timespent</h1>
    <button class="btn btn-icon" on:click={() => showAddGoalModal = true} aria-label="Add new time goal">
      <span class="icon">+</span>
    </button>
  </header>

  <section class="activities-section">
    {#if activitiesList.length === 0}
      <div class="empty-state">
        <p>No activities yet. Add a time goal to get started!</p>
      </div>
    {:else}
      <div class="activities-list">
        {#each activitiesList as activity (activity.id)}
          <ActivityCard {activity} logs={logsList} onEdit={handleEditActivity} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Modals -->
  <AddGoalModal 
    isOpen={showAddGoalModal} 
    editActivity={editingActivity}
    onClose={handleCloseAddGoalModal} 
  />
  <LogTimeModal isOpen={showLogTimeModal} onClose={() => showLogTimeModal = false} />
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
    color: rgba(255, 255, 255, 0.87);
  }

  .btn {
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-primary {
    background-color: #646cff;
    color: white;
  }

  .btn-primary:hover {
    background-color: #535bf2;
    transform: translateY(-1px);
  }

  .btn-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #646cff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 1.5rem;
    font-weight: 300;
  }

  .btn-icon:hover {
    background-color: #535bf2;
    transform: scale(1.05);
  }

  .icon {
    line-height: 1;
  }

  .activities-section {
    margin-top: 2rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .activities-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (prefers-color-scheme: light) {
    .header {
      border-bottom-color: rgba(0, 0, 0, 0.1);
    }

    .title {
      color: #213547;
    }

    .empty-state {
      color: rgba(0, 0, 0, 0.5);
    }
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .title {
      font-size: 1.5rem;
    }
  }
</style>
