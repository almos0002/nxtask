export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskCategory = 
  | 'work'
  | 'personal'
  | 'shopping'
  | 'health'
  | 'finance'
  | 'education'
  | 'home'
  | 'meetings'
  | 'travel'
  | 'social'
  | 'projects'
  | 'other'
  | string; // Allow custom categories

export type RecurrencePattern = 
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'monthly'
  | 'yearly';

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface RecurrenceRule {
  pattern: RecurrencePattern;
  selectedDays?: WeekDay[];
  interval?: number;
  endDate?: string;
  occurrences?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  reminderTime?: string;
  tags?: string[];
  recurrence?: RecurrenceRule;
  customCategory?: boolean;
}

export type TaskSortOption = 'dueDate' | 'priority' | 'createdAt' | 'title';
export type TaskFilterOption = 'all' | 'completed' | 'incomplete' | TaskCategory;

export interface TaskFilter {
  search: string;
  sortBy: TaskSortOption;
  filterBy: TaskFilterOption;
}

export interface TaskStatistics {
  total: number;
  completed: number;
  incomplete: number;
  byPriority: Record<TaskPriority, number>;
  byCategory: Record<TaskCategory, number>;
  completionRate: number;
  averageCompletionTime?: number;
}