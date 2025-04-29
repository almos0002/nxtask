import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import { ArrowLeft, MoveVertical as MoreVertical } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onRightButtonPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  rightComponent,
  onRightButtonPress,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];

  const statusBarHeight = Platform.select({
    ios: 47,
    android: StatusBar.currentHeight,
    default: 0
  });

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: statusBarHeight,
      },
    ]}>
      <View style={styles.content}>
        {showBackButton ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontFamily: 'Poppins-SemiBold',
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        
        {rightComponent ? (
          rightComponent
        ) : onRightButtonPress ? (
          <TouchableOpacity onPress={onRightButtonPress} style={styles.rightButton}>
            <MoreVertical color={colors.primary} size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backPlaceholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rightPlaceholder: {
    width: 40,
  },
});