import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react-native';
import { Numpad } from './Numpad';

interface PasscodeLockProps {
  children: React.ReactNode;
}

const { width } = Dimensions.get('window');
const DOT_SIZE = 14;
const DOT_SPACING = 24;

export function PasscodeLock({ children }: PasscodeLockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];

  const [isLocked, setIsLocked] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [storedPasscode, setStoredPasscode] = useState<string | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dotScale] = useState(new Animated.Value(0));
  const [shake] = useState(new Animated.Value(0));

  useEffect(() => {
    checkLockSettings();
  }, []);

  useEffect(() => {
    Animated.spring(dotScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [passcode]);

  const checkLockSettings = async () => {
    const passcodeEnabled = await AsyncStorage.getItem('@passcode_enabled');
    const biometricEnabled = await AsyncStorage.getItem('@biometric_enabled');
    const savedPasscode = await AsyncStorage.getItem('@passcode');

    setStoredPasscode(savedPasscode);
    setIsBiometricEnabled(biometricEnabled === 'true');
    setIsLocked(passcodeEnabled === 'true' && !!savedPasscode);

    if (biometricEnabled === 'true' && Platform.OS !== 'web') {
      handleBiometricAuth();
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync();
      if (result.success) {
        setIsLocked(false);
      }
    } catch (error) {
      console.log('Biometric auth error:', error);
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shake, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start();
  };

  const handleNumPress = (value: string) => {
    if (passcode.length < storedPasscode?.length!) {
      const newPasscode = passcode + value;
      setPasscode(newPasscode);
      setError('');

      if (newPasscode.length === storedPasscode?.length) {
        if (newPasscode === storedPasscode) {
          setIsLocked(false);
        } else {
          setError('Incorrect passcode');
          setPasscode('');
          shakeAnimation();
        }
      }
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
    setError('');
  };

  if (!isLocked || !storedPasscode) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
              <ShieldCheck size={40} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Enter Passcode</Text>
            {error ? (
              <Animated.Text 
                style={[
                  styles.errorText, 
                  { 
                    color: colors.error,
                    transform: [{ translateX: shake }]
                  }
                ]}
              >
                {error}
              </Animated.Text>
            ) : (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your passcode to unlock the app
              </Text>
            )}
          </View>

          <View style={styles.dotsContainer}>
            {Array(storedPasscode.length).fill(0).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index < passcode.length ? colors.primary : 'transparent',
                    borderColor: index < passcode.length ? colors.primary : colors.border,
                    transform: [
                      { 
                        scale: index === passcode.length - 1 ? 
                          dotScale : index < passcode.length ? 1 : 1 
                      }
                    ],
                  },
                ]}
              />
            ))}
          </View>

          <Numpad onPress={handleNumPress} onDelete={handleDelete} />

          {isBiometricEnabled && Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[
                styles.biometricButton,
                { backgroundColor: isDark ? colors.backgroundSecondary : '#F5F5F5' }
              ]}
              onPress={handleBiometricAuth}
            >
              <Fingerprint size={22} color={colors.primary} />
              <Text style={[styles.biometricText, { color: colors.primary }]}>
                Use Biometric Authentication
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: Math.min(width - 48, 400),
    alignItems: 'center',
    gap: 48,
  },
  header: {
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: DOT_SPACING,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  biometricText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },
});