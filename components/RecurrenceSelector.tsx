import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { RecurrencePattern, RecurrenceRule, WeekDay } from '@/types/task';
import { Repeat, Calendar, CalendarDays } from 'lucide-react-native';

interface RecurrenceSelectorProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  value,
  onChange,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];

  const patterns: { label: string; value: RecurrencePattern; icon: any }[] = [
    { label: 'None', value: 'none', icon: Calendar },
    { label: 'Daily', value: 'daily', icon: Repeat },
    { label: 'Weekdays', value: 'weekdays', icon: CalendarDays },
    { label: 'Weekends', value: 'weekends', icon: CalendarDays },
    { label: 'Weekly', value: 'weekly', icon: CalendarDays },
    { label: 'Monthly', value: 'monthly', icon: CalendarDays },
    { label: 'Yearly', value: 'yearly', icon: CalendarDays },
  ];

  const weekDays: { label: string; value: WeekDay }[] = [
    { label: 'Mon', value: 'mon' },
    { label: 'Tue', value: 'tue' },
    { label: 'Wed', value: 'wed' },
    { label: 'Thu', value: 'thu' },
    { label: 'Fri', value: 'fri' },
    { label: 'Sat', value: 'sat' },
    { label: 'Sun', value: 'sun' },
  ];

  const handlePatternChange = (pattern: RecurrencePattern) => {
    const newRule: RecurrenceRule = { pattern };
    
    if (pattern === 'weekly') {
      newRule.selectedDays = ['mon'];
    }
    
    onChange(newRule);
  };

  const toggleWeekDay = (day: WeekDay) => {
    if (!value.selectedDays) return;
    
    const newSelectedDays = value.selectedDays.includes(day)
      ? value.selectedDays.filter(d => d !== day)
      : [...value.selectedDays, day];
    
    onChange({
      ...value,
      selectedDays: newSelectedDays.length > 0 ? newSelectedDays : ['mon'],
    });
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          { color: colors.text, fontFamily: 'Poppins-Medium' },
        ]}
      >
        Repeat
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.patternsContainer}
      >
        {patterns.map((pattern) => {
          const Icon = pattern.icon;
          const isSelected = value.pattern === pattern.value;
          
          return (
            <TouchableOpacity
              key={pattern.value}
              style={[
                styles.patternOption,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '20'
                    : colors.card,
                  borderColor: isSelected
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => handlePatternChange(pattern.value)}
            >
              <Icon
                size={16}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.patternText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontFamily: isSelected
                      ? 'Poppins-Medium'
                      : 'Poppins-Regular',
                  },
                ]}
              >
                {pattern.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {value.pattern === 'weekly' && (
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayOption,
                {
                  backgroundColor: value.selectedDays?.includes(day.value)
                    ? colors.primary
                    : colors.card,
                  borderColor: value.selectedDays?.includes(day.value)
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => toggleWeekDay(day.value)}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color: value.selectedDays?.includes(day.value)
                      ? '#FFFFFF'
                      : colors.text,
                    fontFamily: value.selectedDays?.includes(day.value)
                      ? 'Poppins-Medium'
                      : 'Poppins-Regular',
                  },
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  patternsContainer: {
    paddingVertical: 8,
  },
  patternOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  patternText: {
    fontSize: 14,
    marginLeft: 6,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 12,
  },
});