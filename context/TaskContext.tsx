import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskFilter, TaskSortOption, TaskFilterOption, TaskCategory } from '@/types/task';
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Predefined category colors
export const categoryColors = {
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  mint: '#00C7BE',
  teal: '#30B0C7',
  cyan: '#32ADE6',
  blue: '#007AFF',
  indigo: '#5856D6',
  purple: '#AF52DE',
};

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, updatedTask: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  filter: TaskFilter;
  setFilter: React.Dispatch<React.SetStateAction<TaskFilter>>;
  filteredTasks: Task[];
  customCategories: { name: string; color: string }[];
  addCustomCategory: (category: string, color: string) => void;
  removeUnusedCategories: () => void;
}

const defaultFilter: TaskFilter = {
  search: '',
  sortBy: 'dueDate',
  filterBy: 'all',
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>(defaultFilter);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customCategories, setCustomCategories] = useState<{ name: string; color: string }[]>([]);

  // Initial setup
  useEffect(() => {
    registerForPushNotificationsAsync();
    loadTasks();
    loadCustomCategories();
  }, []);

  // Save tasks and schedule notifications when tasks change
  useEffect(() => {
    if (isInitialized) {
      saveTasks();
      scheduleNotifications();
      removeUnusedCategories();
    }
  }, [tasks, isInitialized]);

  // Save custom categories when they change
  useEffect(() => {
    if (isInitialized) {
      saveCustomCategories();
    }
  }, [customCategories, isInitialized]);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return;
    }
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async function scheduleNotifications() {
    if (Platform.OS === 'web') return;
    
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    for (const task of tasks) {
      if (!task.completed && task.reminderTime) {
        const reminderDate = new Date(task.reminderTime);
        if (reminderDate > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Reminder: ${task.title}`,
              body: task.description || 'It\'s time for this task!',
              data: { taskId: task.id },
            },
            trigger: reminderDate,
          });
        }
      }
    }
  }

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('@tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('@tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const loadCustomCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem('@customCategories');
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const saveCustomCategories = async () => {
    try {
      await AsyncStorage.setItem('@customCategories', JSON.stringify(customCategories));
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  };

  const addCustomCategory = (category: string, color: string) => {
    if (!customCategories.find(c => c.name === category)) {
      setCustomCategories(prev => [...prev, { name: category, color }]);
    }
  };

  const removeUnusedCategories = () => {
    const usedCategories = new Set(tasks.map(task => task.category));
    setCustomCategories(prev => prev.filter(cat => usedCategories.has(cat.name)));
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>): Promise<void> => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updatedTask } : task))
    );
  };

  const deleteTask = async (id: string): Promise<void> => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const toggleTaskCompletion = async (id: string): Promise<void> => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((task) => task.id === id);
  };

  const getFilteredTasks = (): Task[] => {
    let result = [...tasks];

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    if (filter.filterBy !== 'all') {
      if (filter.filterBy === 'completed') {
        result = result.filter((task) => task.completed);
      } else if (filter.filterBy === 'incomplete') {
        result = result.filter((task) => !task.completed);
      } else {
        result = result.filter((task) => task.category === filter.filterBy);
      }
    }

    result.sort((a, b) => {
      switch (filter.sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  };

  const filteredTasks = getFilteredTasks();

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        getTaskById,
        filter,
        setFilter,
        filteredTasks,
        customCategories,
        addCustomCategory,
        removeUnusedCategories,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};