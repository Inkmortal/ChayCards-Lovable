
import React from 'react';
import { Task } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit3, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800 hover:bg-green-200',
    medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    high: 'bg-red-100 text-red-800 hover:bg-red-200'
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${task.completed ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <CardTitle className={`text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </CardTitle>
              {task.description && (
                <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
