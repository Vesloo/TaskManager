import * as React from 'react';
import { TextField, Button, Switch, CardHeader } from '@mui/material';

interface TaskFormProps {
    formRef: React.RefObject<HTMLDivElement>;
    newTask: Task;
    setNewTask: React.Dispatch<React.SetStateAction<Task>>;
    insertTask: (event: React.FormEvent) => void;
}

interface Task {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
  }

const TaskForm: React.FC<TaskFormProps> = ({ formRef, newTask, setNewTask, insertTask }) => {
  return (
    <div className="form-container" ref={formRef}>  
      <form onSubmit={insertTask} className="task-form">
        <CardHeader title="Create a task" className="form-header" />
        <div className="form-row">
          <TextField
            type="text"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            label="Title"
            className="text-field form-column"
          />
          <label className="form-column switch">
            Completed:
            <Switch
              checked={newTask.completed}
              onChange={(e) => setNewTask({ ...newTask, completed: e.target.checked })}
            />
          </label>
        </div>
        <div className="form-row">
          <TextField
            type="text"
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            label="Description"
            className="text-field form-column"
          />
          <Button type="submit" variant="contained" color="primary" className="button form-column">
            Add Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(TaskForm);
