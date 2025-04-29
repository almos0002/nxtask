import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { SquareCheck as CheckSquare } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <CheckSquare size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },
});