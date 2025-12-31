<script lang="ts">
  import type { Activity, TimeLog } from '../types';

  export let isOpen: boolean = false;
  export let activity: Activity;
  export let logs: TimeLog[];
  export let onClose: () => void;

  let catchUpDate = '';
  let hoursPerDayNeeded = 0;

  function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Initialize catch-up date to end date or 30 days from today when modal opens
  $: if (isOpen) {
    if (!catchUpDate) {
      const endDate = normalizeDate(activity.endDate);
      const today = getTodayNormalized();
      // Use end date if it's in the future, otherwise use 30 days from today
      const defaultDate = endDate >= today ? endDate : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      catchUpDate = `${year}-${month}-${day}`;
    }
  }
  
  // Reset date when modal closes
  $: if (!isOpen) {
    catchUpDate = '';
  }

  // Helper to normalize date to midnight local time
  // Parses date string in YYYY-MM-DD format directly to avoid timezone issues
  function normalizeDate(dateString: string): Date {
    if (!dateString) {
      return new Date();
    }
    
    // Parse YYYY-MM-DD format directly
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      
      // Validate the parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        // Fallback if parsing fails
        const date = new Date(dateString);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
      
      return new Date(year, month, day);
    }
    
    // Fallback to original method if format is different
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Helper to get today normalized to midnight
  function getTodayNormalized(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  // Helper to calculate days between two dates (inclusive)
  function daysBetween(start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1); // +1 to include both start and end dates, minimum 1 day
  }

  function calculateTotalDays(): number {
    const start = normalizeDate(activity.startDate);
    const end = normalizeDate(activity.endDate);
    return daysBetween(start, end);
  }

  function calculateTotalHoursLogged(): number {
    const activityLogs = logs.filter(log => log.activityId === activity.id);
    return activityLogs.reduce((sum, log) => sum + (log.hoursSpent ?? 0), 0);
  }

  function calculateTotalCompletions(): number {
    const activityLogs = logs.filter(log => log.activityId === activity.id);
    return activityLogs.reduce((sum, log) => sum + (log.count ?? (log.completed ? 1 : 0)), 0);
  }

  function calculateDaysElapsed(): number {
    const start = normalizeDate(activity.startDate);
    const today = getTodayNormalized();
    const end = normalizeDate(activity.endDate);
    const endDate = today < end ? today : end;
    return daysBetween(start, endDate);
  }

  function calculateDaysUntilCatchUp(): number {
    if (!catchUpDate) return 0;
    
    try {
      const today = getTodayNormalized();
      const targetDate = normalizeDate(catchUpDate);
      
      // Calculate days from today to target date (inclusive)
      // If today is the target, that's 1 day
      // If tomorrow is the target, that's 2 days, etc.
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If the date is in the past (negative days), return 0
      if (diffDays < 0) return 0;
      
      // Return days including today (minimum 1 day if it's today or in the future)
      return diffDays + 1;
    } catch (e) {
      // If there's any error parsing the date, return 0
      return 0;
    }
  }
  

  function calculateHoursPerDayNeeded(): number {
    if (!catchUpDate) return 0;
    
    // hoursBehindAhead is negative when behind, positive when ahead
    // If ahead or on track (>= 0), no catch-up needed
    if (hoursBehindAhead >= 0) return 0;
    
    const hoursBehind = Math.abs(hoursBehindAhead);
    const daysUntilCatchUp = calculateDaysUntilCatchUp();
    
    // If no days remaining or catch-up date is in the past, can't calculate
    if (daysUntilCatchUp <= 0) return 0;
    
    // Divide hours behind by days until catch-up, then add to average hours per day
    const extraHoursPerDay = hoursBehind / daysUntilCatchUp;
    return (activity.avgHoursPerDay ?? 0) + extraHoursPerDay;
  }


  function calculateScheduledCompletionsUntil(dateString: string): number {
    if (!dateString) return 0;
    const start = normalizeDate(activity.startDate);
    const target = normalizeDate(dateString);
    if (target < start) return 0;
    const days = daysBetween(start, target); // inclusive
    // weeks: 1..7 -> 1 week, 8..14 -> 2 weeks, etc.
    const weeks = Math.floor((days - 1) / 7) + 1;
    return weeks * (activity.targetPerWeek ?? 0);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  $: totalDays = calculateTotalDays();
  $: daysElapsed = calculateDaysElapsed();
  $: totalHoursLogged = calculateTotalHoursLogged();
  $: totalCompletions = calculateTotalCompletions();
  $: isTime = (activity && (activity.activityType === 'time' || !activity.activityType));
  $: totalHoursPlanned = isTime ? totalDays * (activity.avgHoursPerDay ?? 0) : 0;
  $: hoursBehindAhead = isTime ? (totalHoursLogged - (calculateDaysElapsed() * (activity.avgHoursPerDay ?? 0))) : 0;
  $: avgHoursPerDayLogged = daysElapsed > 0 ? totalHoursLogged / daysElapsed : 0;
  $: daysUntilCatchUp = catchUpDate ? calculateDaysUntilCatchUp() : 0;
  
  $: weeksElapsed = Math.floor(totalDays / 7) + 1;
  $: totalScheduledCompletions = !isTime ? weeksElapsed * (activity.targetPerWeek ?? 0) : 0;
  $: completionsBehind = !isTime ? Math.max(0, totalScheduledCompletions - totalCompletions) : 0;
  $: scheduledByCatchUpDate = !isTime && catchUpDate ? calculateScheduledCompletionsUntil(catchUpDate) : 0;
  
  // Recalculate hours per day needed when catchUpDate or hoursBehindAhead changes
  $: if (catchUpDate && hoursBehindAhead < 0 && daysUntilCatchUp > 0) {
    const hoursBehind = Math.abs(hoursBehindAhead);
    const extraHoursPerDay = hoursBehind / daysUntilCatchUp;
    hoursPerDayNeeded = (activity.avgHoursPerDay ?? 0) + extraHoursPerDay;
  } else {
    hoursPerDayNeeded = 0;
  }
  
  $: hoursBehind = hoursBehindAhead < 0 ? Math.abs(hoursBehindAhead) : 0;
</script>

{#if isOpen}
  <div 
    class="modal-overlay" 
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="0"
  >
    <div class="modal-content" role="document">
      <h2 id="modal-title" class="modal-title">Catch Up: {activity.name}</h2>
      
      <div class="catchup-info">
        <div class="info-section">
                  {#if isTime}
            <div class="info-row">
              <span class="info-label">Total hours planned:</span>
              <span class="info-value">{totalHoursPlanned.toFixed(1)} hours</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total hours logged:</span>
              <span class="info-value">{totalHoursLogged.toFixed(1)} hours</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hours {hoursBehindAhead >= 0 ? 'ahead' : 'behind'}:</span>
              <span class="info-value {hoursBehindAhead >= 0 ? 'positive' : 'negative'}">
                {Math.abs(hoursBehindAhead).toFixed(1)} hours
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Average hours/day logged:</span>
              <span class="info-value">{avgHoursPerDayLogged.toFixed(2)} hrs/day</span>
            </div>
                  {:else}
            <div class="info-row">
              <span class="info-label">Total completions expected:</span>
              <span class="info-value">{totalScheduledCompletions} completions</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total completions logged:</span>
              <span class="info-value">{totalCompletions} completions</span>
            </div>
            <div class="info-row">
              <span class="info-label">Missed so far:</span>
              <span class="info-value negative">{completionsBehind} completions</span>
            </div>
          {/if}
        </div>

        <div class="catchup-section">
          <div class="form-group">
            <label for="catchUpDate">Target catch-up date</label>
            <input
              id="catchUpDate"
              type="date"
              bind:value={catchUpDate}
              min={getTodayDate()}
              required
            />
          </div>

          {#if catchUpDate}
            {#if daysUntilCatchUp <= 0}
              <div class="catchup-result" style="background-color: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.3);">
                <div class="result-label">Invalid date</div>
                <div class="result-details">
                  Please select today or a future date to calculate catch-up requirements.
                </div>
              </div>
            {:else}
              {#if isTime}
                {#if hoursBehindAhead < 0}
                  <div class="catchup-result">
                    <div class="result-label">Average hours per day needed to catch up:</div>
                    <div class="result-value">{hoursPerDayNeeded.toFixed(2)} hrs/day</div>
                    <div class="result-details">
                      {hoursBehind.toFixed(1)} hours behind over {daysUntilCatchUp} days
                    </div>
                  </div>
                {:else}
                  <div class="catchup-result success">
                    <div class="result-label">You're on track!</div>
                    <div class="result-details">
                      {#if hoursBehindAhead > 0}
                        You're ahead by {hoursBehindAhead.toFixed(1)} hours
                      {:else}
                        You're meeting your target
                      {/if}
                    </div>
                  </div>
                {/if}
              {:else}
                <!-- completion-based: show expected vs logged up to target date and missed count -->
                <div class="catchup-result">
                  <div class="result-label">Completions expected by {catchUpDate}:</div>
                  <div class="result-value">{scheduledByCatchUpDate} completion(s)</div>
                  <div class="result-details">
                    Total completions logged: {totalCompletions}
                    <br />
                    Missed: {Math.max(0, scheduledByCatchUpDate - totalCompletions)} completion(s)
                  </div>
                </div>
              {/if}
            {/if}
          {/if}
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-close" on:click={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background-color: #1a1a1a;
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 600px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    color: rgba(255, 255, 255, 0.87);
  }

  .catchup-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-label {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.87);
  }

  .info-value.positive {
    color: #4ade80;
  }

  .info-value.negative {
    color: #f87171;
  }

  .catchup-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }

  .form-group input {
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.87);
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #646cff;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .catchup-result {
    padding: 1rem;
    background-color: rgba(100, 108, 255, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(100, 108, 255, 0.3);
  }

  .catchup-result.success {
    background-color: rgba(74, 222, 128, 0.1);
    border-color: rgba(74, 222, 128, 0.3);
  }

  .result-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.5rem;
  }

  .result-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #646cff;
    margin-bottom: 0.25rem;
  }

  /* success result value color adjusted inline where used */

  .result-details {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-close {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.87);
  }

  .btn-close:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  @media (prefers-color-scheme: light) {
    .modal-content {
      background-color: #ffffff;
      border-color: rgba(0, 0, 0, 0.1);
    }

    .modal-title {
      color: #213547;
    }

    .info-section {
      background-color: rgba(0, 0, 0, 0.02);
    }

    .info-label {
      color: rgba(0, 0, 0, 0.7);
    }

    .info-value {
      color: #213547;
    }

    .info-value.positive {
      color: #16a34a;
    }

    .info-value.negative {
      color: #dc2626;
    }

    .form-group label {
      color: rgba(0, 0, 0, 0.7);
    }

    .form-group input {
      border-color: rgba(0, 0, 0, 0.2);
      background-color: rgba(0, 0, 0, 0.02);
      color: #213547;
    }

    .form-group input:focus {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .catchup-result {
      background-color: rgba(100, 108, 255, 0.05);
      border-color: rgba(100, 108, 255, 0.2);
    }

    .catchup-result.success {
      background-color: rgba(74, 222, 128, 0.05);
      border-color: rgba(74, 222, 128, 0.2);
    }

    .result-label {
      color: rgba(0, 0, 0, 0.7);
    }

    .result-value {
      color: #646cff;
    }

    /* success result value color adjusted inline where used */

    .result-details {
      color: rgba(0, 0, 0, 0.6);
    }

    .btn-close {
      background-color: rgba(0, 0, 0, 0.05);
      color: #213547;
    }

    .btn-close:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 1.5rem;
    }
  }
</style>

