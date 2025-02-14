import {getPreloadPath} from "./pathResolver.js";
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isDev } from "./utils.js";
import fs from "fs"


interface Task {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
  }

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the Vite dev server URL in development
  if (isDev()) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }

  

  ipcMain.handle('get-tasks', () => {
    const dbPath = path.join(app.getAppPath(), isDev() ? "src/electron/db/tasks.json" : "db/tasks.json");
    
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8").trim();
      if (data.length !== 0) {
        return JSON.parse(data);
      } else {
        return [];
      }
    } else {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.writeFileSync(dbPath, "[]", 'utf-8');
      return [];
    }
  })

  ipcMain.handle('insert-task', (event, newTask) => {
    event.preventDefault();
    
    const dbPath = isDev() ? "src/electron/db/tasks.json" : "db/tasks.json";
    const fullPath = path.join(app.getAppPath(), dbPath);
  
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      const tasks = data.length !== 0 ? JSON.parse(data) : [];
  
      // Find the highest ID and increment it for the new task
      const lastTaskId = tasks.length > 0 ? tasks[tasks.length - 1].id : 0;
      newTask.id = lastTaskId + 1;
  
      if (newTask.id && newTask.title && newTask.description && 
        (newTask.completed === true || newTask.completed === false)) {
        tasks.push(newTask);
        fs.writeFileSync(fullPath, JSON.stringify(tasks, null, 2), 'utf-8');
        console.log(tasks);
        return newTask;
      } else {
        return false;
      }
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      newTask.id = 1;
      fs.writeFileSync(fullPath, JSON.stringify([newTask], null, 2), 'utf-8');
      return newTask;
    }
  })

  ipcMain.handle('update-task', (event, updatedTask) => {
    event.preventDefault();
    
    const dbPath = isDev() ? "src/electron/db/tasks.json" : "db/tasks.json";
    const fullPath = path.join(app.getAppPath(), dbPath);
  
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      const tasks = data.length !== 0 ? JSON.parse(data) : [];
  
      // Find the task by ID and update it
      const taskIndex = tasks.findIndex((task:Task) => task.id === updatedTask.id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
        fs.writeFileSync(fullPath, JSON.stringify(tasks, null, 2), 'utf-8');
        console.log(tasks);
        return updatedTask;
      } else {
        return false;
      }
    } else {
      return false;
    }
  })

  ipcMain.handle('remember-components-offset', (event, offsets) => {
    event.preventDefault();

    const dbPath = isDev() ? "src/electron/db/offset.json" : "db/offset.json";
    const fullPath = path.join(app.getAppPath(), dbPath);
  
    let existingOffsets = { formOffset: [0, 0], tasksListOffset: [0, 0] };
  
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      if (data.length !== 0) {
        existingOffsets = JSON.parse(data);
      }
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    }
  
    const updatedOffsets = { ...existingOffsets, ...offsets };
    fs.writeFileSync(fullPath, JSON.stringify(updatedOffsets, null, 2), 'utf-8');
    return updatedOffsets;
  });
  
  ipcMain.handle('get-components-offset', () => {
    const dbPath = isDev() ? "src/electron/db/offset.json" : "db/offset.json";
    const fullPath = path.join(app.getAppPath(), dbPath);
  
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      if (data.length !== 0) {
        return JSON.parse(data);
      } else {
        return { formOffset: [0, 0], tasksListOffset: [0, 0] };
      }
    } else {
      return { formOffset: [0, 0], tasksListOffset: [0, 0] };
    }
  });
})
