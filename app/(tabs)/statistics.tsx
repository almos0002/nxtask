import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { useTaskContext } from '@/context/TaskContext';
import { Header } from '@/components/Header';
import { TaskCategory, TaskPriority } from '@/types/task';
import {
  differenceInDays,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  ChartPie as PieChart,
  ChartBar as BarChart,
  SquareCheck as CheckSquare,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Target,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Trophy,
  Zap,
  Star,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_PADDING * 2) - (CARD_MARGIN * 2)) / 2;

export default function StatisticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  const { tasks } = useTaskContext();
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<'week' | 'month' | 'all'>('week');
  const [barHeights] = React.useState(new Animated.Value(0));
  
  const timeframes = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ];

  React.useEffect(() => {
    Animated.spring(barHeights, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [selectedTimeframe]);

  const calculateStreak = (tasks: typeof tasks) => {
    const today = new Date();
    let currentStreak = 0;
    let date = today;

    while (true) {
      const hasCompletedTask = tasks.some(task => {
        if (!task.completed || !task.completedAt) return false;
        return isSameDay(new Date(task.completedAt), date);
      });

      if (!hasCompletedTask) break;
      currentStreak++;
      date = new Date(date.setDate(date.getDate() - 1));
    }

    return currentStreak;
  };

  const stats = React.useMemo(() => {
    const now = new Date();
    const completed = tasks.filter(t => t.completed);
    const incomplete = tasks.filter(t => !t.completed);
    
    const filterByTimeframe = (taskList: typeof tasks) => {
      if (selectedTimeframe === 'week') {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return taskList.filter(task => {
          const taskDate = new Date(task.createdAt);
          return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
        });
      } else if (selectedTimeframe === 'month') {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return taskList.filter(task => {
          const taskDate = new Date(task.createdAt);
          return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
        });
      }
      return taskList;
    };

    const filteredTasks = filterByTimeframe(tasks);
    const filteredCompleted = filterByTimeframe(completed);
    
    const previousPeriodTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      if (selectedTimeframe === 'week') {
        const previousWeekStart = startOfWeek(new Date(now.setDate(now.getDate() - 7)), { weekStartsOn: 1 });
        const previousWeekEnd = endOfWeek(new Date(now.setDate(now.getDate() - 7)), { weekStartsOn: 1 });
        return isWithinInterval(taskDate, { start: previousWeekStart, end: previousWeekEnd });
      } else if (selectedTimeframe === 'month') {
        const previousMonthStart = startOfMonth(new Date(now.setMonth(now.getMonth() - 1)));
        const previousMonthEnd = endOfMonth(new Date(now.setMonth(now.getMonth() - 1)));
        return isWithinInterval(taskDate, { start: previousMonthStart, end: previousMonthEnd });
      }
      return true;
    });

    const currentCompletionRate = filteredCompleted.length > 0 
      ? (filteredCompleted.length / filteredTasks.length) * 100 
      : 0;
    
    const previousCompletionRate = previousPeriodTasks.length > 0
      ? (previousPeriodTasks.filter(t => t.completed).length / previousPeriodTasks.length) * 100
      : 0;

    const completionRateTrend = currentCompletionRate - previousCompletionRate;

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(now, { weekStartsOn: 1 }) });
    
    const dailyStats = weekDays.map(day => {
      const dayTasks = tasks.filter(task => {
        const completedDate = task.completed ? new Date(task.completedAt || '') : null;
        return completedDate && isSameDay(completedDate, day);
      });
      return {
        date: format(day, 'EEE'),
        count: dayTasks.length,
      };
    });

    const averageCompletionTime = completed.length > 0
      ? completed.reduce((sum, task) => {
          const completionTime = differenceInDays(
            new Date(task.completedAt || new Date()),
            new Date(task.createdAt)
          );
          return sum + completionTime;
        }, 0) / completed.length
      : 0;

    const productivityScore = completed.length === 0 ? 0 : Math.min(
      Math.round(
        (currentCompletionRate * 0.4) +
        (Math.min(completed.length, 10) * 5) +
        (Math.max(0, 5 - averageCompletionTime) * 4)
      ),
      100
    );

    const byPriority = filteredTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);

    const byCategory = filteredTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<TaskCategory, number>);

    const overdueTasks = incomplete.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });

    const streak = calculateStreak(tasks);

    return {
      total: filteredTasks.length,
      completed: filteredCompleted.length,
      incomplete: filteredTasks.length - filteredCompleted.length,
      byPriority,
      byCategory,
      completionRate: currentCompletionRate,
      completionRateTrend,
      averageCompletionTime,
      productivityScore,
      dailyStats,
      overdueTasks: overdueTasks.length,
      streak,
    };
  }, [tasks, selectedTimeframe]);

  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    trend?: number,
    color?: string
  ) => (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={styles.metricIcon}>{icon}</View>
        <Text
          style={[
            styles.metricTitle,
            { color: colors.textSecondary, fontFamily: 'Poppins-Medium' },
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.metricContent}>
        <Text
          style={[
            styles.metricValue,
            {
              color: color || colors.text,
              fontFamily: 'Poppins-Bold',
            },
          ]}
        >
          {value}
        </Text>
        {trend !== undefined && (
          <View
            style={[
              styles.trendContainer,
              {
                backgroundColor:
                  trend > 0
                    ? colors.success + '20'
                    : trend < 0
                    ? colors.error + '20'
                    : colors.textSecondary + '20',
              },
            ]}
          >
            {trend > 0 ? (
              <ArrowUpRight size={14} color={colors.success} />
            ) : (
              <ArrowDownRight size={14} color={colors.error} />
            )}
            <Text
              style={[
                styles.trendText,
                {
                  color: trend > 0 ? colors.success : colors.error,
                  fontFamily: 'Poppins-Medium',
                },
              ]}
            >
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header title="Statistics" />
      
      <ScrollView style={styles.content}>
        <View style={styles.timeframeContainer}>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe.value}
              style={[
                styles.timeframeButton,
                {
                  backgroundColor:
                    selectedTimeframe === timeframe.value
                      ? colors.primary
                      : isDark
                      ? colors.backgroundSecondary
                      : '#F0F0F5',
                },
              ]}
              onPress={() => setSelectedTimeframe(timeframe.value as typeof selectedTimeframe)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  {
                    color:
                      selectedTimeframe === timeframe.value
                        ? '#FFFFFF'
                        : colors.textSecondary,
                    fontFamily:
                      selectedTimeframe === timeframe.value
                        ? 'Poppins-Medium'
                        : 'Poppins-Regular',
                  },
                ]}
              >
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.highlightSection}>
          <View
            style={[
              styles.productivityCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.productivityContent}>
              <View style={styles.productivityHeader}>
                <Target size={24} color={colors.primary} />
                <Text
                  style={[
                    styles.productivityTitle,
                    { color: colors.text, fontFamily: 'Poppins-SemiBold' },
                  ]}
                >
                  Productivity Score
                </Text>
              </View>
              <Text
                style={[
                  styles.productivityScore,
                  { color: colors.primary, fontFamily: 'Poppins-Bold' },
                ]}
              >
                {stats.productivityScore}
              </Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: barHeights.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${stats.productivityScore}%`],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.streakContainer}>
              <View style={styles.streakContent}>
                <Trophy size={20} color={colors.warning} />
                <Text
                  style={[
                    styles.streakText,
                    { color: colors.text, fontFamily: 'Poppins-Medium' },
                  ]}
                >
                  {stats.streak} Day Streak
                </Text>
              </View>
              <View style={styles.sparklesContainer}>
                {[...Array(3)].map((_, i) => (
                  <Sparkles
                    key={i}
                    size={16}
                    color={colors.warning}
                    style={{ opacity: 0.8 - i * 0.2 }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {renderMetricCard(
            <TrendingUp size={24} color={colors.primary} />,
            'Completion Rate',
            `${stats.completionRate.toFixed(1)}%`,
            stats.completionRateTrend,
            colors.primary
          )}
          
          {renderMetricCard(
            <Timer size={24} color={colors.warning} />,
            'Avg. Completion Time',
            `${stats.averageCompletionTime.toFixed(1)} days`,
            undefined,
            colors.warning
          )}
          
          {renderMetricCard(
            <CheckSquare size={24} color={colors.success} />,
            'Completed Tasks',
            stats.completed,
            undefined,
            colors.success
          )}
          
          {renderMetricCard(
            <Calendar size={24} color={colors.error} />,
            'Overdue Tasks',
            stats.overdueTasks,
            undefined,
            colors.error
          )}
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Daily Activity
          </Text>
          <View
            style={[
              styles.chart,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.barChart}>
              {stats.dailyStats.map((day, index) => {
                const maxCount = Math.max(...stats.dailyStats.map(d => d.count));
                const heightPercentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                
                return (
                  <View key={day.date} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <Animated.View
                        style={[
                          styles.bar,
                          {
                            height: barHeights.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', `${heightPercentage}%`],
                            }),
                            backgroundColor: colors.primary,
                            opacity: 0.8 + (index * 0.05),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
                      ]}
                    >
                      {day.date}
                    </Text>
                    <Text
                      style={[
                        styles.barValue,
                        { color: colors.text, fontFamily: 'Poppins-Medium' },
                      ]}
                    >
                      {day.count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Tasks by Priority
          </Text>
          <View
            style={[
              styles.chart,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.priorityBars}>
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <View key={priority} style={styles.priorityBar}>
                  <View style={styles.priorityLabel}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: colors.priority[priority as TaskPriority] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: colors.text, fontFamily: 'Poppins-Medium' },
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                    <Text
                      style={[
                        styles.priorityCount,
                        { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
                      ]}
                    >
                      {count} tasks
                    </Text>
                  </View>
                  <View style={styles.priorityBarContainer}>
                    <Animated.View
                      style={[
                        styles.priorityBarFill,
                        {
                          backgroundColor: colors.priority[priority as TaskPriority],
                          width: barHeights.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${(count / stats.total) * 100}%`],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Tasks by Category
          </Text>
          <View
            style={[
              styles.chart,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ScrollView>
              {Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryLabel}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          { color: colors.text, fontFamily: 'Poppins-Medium' },
                        ]}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.categoryCount,
                        { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
                      ]}
                    >
                      {count} tasks ({((count / stats.total) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
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
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 13,
  },
  highlightSection: {
    padding: 16,
  },
  productivityCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  productivityContent: {
    marginBottom: 16,
  },
  productivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productivityTitle: {
    fontSize: 18,
    marginLeft: 12,
  },
  productivityScore: {
    fontSize: 48,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Platform.select({ web: 'rgba(0,0,0,0.1)', default: 'rgba(0,0,0,0.05)' }),
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 14,
  },
  sparklesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 16,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  metricCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    height: 120,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 'auto',
  },
  metricIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 13,
    flex: 1,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 32,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  chart: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  barChart: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: 24,
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  barValue: {
    marginTop: 4,
    fontSize: 12,
  },
  priorityBars: {
    gap: 16,
  },
  priorityBar: {
    gap: 8,
  },
  priorityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 14,
    flex: 1,
  },
  priorityCount: {
    fontSize: 13,
  },
  priorityBarContainer: {
    height: 8,
    backgroundColor: Platform.select({ web: 'rgba(0,0,0,0.03)', default: 'rgba(0,0,0,0.02)' }),
    borderRadius: 4,
    overflow: 'hidden',
  },
  priorityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 14,
  },
  categoryCount: {
    fontSize: 14,
  },
});