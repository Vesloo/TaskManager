import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import Switch from '@mui/material/Switch';
import { TextField, Button, CssBaseline, IconButton } from '@mui/material';
import CardHeader from '@mui/material/CardHeader';
import { ThemeContextProvider, useThemeContext } from './ThemeContext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const TaskForm = React.lazy(() => import('./TaskForm'));

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

interface TaskList {
  id: number;
  name: string;
  tasks: Task[];
}

function App() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [newTask, setNewTask] = useState<Task>({ id: 0, title: '', description: '', completed: false });
  const [editingTask, setEditingTask] = useState<{ taskId: number | null, listId: number | null }>({ taskId: null, listId: null });
  const [editedTask, setEditedTask] = useState<Task>({ id: 0, title: '', description: '', completed: false });
  const [newListName, setNewListName] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentListId, setCurrentListId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useThemeContext();
  const [offsets, setOffsets] = useState<{ [key: string]: [number, number] }>({});

  const displayTaskLists = useCallback(async () => {
    const data = await window.electron.invoke('get-task-lists');
    setTaskLists(data);
  }, []);

  const insertTask = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentListId !== null) {
      await window.electron.invoke('insert-task', { ...newTask, listId: currentListId });
      displayTaskLists(); // Refresh the task lists
      setShowForm(false);
      setNewTask({ id: 0, title: '', description: '', completed: false });
    }
  }, [currentListId, newTask, displayTaskLists]);

  const updateTask = useCallback(async (task: Task) => {
    await window.electron.invoke('update-task', task);
    displayTaskLists(); // Refresh the task lists
  }, [displayTaskLists]);

  const createTaskList = useCallback(async () => {
    await window.electron.invoke('create-task-list', newListName);
    setNewListName('');
    displayTaskLists(); // Refresh the task lists
  }, [newListName, displayTaskLists]);

  const startEditingTask = useCallback((task: Task, listId: number) => {
    setEditingTask({ taskId: task.id, listId });
    setEditedTask(task);
  }, []);

  const makeMovable = useCallback((ref: React.RefObject<HTMLDivElement>, offsetKey: string) => {
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
        setOffsets((prevOffsets) => ({
          ...prevOffsets,
          [offsetKey]: [ref.current!.offsetLeft, ref.current!.offsetTop]
        }));
        window.electron.invoke('remember-components-offset', {
          [offsetKey]: [ref.current!.offsetLeft, ref.current!.offsetTop]
        });
        document.removeEventListener('mousemove', onMouseMove);
      };

      ref.current.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
    }
  }, []);

  useEffect(() => {
    async function initializeOffsets() {
      const savedOffsets = await window.electron.invoke('get-components-offset');
      setOffsets(savedOffsets);
      if (formRef.current) {
        formRef.current.style.left = `${savedOffsets.formOffset[0]}px`;
        formRef.current.style.top = `${savedOffsets.formOffset[1]}px`;
      }
      taskLists.forEach((list) => {
        const listRef = document.getElementById(`tasks-list-${list.id}`);
        if (listRef) {
          listRef.style.left = `${savedOffsets[`tasksListOffset${list.id}`][0]}px`;
          listRef.style.top = `${savedOffsets[`tasksListOffset${list.id}`][1]}px`;
        }
      });
    }

    initializeOffsets();
  }, [taskLists]);

  useEffect(() => {
    makeMovable(formRef, 'formOffset');
    taskLists.forEach((list) => {
      const listRef = document.getElementById(`tasks-list-${list.id}`);
      if (listRef) {
        makeMovable({ current: listRef as HTMLDivElement }, `tasksListOffset${list.id}`);
      }
    });
  }, [taskLists, makeMovable]);

  useEffect(() => {
    displayTaskLists();
  }, [displayTaskLists]);

  const memoizedTaskLists = useMemo(() => taskLists, [taskLists]);

  return (
    <>
      <CssBaseline />
      {showForm && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <TaskForm
            formRef={formRef}
            newTask={newTask}
            setNewTask={setNewTask}
            insertTask={insertTask}
          />
        </React.Suspense>
      )}
      {memoizedTaskLists.map((list) => (
        <div key={list.id} id={`tasks-list-${list.id}`} className="tasks-list">
          <CardHeader title={list.name} className="tasks-header" />
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            <IconButton>
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={() => { setShowForm(true); setCurrentListId(list.id); }}>
              <AddIcon />
            </IconButton>
            {list.tasks.length > 0 ? (
              list.tasks.map((task) => (
                <ListItem key={task.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <ImageIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <IconButton>
                    <DeleteIcon />
                  </IconButton>
                  {editingTask.taskId === task.id && editingTask.listId === list.id ? (
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
                      <Button onClick={() => { updateTask(editedTask); setEditingTask({ taskId: null, listId: null }); }}>Save</Button>
                    </div>
                  ) : (
                    <>
                      <ListItemText onClick={() => startEditingTask(task, list.id)} primary={task.title} secondary={task.description} />
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
      ))}
      <div className="theme-switch">
        <label>Toggle Theme</label>
        <Switch onChange={toggleTheme} />
      </div>
      <div className="add-list">
        <TextField
          type="text"
          placeholder="New List Name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          label="New List Name"
        />
        <Button onClick={createTaskList}>
          <AddIcon />
        </Button>
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
