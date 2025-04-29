import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search tasks...',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.backgroundSecondary : '#F0F0F5',
          borderColor: colors.border,
        },
      ]}
    >
      <Search size={20} color={colors.textSecondary} style={styles.icon} />
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            fontFamily: 'Poppins-Regular',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});