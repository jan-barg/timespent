<script lang="ts">
  import { activities, logs } from '../stores/activities';
  import type { Activity, TimeLog } from '../types';

  export let isOpen: boolean = false;
  export let onClose: () => void;
  export let editActivity: Activity | null = null;

  let name = '';
  let avgHoursPerDay = 1;
  let startDate = '';
  let endDate = '';
  
  // For editing time logs
  let editingLogId: string | null = null;
  let newLogDate = '';
  let newLogHours = 1;

  // Pre-fill form when editing
  $: if (isOpen && editActivity) {
    name = editActivity.name;
    avgHoursPerDay = editActivity.avgHoursPerDay;
    startDate = editActivity.startDate;
    endDate = editActivity.endDate;
  } else if (isOpen && !editActivity) {
    // Reset form when adding new
    name = '';
    avgHoursPerDay = 1;
    startDate = '';
    endDate = '';
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get logs for the current activity being edited
  // Explicitly depend on $logs and editActivity to ensure reactivity
  $: if (editActivity && $logs) {
    activityLogs = $logs
      .filter(log => log.activityId === editActivity.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else {
    activityLogs = [];
  }
  
  let activityLogs: TimeLog[] = [];

  function handleEditLog(log: TimeLog) {
    editingLogId = log.id;
    newLogDate = log.date;
    newLogHours = log.hoursSpent;
  }

  function handleSaveLog() {
    if (!editActivity || !newLogDate || newLogHours <= 0) return;

    if (editingLogId) {
      // Update existing log
      logs.update(logs => 
        logs.map(log => 
          log.id === editingLogId 
            ? { ...log, date: newLogDate, hoursSpent: newLogHours }
            : log
        )
      );
    } else {
      // Create new log
      const newLog: TimeLog = {
        id: generateId(),
        activityId: editActivity.id,
        date: newLogDate,
        hoursSpent: newLogHours
      };
      logs.update(logs => [...logs, newLog]);
    }

    // Reset
    editingLogId = null;
    newLogDate = '';
    newLogHours = 1;
  }

  function handleCancelLogEdit() {
    editingLogId = null;
    newLogDate = '';
    newLogHours = 1;
  }

  function handleDeleteLog(logId: string) {
    if (confirm('Are you sure you want to delete this time log entry?')) {
      logs.update(logs => logs.filter(log => log.id !== logId));
    }
  }

  function handleAddNewLog() {
    if (!editActivity) return;
    editingLogId = null;
    newLogDate = getTodayDate();
    newLogHours = 1;
  }

  function handleSubmit() {
    if (!name.trim() || !startDate || !endDate || avgHoursPerDay <= 0) {
      return;
    }

    if (editActivity) {
      // Update existing activity
      const updatedActivity: Activity = {
        ...editActivity,
        name: name.trim(),
        avgHoursPerDay,
        startDate,
        endDate
      };
      activities.update(activities => 
        activities.map(a => a.id === editActivity.id ? updatedActivity : a)
      );
    } else {
      // Create new activity
      const newActivity: Activity = {
        id: generateId(),
        name: name.trim(),
        avgHoursPerDay,
        startDate,
        endDate
      };
      activities.update(activities => [...activities, newActivity]);
    }

    // Reset form
    name = '';
    avgHoursPerDay = 1;
    startDate = '';
    endDate = '';

    onClose();
  }

  function handleCancel() {
    // Reset form
    name = '';
    avgHoursPerDay = 1;
    startDate = '';
    endDate = '';
    onClose();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <div 
    class="modal-overlay" 
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal-content" on:click|stopPropagation>
      <h2 id="modal-title" class="modal-title">{editActivity ? 'Edit Time Goal' : 'Add Time Goal'}</h2>
      
      <div class="modal-body">
      <form on:submit|preventDefault={handleSubmit} class="form">
        <div class="form-group">
          <label for="name">Activity Name</label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="e.g., Exercise, Reading"
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label for="avgHoursPerDay">Hours per Day</label>
          <input
            id="avgHoursPerDay"
            type="number"
            bind:value={avgHoursPerDay}
            min="0.1"
            step="0.1"
            placeholder="1.5"
            required
          />
        </div>

        <div class="form-group">
          <label for="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            bind:value={startDate}
            required
          />
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input
            id="endDate"
            type="date"
            bind:value={endDate}
            required
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-cancel" on:click={handleCancel}>
            Cancel
          </button>
          <button type="submit" class="btn btn-save">
            {editActivity ? 'Update' : 'Save'}
          </button>
        </div>
      </form>

      {#if editActivity}
        <div class="time-logs-section">
          <div class="section-header">
            <h3 class="section-title">Time Logs</h3>
            <button type="button" class="btn btn-add-log" on:click={handleAddNewLog}>
              + Add Log
            </button>
          </div>

          {#if editingLogId === null && newLogDate}
            <div class="log-edit-form">
              <div class="log-form-row">
                <input
                  type="date"
                  bind:value={newLogDate}
                  class="log-input"
                />
                <input
                  type="number"
                  bind:value={newLogHours}
                  min="0.1"
                  step="0.1"
                  placeholder="Hours"
                  class="log-input"
                />
                <div class="log-form-actions">
                  <button type="button" class="btn btn-small btn-save" on:click={handleSaveLog}>
                    Save
                  </button>
                  <button type="button" class="btn btn-small btn-cancel" on:click={handleCancelLogEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          {/if}

          {#if activityLogs.length === 0 && !newLogDate}
            <div class="empty-logs">
              <p>No time logs yet. Click "Add Log" to add one.</p>
            </div>
          {:else}
            <div class="logs-list">
              {#each activityLogs as log (log.id)}
                {#if editingLogId === log.id}
                  <div class="log-edit-form">
                    <div class="log-form-row">
                      <input
                        type="date"
                        bind:value={newLogDate}
                        class="log-input"
                      />
                      <input
                        type="number"
                        bind:value={newLogHours}
                        min="0.1"
                        step="0.1"
                        placeholder="Hours"
                        class="log-input"
                      />
                      <div class="log-form-actions">
                        <button type="button" class="btn btn-small btn-save" on:click={handleSaveLog}>
                          Save
                        </button>
                        <button type="button" class="btn btn-small btn-cancel" on:click={handleCancelLogEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                {:else}
                  <div class="log-item">
                    <div class="log-info">
                      <span class="log-date">{new Date(log.date).toLocaleDateString()}</span>
                      <span class="log-hours">{log.hoursSpent.toFixed(1)} hours</span>
                    </div>
                    <div class="log-actions">
                      <button type="button" class="btn-icon-small" on:click={() => handleEditLog(log)} title="Edit" aria-label="Edit log">
                        Edit
                      </button>
                      <button type="button" class="btn-icon-small btn-delete" on:click={() => handleDeleteLog(log.id)} title="Delete" aria-label="Delete log">
                        Delete
                      </button>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/if}
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
    max-height: 90vh;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
  }

  .modal-body {
    overflow-y: auto;
    flex: 1;
    padding-right: 0.5rem;
  }

  .modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
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

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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

  .form-group input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
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

  .btn-cancel {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.87);
  }

  .btn-cancel:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .btn-save {
    background-color: #646cff;
    color: white;
  }

  .btn-save:hover {
    background-color: #535bf2;
    transform: translateY(-1px);
  }

  .time-logs-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: rgba(255, 255, 255, 0.87);
  }

  .btn-add-log {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    background-color: rgba(100, 108, 255, 0.2);
    color: #646cff;
  }

  .btn-add-log:hover {
    background-color: rgba(100, 108, 255, 0.3);
  }

  .empty-logs {
    text-align: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .log-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .log-info {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .log-date {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .log-hours {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.87);
  }

  .log-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-icon-small {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .btn-icon-small:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .btn-icon-small.btn-delete:hover {
    background-color: rgba(248, 113, 113, 0.2);
  }

  .log-edit-form {
    padding: 0.75rem;
    background-color: rgba(100, 108, 255, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(100, 108, 255, 0.3);
    margin-bottom: 0.5rem;
  }

  .log-form-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .log-input {
    padding: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.87);
    font-size: 0.875rem;
    font-family: inherit;
  }

  .log-input:focus {
    outline: none;
    border-color: #646cff;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .log-input[type="date"] {
    flex: 1;
  }

  .log-input[type="number"] {
    width: 100px;
  }

  .log-form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  @media (prefers-color-scheme: light) {
    .modal-content {
      background-color: #ffffff;
      border-color: rgba(0, 0, 0, 0.1);
    }

    .modal-title {
      color: #213547;
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

    .form-group input::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }

    .btn-cancel {
      background-color: rgba(0, 0, 0, 0.05);
      color: #213547;
    }

    .btn-cancel:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .time-logs-section {
      border-top-color: rgba(0, 0, 0, 0.1);
    }

    .section-title {
      color: #213547;
    }

    .btn-add-log {
      background-color: rgba(100, 108, 255, 0.1);
      color: #646cff;
    }

    .btn-add-log:hover {
      background-color: rgba(100, 108, 255, 0.15);
    }

    .empty-logs {
      color: rgba(0, 0, 0, 0.5);
    }

    .log-item {
      background-color: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.1);
    }

    .log-date {
      color: rgba(0, 0, 0, 0.7);
    }

    .log-hours {
      color: #213547;
    }

    .btn-icon-small {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .btn-icon-small:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .btn-icon-small.btn-delete:hover {
      background-color: rgba(220, 38, 38, 0.1);
    }

    .log-edit-form {
      background-color: rgba(100, 108, 255, 0.05);
      border-color: rgba(100, 108, 255, 0.2);
    }

    .log-input {
      border-color: rgba(0, 0, 0, 0.2);
      background-color: rgba(0, 0, 0, 0.02);
      color: #213547;
    }

    .log-input:focus {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 1.5rem;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }
  }
</style>

