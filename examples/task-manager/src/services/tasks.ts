import type { Task, TaskStatus, TaskPriority } from '../types/task';

const STORAGE_KEY = 'task-manager-tasks';

const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Set up project repository',
    description: 'Initialize the Git repository, add README, configure CI/CD pipeline.',
    status: 'done',
    priority: 'high',
    assignee: 'Alex Morgan',
    tags: ['setup', 'devops'],
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-12T14:00:00Z',
    dueDate: '2025-01-15',
  },
  {
    id: 't2',
    title: 'Design database schema',
    description: 'Create the ER diagram and define table structures for users, tasks, and projects.',
    status: 'review',
    priority: 'high',
    assignee: 'Sam Rivera',
    tags: ['database', 'design'],
    createdAt: '2025-01-11T10:00:00Z',
    updatedAt: '2025-01-18T11:00:00Z',
    dueDate: '2025-01-20',
  },
  {
    id: 't3',
    title: 'Implement authentication flow',
    description: 'Build login, registration, and password reset with JWT tokens.',
    status: 'in-progress',
    priority: 'urgent',
    assignee: 'Alex Morgan',
    tags: ['auth', 'security'],
    createdAt: '2025-01-12T08:00:00Z',
    updatedAt: '2025-01-19T16:00:00Z',
    dueDate: '2025-01-22',
  },
  {
    id: 't4',
    title: 'Build task CRUD API',
    description: 'REST endpoints for creating, reading, updating, and deleting tasks.',
    status: 'todo',
    priority: 'high',
    assignee: 'Sam Rivera',
    tags: ['api', 'backend'],
    createdAt: '2025-01-13T09:00:00Z',
    updatedAt: '2025-01-13T09:00:00Z',
    dueDate: '2025-01-25',
  },
  {
    id: 't5',
    title: 'Create drag-and-drop board UI',
    description: 'Implement the Kanban board with drag-and-drop task movement between columns.',
    status: 'todo',
    priority: 'medium',
    assignee: null,
    tags: ['frontend', 'ui'],
    createdAt: '2025-01-14T10:00:00Z',
    updatedAt: '2025-01-14T10:00:00Z',
    dueDate: '2025-02-01',
  },
  {
    id: 't6',
    title: 'Add email notifications',
    description: 'Send email when tasks are assigned or status changes.',
    status: 'backlog',
    priority: 'low',
    assignee: null,
    tags: ['notifications', 'email'],
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z',
    dueDate: null,
  },
  {
    id: 't7',
    title: 'Write unit tests for API',
    description: 'Achieve 80% test coverage for all API endpoints.',
    status: 'backlog',
    priority: 'medium',
    assignee: null,
    tags: ['testing', 'backend'],
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-16T09:00:00Z',
    dueDate: null,
  },
  {
    id: 't8',
    title: 'Performance optimization',
    description: 'Profile and optimize slow database queries, add caching layer.',
    status: 'backlog',
    priority: 'low',
    assignee: null,
    tags: ['performance', 'backend'],
    createdAt: '2025-01-17T14:00:00Z',
    updatedAt: '2025-01-17T14:00:00Z',
    dueDate: null,
  },
  {
    id: 't9',
    title: 'User profile page',
    description: 'Allow users to update their display name, avatar, and notification preferences.',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Sam Rivera',
    tags: ['frontend', 'ui'],
    createdAt: '2025-01-18T08:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
    dueDate: '2025-01-28',
  },
  {
    id: 't10',
    title: 'Mobile responsive design',
    description: 'Ensure the board and all pages work well on mobile devices.',
    status: 'todo',
    priority: 'medium',
    assignee: null,
    tags: ['frontend', 'responsive'],
    createdAt: '2025-01-19T11:00:00Z',
    updatedAt: '2025-01-19T11:00:00Z',
    dueDate: '2025-02-05',
  },
];

function loadTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    return JSON.parse(raw);
  }
  saveTasks(DEFAULT_TASKS);
  return DEFAULT_TASKS;
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let nextId = 11;

export async function getTasks(): Promise<Task[]> {
  await new Promise((r) => setTimeout(r, 150));
  return loadTasks();
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const tasks = await getTasks();
  return tasks.filter((t) => t.status === status);
}

export async function getTask(id: string): Promise<Task | null> {
  const tasks = await getTasks();
  return tasks.find((t) => t.id === id) || null;
}

export async function createTask(data: {
  title: string;
  description: string;
  priority: TaskPriority;
  status?: TaskStatus;
  assignee?: string | null;
  tags?: string[];
  dueDate?: string | null;
}): Promise<Task> {
  await new Promise((r) => setTimeout(r, 200));
  const tasks = loadTasks();
  const now = new Date().toISOString();
  const task: Task = {
    id: `t${nextId++}`,
    title: data.title,
    description: data.description,
    status: data.status || 'todo',
    priority: data.priority,
    assignee: data.assignee || null,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
    dueDate: data.dueDate || null,
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  await new Promise((r) => setTimeout(r, 150));
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('Task not found');

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);
  return tasks[index];
}

export async function deleteTask(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  const tasks = loadTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  saveTasks(filtered);
}

export async function moveTask(id: string, status: TaskStatus): Promise<Task> {
  return updateTask(id, { status });
}

export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = query.toLowerCase();
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
