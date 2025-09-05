document.addEventListener('DOMContentLoaded', () => {
  const taskList = document.getElementById('taskList');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const taskSummary = document.getElementById('taskSummary');
  const motivationalQuote = document.getElementById('motivationalQuote');
  const filterButtonsContainer = document.getElementById('filter-buttons');
  const sortSelect = document.getElementById('sort-select');

  const taskModal = document.getElementById('taskModal');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const modalTitle = document.getElementById('modalTitle');
  const taskInput = document.getElementById('taskInput');
  const dueDateInput = document.getElementById('dueDate');
  const priorityInput = document.getElementById('priority');
  const taskIdInput = document.getElementById('taskId');

  const themeToggleBtn = document.getElementById('theme-toggle');
  const lightIcon = document.getElementById('theme-icon-light');
  const darkIcon = document.getElementById('theme-icon-dark');

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let currentFilter = localStorage.getItem('filter') || 'all';
  let currentSort = localStorage.getItem('sort') || 'default';

  const synth = new Tone.Synth().toDestination();
  const playAddSound = () => synth.triggerAttackRelease("C4", "8n");
  const playCompleteSound = () => synth.triggerAttackRelease("G4", "8n", Tone.now() + 0.1);
  const playDeleteSound = () => synth.triggerAttackRelease("C3", "8n");

  const quotes = [
    "Discipline is the bridge between goals and accomplishment.",
    "The secret to your future is hidden in your daily routine.",
    "You don't have to be great to start, but you have to start to be great.",
    "Focus on progress, not perfection."
  ];
  motivationalQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  // ---- THEME LOGIC ----
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      lightIcon.classList.add('hidden');
      darkIcon.classList.remove('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      lightIcon.classList.remove('hidden');
      darkIcon.classList.add('hidden');
    }
  };
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
  applyTheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  // ---- END THEME ----

  const saveState = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('filter', currentFilter);
    localStorage.setItem('sort', currentSort);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTasks = () => {
    taskList.innerHTML = '';
    let processedTasks = [...tasks];

    if (currentSort === 'dueDate') {
      processedTasks.sort((a, b) => (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31'));
    } else if (currentSort === 'priority') {
      const priorityMap = { high: 1, medium: 2, low: 3 };
      processedTasks.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
    }

    const filteredTasks = processedTasks.filter(task => {
      if (currentFilter === 'pending') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true;
    });

    if (filteredTasks.length === 0) {
      taskList.innerHTML = `<p class="text-center text-[--text-color-secondary] py-8">No tasks here. Let's create one!</p>`;
    } else {
      filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item flex items-center justify-between p-4 ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        taskElement.innerHTML = `
          <div class="flex items-center gap-4 flex-grow min-w-0">
            <input type="checkbox" class="custom-checkbox flex-shrink-0" ${task.completed ? 'checked' : ''}>
            <div class="flex-grow min-w-0">
              <p class="task-text truncate font-semibold">${task.text}</p>
              <div class="flex items-center gap-x-3 gap-y-1 mt-1 text-xs">
                ${task.dueDate ? `<span>${formatDate(task.dueDate)}</span>` : ''}
                <span>${task.priority}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button class="edit-btn">✏️</button>
            <button class="delete-btn">🗑️</button>
          </div>
        `;
        taskList.appendChild(taskElement);
      });
    }
    updateSummary();
  };

  const updateSummary = () => {
    const pendingTasks = tasks.filter(task => !task.completed).length;
    if (tasks.length === 0) taskSummary.textContent = "Ready to build momentum?";
    else if (pendingTasks === 0) taskSummary.textContent = "All tasks completed! Amazing work! ✨";
    else taskSummary.textContent = `${pendingTasks} task${pendingTasks !== 1 ? 's' : ''} remaining`;
  };

  const toggleModal = (show = true) => taskModal.classList.toggle('modal-hidden', !show);

  const saveTask = () => {
    const text = taskInput.value.trim();
    const id = Number(taskIdInput.value);
    if (!text) return;

    const taskData = { text, dueDate: dueDateInput.value, priority: priorityInput.value };

    if (id) {
      tasks = tasks.map(task => task.id === id ? { ...task, ...taskData } : task);
    } else {
      tasks.unshift({ id: Date.now(), completed: false, ...taskData });
      playAddSound();
    }

    saveState();
    renderTasks();
    toggleModal(false);
  };

  // --- Event Listeners ---
  openModalBtn.addEventListener('click', () => toggleModal(true));
  closeModalBtn.addEventListener('click', () => toggleModal(false));
  saveTaskBtn.addEventListener('click', saveTask);
  taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveTask(); });

  taskList.addEventListener('click', (e) => {
    const taskElement = e.target.closest('.task-item');
    if (!taskElement) return;
    const taskId = Number(taskElement.dataset.id);

    if (e.target.closest('.delete-btn')) {
      tasks = tasks.filter(task => task.id !== taskId);
      playDeleteSound();
      saveState();
      renderTasks();
    } else if (e.target.closest('.edit-btn')) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        modalTitle.textContent = "Edit Task";
        taskIdInput.value = task.id;
        taskInput.value = task.text;
        dueDateInput.value = task.dueDate || '';
        priorityInput.value = task.priority || 'medium';
        toggleModal(true);
      }
    } else if (e.target.closest('.custom-checkbox')) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        if (task.completed) playCompleteSound();
        saveState();
        renderTasks();
      }
    }
  });

  clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter(task => !task.completed);
    saveState();
    renderTasks();
  });

  filterButtonsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.filter-btn');
    if (button) {
      currentFilter = button.dataset.filter;
      saveState();
      renderTasks();
    }
  });

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    saveState();
    renderTasks();
  });

  // Initial load
  renderTasks();
});
