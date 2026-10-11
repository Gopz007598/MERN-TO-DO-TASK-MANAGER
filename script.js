
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");

let tasks = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error(await response.text() || "Request failed");
  }

  return response.status === 204 ? null : response.json();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function loadTasks() {
  try {
    tasks = await api("/api/tasks");
    renderTasks();
  } catch (error) {
    taskList.textContent = "Unable to load tasks. Check that the server is running.";
  }
}

function renderTasks() {
  const query = searchInput.value.toLowerCase().trim();
  const filter = filterSelect.value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.subject.toLowerCase().includes(query);

    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed);

    return matchesSearch && matchesFilter;
  });

  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("pendingTasks").textContent =
    tasks.filter(task => !task.completed).length;
  document.getElementById("completedTasks").textContent =
    tasks.filter(task => task.completed).length;

  if (filteredTasks.length === 0) {
    taskList.innerHTML = "<p>No assignments found. Add your first task!</p>";
    return;
  }

  taskList.innerHTML = filteredTasks.map(task => `
    <article class="task-item ${task.completed ? "completed" : ""}">
      <div class="task-info">
        <h3>${escapeHTML(task.title)}</h3>
        <p>Subject: ${escapeHTML(task.subject)}</p>
        <p>Deadline: ${escapeHTML(task.deadline)}</p>
        <span class="status">
          ${task.completed ? "Completed" : "Pending"}
        </span>
      </div>

      <div class="task-actions">
        <button data-action="toggle" data-id="${task.id}">
          ${task.completed ? "Undo" : "Complete"}
        </button>
        <button class="delete" data-action="delete" data-id="${task.id}">
          Delete
        </button>
      </div>
    </article>
  `).join("");
}

taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const task = {
    subject: document.getElementById("subject").value.trim(),
    title: document.getElementById("title").value.trim(),
    deadline: document.getElementById("deadline").value
  };

  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task)
    });

    taskForm.reset();
    await loadTasks();
  } catch (error) {
    alert("Could not add assignment: " + error.message);
  }
});

taskList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const task = tasks.find(item => String(item.id) === id);
  if (!task) return;

  try {
    if (button.dataset.action === "toggle") {
      await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed })
      });
    } else if (button.dataset.action === "delete") {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
    }

    await loadTasks();
  } catch (error) {
    alert("Could not update assignment: " + error.message);
  }
});

searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);

loadTasks();
