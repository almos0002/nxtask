import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Task } from '@/types/task';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { CircleCheck as CheckCircle2, Circle, Trash2, Calendar, Clock, Repeat } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTaskContext } from '@/context/TaskContext';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  const { customCategories } = useTaskContext();

  const getCategoryColor = (category: string) => {
    const customCategory = customCategories.find(c => c.name === category);
    return customCategory ? customCategory.color : colors.primary;
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<string | number>,
    dragX: Animated.AnimatedInterpolation<string | number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-80, -40, 0],
      outputRange: [1, 0.5, 0],
    });
    
    return (
      <Animated.View style={[styles.rightAction, { opacity }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => onDelete(task.id)}
        >
          <Trash2 color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/task/${task.id}`)}
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: task.completed ? 0.7 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.checkbox, { borderColor: colors.border }]}
          onPress={() => onToggleComplete(task.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {task.completed ? (
            <CheckCircle2 color={colors.primary} size={20} />
          ) : (
            <Circle color={colors.textSecondary} size={20} />
          )}
        </TouchableOpacity>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                  fontFamily: task.completed ? 'Poppins-Regular' : 'Poppins-Medium',
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.recurrence && (
              <Repeat size={14} color={colors.primary} style={styles.recurrenceIcon} />
            )}
          </View>
          
          {task.description ? (
            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}
          
          <View style={styles.metaContainer}>
            <View style={styles.badges}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: colors.priority[task.priority] + '20' },
                ]}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: colors.priority[task.priority] },
                  ]}
                />
                <Text
                  style={[
                    styles.priorityText,
                    { color: colors.priority[task.priority] },
                  ]}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
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
                    {format(new Date(task.dueDate), 'MMM d')}
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
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
    flex: 1,
  },
  recurrenceIcon: {
    marginLeft: 6,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
  },
  metaContainer: {
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  rightAction: {
    marginVertical: 6,
    marginRight: 16,
    justifyContent: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});