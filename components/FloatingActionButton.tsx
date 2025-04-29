import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { Plus } from 'lucide-react-native';

interface FABProps {
  onPress: () => void;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});