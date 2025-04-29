import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { useTaskContext } from '@/context/TaskContext';
import { TaskItem } from '@/components/TaskItem';
import { EmptyState } from '@/components/EmptyState';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';
import { Header } from '@/components/Header';
import { format, isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import * as Haptics from 'expo-haptics';

export default function TasksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  const {
    filteredTasks,
    toggleTaskCompletion,
    deleteTask,
    filter,
    setFilter,
  } = useTaskContext();
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  
  const handleToggleComplete = (id: string) => {
    toggleTaskCompletion(id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  const handleCreateTask = () => {
    router.push('/task/create');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const tasksByDate = React.useMemo(() => {
    const grouped: Record<string, typeof filteredTasks> = {
      'Today': [],
      'Tomorrow': [],
      'This Week': [],
      'Later': [],
      'No Due Date': [],
      'Completed': [],
    };
    
    filteredTasks.forEach(task => {
      if (task.completed) {
        grouped['Completed'].push(task);
        return;
      }
      
      if (!task.dueDate) {
        grouped['No Due Date'].push(task);
        return;
      }
      
      const dueDate = new Date(task.dueDate);
      
      if (isToday(dueDate)) {
        grouped['Today'].push(task);
      } else if (isTomorrow(dueDate)) {
        grouped['Tomorrow'].push(task);
      } else if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
        grouped['This Week'].push(task);
      } else {
        grouped['Later'].push(task);
      }
    });
    
    // Remove empty sections
    return Object.entries(grouped).filter(([_, tasks]) => tasks.length > 0);
  }, [filteredTasks]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header title="My Tasks" />
      
      <SearchBar
        value={filter.search}
        onChangeText={(text) => setFilter(prev => ({ ...prev, search: text }))}
      />
      
      <FilterBar
        currentFilter={filter.filterBy}
        currentSort={filter.sortBy}
        onFilterChange={(filterBy) => setFilter(prev => ({ ...prev, filterBy }))}
        onSortChange={(sortBy) => setFilter(prev => ({ ...prev, sortBy }))}
      />
      
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          message={
            filter.search || filter.filterBy !== 'all'
              ? "Try changing your filters or creating a new task"
              : "You don't have any tasks yet. Tap the + button to create a new task."
          }
        />
      ) : (
        <FlatList
          data={tasksByDate}
          keyExtractor={([section]) => section}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item: [section, tasks] }) => (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: 'Poppins-Medium' },
                ]}
              >
                {section} ({tasks.length})
              </Text>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={deleteTask}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
      
      <FloatingActionButton onPress={handleCreateTask} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});