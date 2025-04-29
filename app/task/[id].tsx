import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { useTaskContext } from '@/context/TaskContext';
import { Header } from '@/components/Header';
import { Task, TaskPriority, TaskCategory } from '@/types/task';
import { RecurrenceSelector } from '@/components/RecurrenceSelector';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Trash2, Calendar, Clock, CircleCheck as CheckCircle2, Circle, Tag, CircleAlert as AlertCircle, Repeat } from 'lucide-react-native';
import { format } from 'date-fns';

const priorityOptions: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#34C759' },
  { label: 'Medium', value: 'medium', color: '#FF9500' },
  { label: 'High', value: 'high', color: '#FF3B30' },
];

const categoryOptions: { label: string; value: TaskCategory }[] = [
  { label: 'Personal', value: 'personal' },
  { label: 'Work', value: 'work' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Health', value: 'health' },
  { label: 'Finance', value: 'finance' },
  { label: 'Education', value: 'education' },
  { label: 'Home', value: 'home' },
  { label: 'Other', value: 'other' },
];

const getCategoryColor = (category: TaskCategory): string => {
  switch (category) {
    case 'personal': return '#FF9500';
    case 'work': return '#007AFF';
    case 'shopping': return '#5856D6';
    case 'health': return '#34C759';
    case 'finance': return '#FF2D55';
    case 'education': return '#5856D6';
    case 'home': return '#FF9500';
    default: return '#8E8E93';
  }
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  const { getTaskById, updateTask, deleteTask, toggleTaskCompletion } = useTaskContext();
  
  const task = getTaskById(id);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setCategory(task.category);
      setIsCompleted(task.completed);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setReminderTime(task.reminderTime ? new Date(task.reminderTime) : null);
    }
  }, [task]);
  
  const handleSave = async () => {
    if (!title.trim() || !task) return;
    
    await updateTask(task.id, {
      title,
      description: description || undefined,
      priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      reminderTime: reminderTime ? reminderTime.toISOString() : undefined,
    });
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(id);
        router.back();
      }
    } else {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: () => {
              deleteTask(id);
              router.back();
            },
            style: 'destructive',
          },
        ]
      );
    }
  };
  
  const handleToggleComplete = async () => {
    if (!task) return;
    
    await toggleTaskCompletion(task.id);
    setIsCompleted(!isCompleted);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const onChangeDueDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate || new Date();
    setShowDueDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };
  
  const onChangeReminderTime = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || reminderTime || new Date();
    setShowTimePicker(Platform.OS === 'ios');
    setReminderTime(currentDate);
  };

  const renderHeaderRight = () => (
    <View style={styles.headerButtons}>
      {isEditing ? (
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text
            style={[
              styles.headerButtonText,
              { color: colors.primary, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={styles.headerButton}
        >
          <Text
            style={[
              styles.headerButtonText,
              { color: colors.primary, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Edit
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Task Not Found" showBackButton />
        <View style={styles.notFound}>
          <Text style={{ color: colors.text }}>
            The task you're looking for doesn't exist.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header
        title={isEditing ? 'Edit Task' : task.title}
        showBackButton
        rightComponent={renderHeaderRight()}
      />
      
      <ScrollView style={styles.content}>
        {isEditing ? (
          <>
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    fontFamily: 'Poppins-Regular',
                  },
                ]}
                placeholder="Task title"
                placeholderTextColor={colors.placeholder}
                value={title}
                onChangeText={setTitle}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                Description (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    fontFamily: 'Poppins-Regular',
                  },
                ]}
                placeholder="Task description"
                placeholderTextColor={colors.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                Priority
              </Text>
              <View style={styles.optionsContainer}>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priorityOption,
                      {
                        borderColor:
                          priority === option.value ? option.color : colors.border,
                        backgroundColor:
                          priority === option.value
                            ? option.color + '20'
                            : colors.card,
                      },
                    ]}
                    onPress={() => setPriority(option.value)}
                  >
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: option.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: colors.text,
                          fontFamily:
                            priority === option.value
                              ? 'Poppins-Medium'
                              : 'Poppins-Regular',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryContainer}
              >
                {categoryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.categoryOption,
                      {
                        borderColor:
                          category === option.value ? colors.primary : colors.border,
                        backgroundColor:
                          category === option.value
                            ? colors.primary + '20'
                            : colors.card,
                      },
                    ]}
                    onPress={() => setCategory(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: colors.text,
                          fontFamily:
                            category === option.value
                              ? 'Poppins-Medium'
                              : 'Poppins-Regular',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                Due Date (Optional)
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    {
                      color: dueDate ? colors.text : colors.placeholder,
                      fontFamily: 'Poppins-Regular',
                    },
                  ]}
                >
                  {dueDate ? format(dueDate, 'EEEE, MMMM d') : 'Select due date'}
                </Text>
              </TouchableOpacity>
              
              {showDueDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeDueDate}
                />
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                Reminder (Optional)
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    {
                      color: reminderTime ? colors.text : colors.placeholder,
                      fontFamily: 'Poppins-Regular',
                    },
                  ]}
                >
                  {reminderTime
                    ? format(reminderTime, 'h:mm a')
                    : 'Select reminder time'}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={reminderTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={onChangeReminderTime}
                />
              )}
            </View>
          </>
        ) : (
          <>
            <View
              style={[
                styles.taskHeader,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.titleContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border }
                  ]}
                  onPress={handleToggleComplete}
                >
                  {isCompleted ? (
                    <CheckCircle2 color={colors.primary} size={24} />
                  ) : (
                    <Circle color={colors.textSecondary} size={24} />
                  )}
                </TouchableOpacity>
                
                <Text
                  style={[
                    styles.taskTitle,
                    {
                      color: colors.text,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                      fontFamily: isCompleted ? 'Poppins-Regular' : 'Poppins-Medium',
                    },
                  ]}
                >
                  {task.title}
                </Text>
              </View>
              
              <View style={styles.badges}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: colors.priority[priority] + '20' },
                  ]}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: colors.priority[priority] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: colors.priority[priority] },
                    ]}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </View>
                
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(task.category) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: getCategoryColor(task.category) },
                    ]}
                  >
                    {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.dateTimeContainer}>
                {task.dueDate && (
                  <View style={styles.metaItem}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {format(new Date(task.dueDate), 'EEEE, MMMM d')}
                    </Text>
                  </View>
                )}
                
                {task.reminderTime && (
                  <View style={styles.metaItem}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {format(new Date(task.reminderTime), 'h:mm a')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {description && (
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Description
                </Text>
                <Text
                  style={[
                    styles.description,
                    { color: colors.text },
                  ]}
                >
                  {description}
                </Text>
              </View>
            )}
            
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.textSecondary },
                ]}
              >
                Details
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Status
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isCompleted
                        ? colors.success + '10'
                        : colors.warning + '10',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isCompleted ? colors.success : colors.warning,
                      },
                    ]}
                  >
                    {isCompleted ? 'Completed' : 'In Progress'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Created
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {format(new Date(task.createdAt), 'MMM d, yyyy')}
                </Text>
              </View>
              
              {dueDate && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Due Date
                  </Text>
                  <View style={styles.detailWithIcon}>
                    <Calendar size={14} color={colors.text} style={styles.detailIcon} />
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {format(dueDate, 'EEEE, MMMM d')}
                    </Text>
                  </View>
                </View>
              )}
              
              {reminderTime && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Reminder
                  </Text>
                  <View style={styles.detailWithIcon}>
                    <Clock size={14} color={colors.text} style={styles.detailIcon} />
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {format(reminderTime, 'h:mm a')}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: isDark ? colors.backgroundSecondary : '#FEE2E2' },
              ]}
              onPress={handleDelete}
            >
              <Trash2 color={colors.error} size={18} />
              <Text
                style={[
                  styles.deleteButtonText,
                  { color: colors.error },
                ]}
              >
                Delete Task
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
  },
  categoryContainer: {
    paddingVertical: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  dateButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
  },
  taskHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 18,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  detailWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  deleteButtonText: {
    fontSize: 15,
    marginLeft: 8,
    fontFamily: 'Poppins-Medium',
  },
});