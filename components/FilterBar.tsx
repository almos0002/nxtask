import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { TaskFilterOption, TaskSortOption } from '@/types/task';
import { Filter } from 'lucide-react-native';
import { useTaskContext } from '@/context/TaskContext';

interface FilterBarProps {
  currentFilter: TaskFilterOption;
  currentSort: TaskSortOption;
  onFilterChange: (filter: TaskFilterOption) => void;
  onSortChange: (sort: TaskSortOption) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  currentSort,
  onFilterChange,
  onSortChange,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  const { customCategories } = useTaskContext();

  const filterOptions: { label: string; value: TaskFilterOption }[] = [
    { label: 'All', value: 'all' },
    { label: 'Incomplete', value: 'incomplete' },
    { label: 'Completed', value: 'completed' },
    ...customCategories.map(cat => ({
      label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      value: cat.name as TaskFilterOption,
    })),
  ];

  const sortOptions: { label: string; value: TaskSortOption }[] = [
    { label: 'Due Date', value: 'dueDate' },
    { label: 'Priority', value: 'priority' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Title', value: 'title' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.filterHeaderContainer}>
          <Filter size={16} color={colors.textSecondary} />
          <Text
            style={[
              styles.headerText,
              { color: colors.textSecondary, fontFamily: 'Poppins-Medium' },
            ]}
          >
            Filters
          </Text>
        </View>
        
        <View style={styles.sortContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptionsContainer}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  currentSort === option.value && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => onSortChange(option.value)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    {
                      color:
                        currentSort === option.value
                          ? colors.primary
                          : colors.textSecondary,
                      fontFamily:
                        currentSort === option.value
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
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filterOptions.map((option) => {
          const customCategory = customCategories.find(cat => cat.name === option.value);
          const backgroundColor = customCategory
            ? customCategory.color + '20'
            : currentFilter === option.value
            ? colors.primary
            : isDark
            ? colors.backgroundSecondary
            : '#F0F0F5';
          
          const textColor = customCategory
            ? customCategory.color
            : currentFilter === option.value
            ? '#FFFFFF'
            : colors.textSecondary;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                { backgroundColor },
              ]}
              onPress={() => onFilterChange(option.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: textColor,
                    fontFamily:
                      currentFilter === option.value
                        ? 'Poppins-Medium'
                        : 'Poppins-Regular',
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    marginLeft: 4,
  },
  filtersContainer: {
    paddingHorizontal: 12,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 13,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
  },
  sortOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  sortOptionText: {
    fontSize: 13,
  },
});