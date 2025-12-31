<script lang="ts">
  import { onMount } from 'svelte';

  let today = new Date();
  let yearProgress = 0;
  let dateString = '';

  function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function calculateYearProgress(): number {
    const year = today.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    
    const totalMs = endOfYear.getTime() - startOfYear.getTime();
    const elapsedMs = today.getTime() - startOfYear.getTime();
    
    return Math.min((elapsedMs / totalMs) * 100, 100);
  }

  function formatDateString(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = monthNames[today.getMonth()];
    const day = today.getDate();
    const suffix = getOrdinalSuffix(day);
    const year = today.getFullYear();
    
    return `Today is ${month} ${day}${suffix}, ${year}. The year is ${yearProgress.toFixed(1)}% done.`;
  }

  onMount(() => {
    // Update every minute
    const interval = setInterval(() => {
      today = new Date();
      yearProgress = calculateYearProgress();
      dateString = formatDateString();
    }, 60000);

    // Initial calculation
    yearProgress = calculateYearProgress();
    dateString = formatDateString();

    return () => clearInterval(interval);
  });

  $: yearProgress, dateString; // Reactive updates if today changes
</script>

<div class="year-progress-container">
  <div class="progress-section">
    <div class="progress-text">{dateString}</div>
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {yearProgress}%"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .year-progress-container {
    background-color: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem 2rem;
  }

  .progress-section {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-text {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .progress-bar-wrapper {
    display: flex;
    align-items: center;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #646cff, #535bf2);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  @media (prefers-color-scheme: light) {
    .year-progress-container {
      background-color: rgba(0, 0, 0, 0.02);
      border-bottom-color: rgba(0, 0, 0, 0.1);
    }

    .progress-text {
      color: rgba(0, 0, 0, 0.7);
    }

    .progress-bar {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .progress-fill {
      background: linear-gradient(90deg, #646cff, #535bf2);
    }
  }

  @media (max-width: 768px) {
    .year-progress-container {
      padding: 1rem;
    }

    .progress-text {
      font-size: 0.9rem;
    }
  }
</style>
