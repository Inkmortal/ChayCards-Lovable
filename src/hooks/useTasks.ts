
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../types';
import { taskService } from '../services/TaskService';
import { toast } from 'sonner';

export const useTasks = () => {
  const queryClient = useQueryClient();

  const {
    data: tasks = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getTasks,
  });

  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData(['tasks'], (old: Task[] = []) => [...old, newTask]);
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskService.updateTask(id, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(['tasks'], (old: Task[] = []) =>
        old.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['tasks'], (old: Task[] = []) =>
        old.filter(task => task.id !== id)
      );
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    }
  });

  const exportTasks = async () => {
    try {
      await taskService.exportTasks(tasks);
      toast.success('Tasks exported successfully');
    } catch (error) {
      toast.error('Failed to export tasks');
    }
  };

  const importTasks = async () => {
    try {
      const importedTasks = await taskService.importTasks();
      if (importedTasks.length > 0) {
        queryClient.setQueryData(['tasks'], importedTasks);
        toast.success(`Imported ${importedTasks.length} tasks`);
      }
    } catch (error) {
      toast.error('Failed to import tasks');
    }
  };

  return {
    tasks,
    isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    exportTasks,
    importTasks,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending
  };
};
