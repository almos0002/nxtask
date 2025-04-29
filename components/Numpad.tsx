import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { Delete } from 'lucide-react-native';

interface NumpadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width * 0.18, 72);
const GAP = 20;

export function Numpad({ onPress, onDelete }: NumpadProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  const handlePress = (value: string) => {
    if (Platform.OS !== 'web') {
      // Add haptic feedback here if needed
    }
    onPress(value);
  };

  return (
    <View style={styles.container}>
      {buttons.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((button, index) => {
            if (!button) return <View key={index} style={styles.placeholder} />;

            if (button === 'delete') {
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    {
                      backgroundColor: isDark ? colors.backgroundSecondary : '#F5F5F5',
                    },
                  ]}
                  onPress={onDelete}
                >
                  <Delete size={24} color={colors.text} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  {
                    backgroundColor: isDark ? colors.backgroundSecondary : '#F5F5F5',
                  },
                ]}
                onPress={() => handlePress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.text },
                  ]}
                >
                  {button}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: BUTTON_SIZE * 3 + GAP * 2,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  buttonText: {
    fontSize: 28,
    fontFamily: 'Poppins-Medium',
  },
  placeholder: {
    width: BUTTON_SIZE,
  },
});