import { controller, respond } from 'snice';
import type { IController } from 'snice';
import * as taskService from '../services/tasks';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

interface CreateTaskPayload {
  title: string;
  description: string;
  priority: TaskPriority;
  status?: TaskStatus;
  assignee?: string | null;
  tags?: string[];
  dueDate?: string | null;
}

interface UpdateTaskPayload {
  id: string;
  updates: Partial<Task>;
}

interface MoveTaskPayload {
  id: string;
  status: TaskStatus;
}

@controller('task-controller')
class TaskController implements IController {
  element!: HTMLElement;

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @respond('get-tasks')
  async handleGetTasks() {
    return taskService.getTasks();
  }

  @respond('get-task')
  async handleGetTask(payload: { id: string }) {
    return taskService.getTask(payload.id);
  }

  @respond('create-task')
  async handleCreateTask(payload: CreateTaskPayload) {
    return taskService.createTask(payload);
  }

  @respond('update-task')
  async handleUpdateTask(payload: UpdateTaskPayload) {
    return taskService.updateTask(payload.id, payload.updates);
  }

  @respond('delete-task')
  async handleDeleteTask(payload: { id: string }) {
    await taskService.deleteTask(payload.id);
    return { success: true };
  }

  @respond('move-task')
  async handleMoveTask(payload: MoveTaskPayload) {
    return taskService.moveTask(payload.id, payload.status);
  }
}
