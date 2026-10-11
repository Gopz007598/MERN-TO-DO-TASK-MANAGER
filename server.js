
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Temporary storage: tasks disappear when the server restarts.
let tasks = [];
let nextId = 1;

// Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// Add a task
app.post("/api/tasks", (req, res) => {
  const { subject, title, deadline } = req.body;

  if (
    typeof subject !== "string" || !subject.trim() ||
    typeof title !== "string" || !title.trim() ||
    typeof deadline !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
    !Number.isFinite(Date.parse(deadline))
  ) {
    return res.status(400).json({ error: "Enter valid task details." });
  }

  const task = {
    id: nextId++,
    subject: subject.trim(),
    title: title.trim(),
    deadline,
    completed: false
  };

  tasks.push(task);
  res.status(201).json(task);
});

// Update completion status
app.patch("/api/tasks/:id", (req, res) => {
  const task = tasks.find(item => item.id === Number(req.params.id));

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({ error: "Invalid completion status." });
  }

  task.completed = req.body.completed;
  res.json(task);
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex(
    item => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  tasks.splice(index, 1);
  res.status(204).end();
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
