
import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types';
import { AppHeader } from '../components/AppHeader';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    exportTasks,
    importTasks,
    isCreating,
    isUpdating
  } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const completedCount = tasks.filter(task => task.completed).length;

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, updates: taskData });
    } else {
      createTask(taskData);
    }
    setIsFormOpen(false);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateTask({ id, updates: { completed } });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        onCreateTask={handleCreateTask}
        onExport={exportTasks}
        onImport={importTasks}
        taskCount={tasks.length}
        completedCount={completedCount}
      />

      <div className="max-w-4xl mx-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first task</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks
              .sort((a, b) => {
                // Sort by completion status first, then by priority, then by date
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
          </div>
        )}
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editingTask={editingTask}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
};

export default Index;
