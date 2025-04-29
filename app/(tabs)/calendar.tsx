import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { useTaskContext } from '@/context/TaskContext';
import { TaskItem } from '@/components/TaskItem';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { addDays, format, isToday, startOfWeek, isSameDay, subDays, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const DAYS_TO_DISPLAY = 42; // Show 6 weeks worth of days

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  const { filteredTasks, toggleTaskCompletion, deleteTask } = useTaskContext();
  const scrollViewRef = useRef(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  
  const generateDays = useCallback((startDate: Date) => {
    const start = startOfWeek(startDate, { weekStartsOn: 1 });
    return Array(DAYS_TO_DISPLAY).fill(0).map((_, i) => addDays(start, i));
  }, []);

  const [days, setDays] = useState(() => generateDays(visibleMonth));
  
  const tasksForSelectedDate = React.useMemo(() => {
    return filteredTasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return isSameDay(dueDate, selectedDate);
    });
  }, [filteredTasks, selectedDate]);
  
  const handlePreviousMonth = () => {
    const newMonth = subMonths(visibleMonth, 1);
    setVisibleMonth(newMonth);
    setDays(generateDays(newMonth));
  };
  
  const handleNextMonth = () => {
    const newMonth = addMonths(visibleMonth, 1);
    setVisibleMonth(newMonth);
    setDays(generateDays(newMonth));
  };

  const renderDay = ({ item: date }) => {
    const dayNumber = format(date, 'd');
    const dayName = format(date, 'EEE');
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentDay = isToday(date);
    const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
    
    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayContainer,
          isSelected && {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          isCurrentDay && !isSelected && {
            borderColor: colors.primary,
          },
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text
          style={[
            styles.dayName,
            {
              color: isSelected
                ? '#FFFFFF'
                : isCurrentMonth
                ? colors.text
                : colors.textSecondary + '40',
              fontFamily: 'Poppins-Medium',
            },
          ]}
        >
          {dayName}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            {
              color: isSelected
                ? '#FFFFFF'
                : isCurrentMonth
                ? colors.text
                : colors.textSecondary + '40',
              fontFamily: isCurrentDay || isSelected ? 'Poppins-Bold' : 'Poppins-Regular',
            },
          ]}
        >
          {dayNumber}
        </Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header title="Calendar" />
      
      <View style={[styles.calendarHeader, { borderColor: colors.border }]}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={[
              styles.arrowButton,
              { backgroundColor: isDark ? colors.backgroundSecondary : '#F0F0F5' },
            ]}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          
          <Text
            style={[
              styles.monthTitle,
              { color: colors.text, fontFamily: 'Poppins-Medium' },
            ]}
          >
            {format(visibleMonth, 'MMMM yyyy')}
          </Text>
          
          <TouchableOpacity
            onPress={handleNextMonth}
            style={[
              styles.arrowButton,
              { backgroundColor: isDark ? colors.backgroundSecondary : '#F0F0F5' },
            ]}
          >
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          ref={scrollViewRef}
          data={days}
          renderItem={renderDay}
          keyExtractor={(date) => date.toISOString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekDaysContainer}
          getItemLayout={(data, index) => ({
            length: 56,
            offset: 56 * index,
            index,
          })}
          initialNumToRender={7}
          maxToRenderPerBatch={7}
          windowSize={7}
          decelerationRate="fast"
        />
      </View>
      
      <View style={styles.selectedDateHeader}>
        <Text
          style={[
            styles.selectedDateText,
            { color: colors.text, fontFamily: 'Poppins-SemiBold' },
          ]}
        >
          {format(selectedDate, 'EEEE, MMMM d')}
        </Text>
        <Text
          style={[
            styles.taskCountText,
            { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
          ]}
        >
          {tasksForSelectedDate.length}{' '}
          {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>
      
      {tasksForSelectedDate.length === 0 ? (
        <EmptyState
          title="No tasks for this day"
          message="You don't have any tasks scheduled for this day. Add a task with a due date to see it here."
        />
      ) : (
        <FlatList
          data={tasksForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggleComplete={toggleTaskCompletion}
              onDelete={deleteTask}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthTitle: {
    fontSize: 16,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayContainer: {
    width: 48,
    height: 72,
    borderRadius: 12,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectedDateText: {
    fontSize: 18,
  },
  taskCountText: {
    fontSize: 14,
  },
  list: {
    paddingBottom: 100,
  },
});