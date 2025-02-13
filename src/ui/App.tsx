import * as React from 'react';
import { useState, useEffect } from 'react'
import './App.css'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import Switch from '@mui/material/Switch';
import { TextField, Button } from '@mui/material';

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
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<Task>({ id: 0, title: '', description: '', completed: false })
  
  async function displayTask() {
    const data = await window.electron.invoke('get-tasks')
    setTasks(data);
  }

  async function insertTask(event: React.FormEvent) {
    event.preventDefault();
    await window.electron.invoke('insert-task', newTask);
    displayTask(); // Refresh the task list
  }

  async function toggleTaskCompletion(task: Task) {
    const updatedTask = { ...task, completed: !task.completed };
    await window.electron.invoke('update-task', updatedTask);
    displayTask(); // Refresh the task list
  }

  useEffect(() => {
    displayTask();
  }, []);

  return (
    <>
      <div className="form-container">
        <form onSubmit={insertTask}>
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
            <Button type="submit" variant="contained" color="primary" className="button form-column">Add Task</Button>
          </div>
        </form>
      </div>
      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', marginTop: '20px' }}>
        {tasks.length > 0 ? tasks.map((task) => (
          <ListItem key={task.id} onClick={() => toggleTaskCompletion(task)}>
            <ListItemAvatar>
              <Avatar>
                <ImageIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={task.title} secondary={task.description} />
            <Switch
              edge="end"
              checked={task.completed}
              inputProps={{
                'aria-labelledby': 'switch-list-label-completed',
              }}
            />
          </ListItem>
        )) : "There is no data yet..."}
      </List>
    </>
  )
}

export default App
