<script lang="ts">
  import { activities, logs } from '../stores/activities';
  import type { TimeLog } from '../types';

  export let isOpen: boolean = false;
  export let onClose: () => void;

  let selectedActivityId = '';
  let hoursSpent = 1;
  let date = '';

  // Get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Initialize date to today when modal opens
  $: if (isOpen) {
    date = getTodayDate();
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function handleSubmit() {
    if (!selectedActivityId || hoursSpent <= 0 || !date) {
      return;
    }

    const newLog: TimeLog = {
      id: generateId(),
      activityId: selectedActivityId,
      hoursSpent,
      date
    };

    logs.update(logs => [...logs, newLog]);

    // Reset form
    selectedActivityId = '';
    hoursSpent = 1;
    onClose();
  }

  function handleCancel() {
    // Reset form
    selectedActivityId = '';
    hoursSpent = 1;
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

  $: activitiesList = $activities;
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
      <h2 id="modal-title" class="modal-title">Log Time</h2>
      
      <form on:submit|preventDefault={handleSubmit} class="form">
        <div class="form-group">
          <label for="activity">Activity</label>
          <select
            id="activity"
            bind:value={selectedActivityId}
            required
            autofocus
          >
            <option value="" disabled>Select an activity</option>
            {#each activitiesList as activity (activity.id)}
              <option value={activity.id}>{activity.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="hoursSpent">Hours Spent</label>
          <input
            id="hoursSpent"
            type="number"
            bind:value={hoursSpent}
            min="0.1"
            step="0.1"
            placeholder="1.5"
            required
          />
        </div>

        <div class="form-group">
          <label for="date">Date</label>
          <input
            id="date"
            type="date"
            bind:value={date}
            required
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-cancel" on:click={handleCancel}>
            Cancel
          </button>
          <button type="submit" class="btn btn-save">
            Save
          </button>
        </div>
      </form>
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
    max-width: 500px;
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

  .form-group input,
  .form-group select {
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.87);
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .form-group select {
    cursor: pointer;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #646cff;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .form-group input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .form-group select option {
    background-color: #1a1a1a;
    color: rgba(255, 255, 255, 0.87);
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

    .form-group input,
    .form-group select {
      border-color: rgba(0, 0, 0, 0.2);
      background-color: rgba(0, 0, 0, 0.02);
      color: #213547;
    }

    .form-group input:focus,
    .form-group select:focus {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .form-group input::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }

    .form-group select option {
      background-color: #ffffff;
      color: #213547;
    }

    .btn-cancel {
      background-color: rgba(0, 0, 0, 0.05);
      color: #213547;
    }

    .btn-cancel:hover {
      background-color: rgba(0, 0, 0, 0.1);
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

