
import { Task } from '../types';
import { platformService } from './PlatformService';

class TaskService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = platformService.getConfig().apiBaseUrl;
  }

  async getTasks(): Promise<Task[]> {
    try {
      // For demo purposes, return mock data
      // In a real app, this would make HTTP requests
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Complete project architecture',
          description: 'Design the shared architecture for web and electron apps',
          completed: false,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          priority: 'high'
        },
        {
          id: '2',
          title: 'Implement platform adapters',
          description: 'Create abstraction layer for platform-specific functionality',
          completed: true,
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-15'),
          priority: 'medium'
        },
        {
          id: '3',
          title: 'Set up Electron configuration',
          description: 'Configure Electron app with proper security and performance settings',
          completed: false,
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
          priority: 'medium'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTasks;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      platformService.showNotification('Task Created', `"${task.title}" has been added to your tasks`);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedTask: Task = {
        id,
        title: updates.title || 'Updated Task',
        description: updates.description,
        completed: updates.completed || false,
        priority: updates.priority || 'medium',
        createdAt: updates.createdAt || new Date(),
        updatedAt: new Date()
      };

      platformService.showNotification('Task Updated', `Task has been updated successfully`);
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      platformService.showNotification('Task Deleted', 'Task has been removed successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  async exportTasks(tasks: Task[]): Promise<void> {
    const data = JSON.stringify(tasks, null, 2);
    const filename = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
    await platformService.saveFile(data, filename);
    platformService.showNotification('Export Complete', `Tasks exported to ${filename}`);
  }

  async importTasks(): Promise<Task[]> {
    const data = await platformService.readFile();
    if (data) {
      try {
        const tasks = JSON.parse(data);
        platformService.showNotification('Import Complete', `Successfully imported ${tasks.length} tasks`);
        return tasks;
      } catch (error) {
        throw new Error('Invalid file format');
      }
    }
    return [];
  }
}

export const taskService = new TaskService();
