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
  listId: number;
}

interface TaskList {
  id: number;
  name: string;
  tasks: Task[];
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

  ipcMain.handle('get-task-lists', () => {
    const dbPath = path.join(app.getAppPath(), isDev() ? "src/electron/db/taskLists.json" : "db/taskLists.json");

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
  });

  ipcMain.handle('create-task-list', (event, listName) => {
    const dbPath = isDev() ? "src/electron/db/taskLists.json" : "db/taskLists.json";
    const fullPath = path.join(app.getAppPath(), dbPath);

    let taskLists: TaskList[] = [];

    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      taskLists = data.length !== 0 ? JSON.parse(data) : [];
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    }

    const newList: TaskList = {
      id: taskLists.length > 0 ? taskLists[taskLists.length - 1].id + 1 : 1,
      name: listName,
      tasks: []
    };

    taskLists.push(newList);
    fs.writeFileSync(fullPath, JSON.stringify(taskLists, null, 2), 'utf-8');
    return newList;
  });

  ipcMain.handle('insert-task', (event, newTask) => {
    const dbPath = isDev() ? "src/electron/db/taskLists.json" : "db/taskLists.json";
    const fullPath = path.join(app.getAppPath(), dbPath);

    let taskLists: TaskList[] = [];

    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      taskLists = data.length !== 0 ? JSON.parse(data) : [];
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    }

    const listIndex = taskLists.findIndex(list => list.id === newTask.listId);
    if (listIndex !== -1) {
      const lastTaskId = taskLists[listIndex].tasks.length > 0 ? taskLists[listIndex].tasks[taskLists[listIndex].tasks.length - 1].id : 0;
      newTask.id = lastTaskId + 1;
      taskLists[listIndex].tasks.push(newTask);
      fs.writeFileSync(fullPath, JSON.stringify(taskLists, null, 2), 'utf-8');
      return newTask;
    } else {
      return false;
    }
  });

  ipcMain.handle('update-task', (event, updatedTask) => {
    const dbPath = isDev() ? "src/electron/db/taskLists.json" : "db/taskLists.json";
    const fullPath = path.join(app.getAppPath(), dbPath);

    let taskLists: TaskList[] = [];

    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, 'utf-8').trim();
      taskLists = data.length !== 0 ? JSON.parse(data) : [];
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    }

    const listIndex = taskLists.findIndex(list => list.id === updatedTask.listId);
    if (listIndex !== -1) {
      const taskIndex = taskLists[listIndex].tasks.findIndex(task => task.id === updatedTask.id);
      if (taskIndex !== -1) {
        taskLists[listIndex].tasks[taskIndex] = updatedTask;
        fs.writeFileSync(fullPath, JSON.stringify(taskLists, null, 2), 'utf-8');
        return updatedTask;
      } else {
        return false;
      }
    } else {
      return false;
    }
  });

  ipcMain.handle('remember-components-offset', (event, offsets) => {
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
});
