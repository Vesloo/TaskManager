import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import Switch from '@mui/material/Switch';
import { TextField, Button, CssBaseline } from '@mui/material';
import CardHeader from '@mui/material/CardHeader';
import { ThemeContextProvider, useThemeContext } from './ThemeContext';

declare global {
  interface Window {
    electron: any;
  }
}

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({ id: 0, title: '', description: '', completed: false });
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editedTask, setEditedTask] = useState<Task>({ id: 0, title: '', description: '', completed: false });
  const formRef = useRef<HTMLDivElement>(null);
  const tasksListRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useThemeContext();

  async function displayTask() {
    const data = await window.electron.invoke('get-tasks');
    setTasks(data);
  }

  async function insertTask(event: React.FormEvent) {
    event.preventDefault();
    await window.electron.invoke('insert-task', newTask);
    displayTask(); // Refresh the task list
  }

  async function updateTask(task: Task) {
    await window.electron.invoke('update-task', task);
    displayTask(); // Refresh the task list
  }

  useEffect(() => {
    displayTask();
  }, []);

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditedTask(task);
  };

  const makeMovable = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      let isMouseDown = false;
      let offsetX = 0;
      let offsetY = 0;

      const onMouseMove = (e: MouseEvent) => {
        if (isMouseDown) {
          ref.current!.style.left = `${e.clientX - offsetX}px`;
          ref.current!.style.top = `${e.clientY - offsetY}px`;
        }
      };

      const onMouseDown = (e: MouseEvent) => {
        isMouseDown = true;
        offsetX = e.clientX - ref.current!.getBoundingClientRect().left;
        offsetY = e.clientY - ref.current!.getBoundingClientRect().top;
        document.addEventListener('mousemove', onMouseMove);
      };

      const onMouseUp = () => {
        isMouseDown = false;
        document.removeEventListener('mousemove', onMouseMove);
      };

      ref.current.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  useEffect(() => {
    makeMovable(formRef);
    makeMovable(tasksListRef);
  }, []);

  return (
    <>
      <CssBaseline />
      <div className="form-container" ref={formRef}>
        <form onSubmit={insertTask} className="task-form">
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
      <div className="tasks-list" ref={tasksListRef}>
        <CardHeader title="Tasks" className="tasks-header" />
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemAvatar>
                  <Avatar>
                    <ImageIcon />
                  </Avatar>
                </ListItemAvatar>
                {editingTask === task.id ? (
                  <div>
                    <TextField
                      size="small"
                      type="text"
                      value={editedTask.title}
                      onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                      label="Title"
                    />
                    <TextField
                      size="small"
                      type="text"
                      value={editedTask.description}
                      onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                      label="Description"
                    />
                    <Switch
                      checked={editedTask.completed}
                      onChange={(e) => setEditedTask({ ...editedTask, completed: e.target.checked })}
                    />
                    <Button onClick={() => { updateTask(editedTask); setEditingTask(null); }}>Save</Button>
                  </div>
                ) : (
                  <>
                    <ListItemText onClick={() => startEditingTask(task)} primary={task.title} secondary={task.description} />
                    <Switch
                      edge="end"
                      checked={task.completed}
                      onChange={() => updateTask({ ...task, completed: !task.completed })}
                      inputProps={{
                        'aria-labelledby': 'switch-list-label-completed',
                      }}
                    />
                  </>
                )}
              </ListItem>
            ))
          ) : (
            "There is no data yet..."
          )}
        </List>
      </div>
      <div className="theme-switch">
        <label>Toggle Theme</label>
        <Switch onChange={toggleTheme} />
      </div>
    </>
  );
}

export default function AppWithThemeProvider() {
  return (
    <ThemeContextProvider>
      <App />
    </ThemeContextProvider>
  );
}
