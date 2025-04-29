import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { useTaskContext, categoryColors } from '@/context/TaskContext';
import { Header } from '@/components/Header';
import { Task, TaskPriority, TaskCategory, RecurrenceRule } from '@/types/task';
import { RecurrenceSelector } from '@/components/RecurrenceSelector';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

export default function CreateTaskScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  const { addTask, customCategories, addCustomCategory } = useTaskContext();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({ pattern: 'none' });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(Object.values(categoryColors)[0]);
  
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const handleSave = async () => {
    if (!title.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!category && !isCustomCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (isCustomCategory && !customCategoryInput.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    let finalCategory = category;
    if (isCustomCategory) {
      finalCategory = customCategoryInput.toLowerCase();
      addCustomCategory(finalCategory, selectedColor);
    }
    
    await addTask({
      title,
      description,
      priority,
      category: finalCategory,
      completed: false,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      reminderTime: reminderTime ? reminderTime.toISOString() : undefined,
      recurrence: recurrence.pattern === 'none' ? undefined : recurrence,
    });
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    router.back();
  };
  
  const priorityOptions: { label: string; value: TaskPriority; color: string }[] = [
    { label: 'Low', value: 'low', color: colors.priority.low },
    { label: 'Medium', value: 'medium', color: colors.priority.medium },
    { label: 'High', value: 'high', color: colors.priority.high },
  ];
  
  const categoryOptions = [
    { label: 'Personal', value: 'personal' },
    { label: 'Work', value: 'work' },
    ...customCategories.map(cat => ({
      label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      value: cat.name,
      color: cat.color,
    })),
  ];
  
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

  const renderSaveButton = () => (
    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
      <Text
        style={[
          styles.saveButtonText,
          { color: colors.primary, fontFamily: 'Poppins-SemiBold' },
        ]}
      >
        Save
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header title="Create Task" showBackButton rightComponent={renderSaveButton()} />
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontFamily: 'Poppins-Medium' },
            ]}
          >
            Title *
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
            Category *
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
                      category === option.value && !isCustomCategory
                        ? option.color || colors.primary
                        : colors.border,
                    backgroundColor:
                      category === option.value && !isCustomCategory
                        ? (option.color || colors.primary) + '20'
                        : colors.card,
                  },
                ]}
                onPress={() => {
                  setCategory(option.value);
                  setIsCustomCategory(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: colors.text,
                      fontFamily:
                        category === option.value && !isCustomCategory
                          ? 'Poppins-Medium'
                          : 'Poppins-Regular',
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  borderColor: isCustomCategory ? selectedColor : colors.border,
                  backgroundColor: isCustomCategory ? selectedColor + '20' : colors.card,
                },
              ]}
              onPress={() => {
                setIsCustomCategory(true);
                setCategory('');
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: colors.text,
                    fontFamily: isCustomCategory ? 'Poppins-Medium' : 'Poppins-Regular',
                  },
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          {isCustomCategory && (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    fontFamily: 'Poppins-Regular',
                    marginTop: 8,
                  },
                ]}
                placeholder="Enter custom category"
                placeholderTextColor={colors.placeholder}
                value={customCategoryInput}
                onChangeText={setCustomCategoryInput}
              />
              <View style={styles.colorGrid}>
                {Object.entries(categoryColors).map(([name, color]) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: color,
                        borderWidth: selectedColor === color ? 2 : 0,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </>
          )}
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
              {dueDate ?
                format(dueDate, 'EEEE, MMMM d') :
                'Select due date'}
            </Text>
          </TouchableOpacity>
          
          {showDueDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={onChangeDueDate}
              minimumDate={new Date()}
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

        <RecurrenceSelector value={recurrence} onChange={setRecurrence} />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.cancelButtonText,
                { color: colors.text, fontFamily: 'Poppins-Medium' },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary },
              (!title.trim() || (!category && !isCustomCategory)) && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={!title.trim() || (!category && !isCustomCategory)}
          >
            <Text
              style={[
                styles.createButtonText,
                { color: '#FFFFFF', fontFamily: 'Poppins-Medium' },
              ]}
            >
              Create Task
            </Text>
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  createButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    fontSize: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});