import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform,
  Share,
  Dimensions,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { Header } from '@/components/Header';
import { Moon, Sun, Bell, Smartphone, CircleHelp as HelpCircle, Info, ArrowRight, Trash2, Lock, Import, Import as Export, Fingerprint } from 'lucide-react-native';
import { useTaskContext } from '@/context/TaskContext';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Numpad } from '@/components/Numpad';

const { width } = Dimensions.get('window');
const DOT_SIZE = 16;
const DOT_SPACING = 24;

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  const { tasks, setTasks } = useTaskContext();
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isPasscodeEnabled, setIsPasscodeEnabled] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  React.useEffect(() => {
    checkSecuritySettings();
  }, []);
  
  const checkSecuritySettings = async () => {
    const passcodeEnabled = await AsyncStorage.getItem('@passcode_enabled');
    const biometricEnabled = await AsyncStorage.getItem('@biometric_enabled');
    const storedPasscode = await AsyncStorage.getItem('@passcode');
    
    setIsPasscodeEnabled(passcodeEnabled === 'true' && !!storedPasscode);
    setIsBiometricEnabled(biometricEnabled === 'true');
  };
  
  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleTogglePasscode = async () => {
    if (isPasscodeEnabled) {
      await AsyncStorage.setItem('@passcode_enabled', 'false');
      await AsyncStorage.removeItem('@passcode');
      setIsPasscodeEnabled(false);
      setPasscode('');
      setConfirmPasscode('');
    } else {
      setIsSettingPasscode(true);
    }
  };

  const handleNumPress = (value: string) => {
    if (!isConfirming) {
      if (passcode.length < 6) {
        const newPasscode = passcode + value;
        setPasscode(newPasscode);
        setPasscodeError('');

        if (newPasscode.length >= 4) {
          setIsConfirming(true);
        }
      }
    } else {
      if (confirmPasscode.length < passcode.length) {
        const newConfirmPasscode = confirmPasscode + value;
        setConfirmPasscode(newConfirmPasscode);
        setPasscodeError('');

        if (newConfirmPasscode.length === passcode.length) {
          if (newConfirmPasscode === passcode) {
            handleSetPasscode();
          } else {
            setPasscodeError('Passcodes do not match');
            setConfirmPasscode('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (!isConfirming) {
      setPasscode(prev => prev.slice(0, -1));
    } else {
      setConfirmPasscode(prev => prev.slice(0, -1));
    }
    setPasscodeError('');
  };

  const handleSetPasscode = async () => {
    try {
      await AsyncStorage.setItem('@passcode', passcode);
      await AsyncStorage.setItem('@passcode_enabled', 'true');
      setIsPasscodeEnabled(true);
      setIsSettingPasscode(false);
      setPasscode('');
      setConfirmPasscode('');
      setPasscodeError('');
      setIsConfirming(false);
      Alert.alert('Success', 'Passcode has been set successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to set passcode');
    }
  };
  
  const handleToggleBiometric = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Biometric authentication is not available on web');
      return;
    }
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !isEnrolled) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on your device'
      );
      return;
    }
    
    if (isBiometricEnabled) {
      await AsyncStorage.setItem('@biometric_enabled', 'false');
      setIsBiometricEnabled(false);
    } else {
      const result = await LocalAuthentication.authenticateAsync();
      if (result.success) {
        await AsyncStorage.setItem('@biometric_enabled', 'true');
        setIsBiometricEnabled(true);
      }
    }
  };
  
  const handleExportData = async () => {
    try {
      const exportData = JSON.stringify(tasks, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await Share.share({
          message: exportData,
          title: 'Tasks Export',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };
  
  const handleImportData = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const importedTasks = JSON.parse(event.target?.result as string);
            setTasks(importedTasks);
            Alert.alert('Success', 'Tasks imported successfully');
          } catch (error) {
            Alert.alert('Error', 'Invalid file format');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      Alert.alert(
        'Import Data',
        'This feature is currently only available on web'
      );
    }
  };

  const handleResetData = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to reset all your tasks? This action cannot be undone.')) {
        setTasks([]);
        Alert.alert('Reset successful', 'All your tasks have been deleted.');
      }
    } else {
      Alert.alert(
        'Reset All Data',
        'Are you sure you want to reset all your tasks? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reset',
            onPress: () => {
              setTasks([]);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert('Reset successful', 'All your tasks have been deleted.');
            },
            style: 'destructive',
          },
        ]
      );
    }
  };
  
  if (isSettingPasscode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Header 
          title="Set Passcode" 
          showBackButton 
          onBackPress={() => {
            setIsSettingPasscode(false);
            setPasscode('');
            setConfirmPasscode('');
            setPasscodeError('');
            setIsConfirming(false);
          }}
        />
        
        <View style={styles.passcodeWrapper}>
          <View style={styles.passcodeContainer}>
            <View style={styles.header}>
              <Lock size={48} color={colors.primary} style={styles.icon} />
              <Text style={[styles.title, { color: colors.text }]}>
                {!isConfirming ? 'Enter New Passcode' : 'Confirm Passcode'}
              </Text>
              {passcodeError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {passcodeError}
                </Text>
              ) : (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {!isConfirming 
                    ? 'Enter a passcode with at least 4 digits'
                    : 'Re-enter your passcode to confirm'
                  }
                </Text>
              )}
            </View>

            <View style={styles.dotsContainer}>
              {Array(!isConfirming ? passcode.length || 4 : passcode.length)
                .fill(0)
                .map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: index < (!isConfirming ? passcode.length : confirmPasscode.length)
                          ? colors.primary
                          : 'transparent',
                        borderColor: index < (!isConfirming ? passcode.length : confirmPasscode.length)
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  />
                ))}
            </View>

            <Numpad onPress={handleNumPress} onDelete={handleDelete} />
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Header title="Settings" />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Appearance
          </Text>
          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingContent}>
              {isDark ? (
                <Moon color={colors.text} size={22} />
              ) : (
                <Sun color={colors.text} size={22} />
              )}
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Dark Mode
              </Text>
            </View>
            <Text
              style={[
                styles.settingValue,
                { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
              ]}
            >
              {isDark ? 'On' : 'Off'} (System)
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Security
          </Text>
          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingContent}>
              <Lock color={colors.text} size={22} />
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                App Lock (Passcode)
              </Text>
            </View>
            <Switch
              value={isPasscodeEnabled}
              onValueChange={handleTogglePasscode}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={isPasscodeEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
          
          {Platform.OS !== 'web' && (
            <View
              style={[
                styles.settingItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.settingContent}>
                <Fingerprint color={colors.text} size={22} />
                <Text
                  style={[
                    styles.settingText,
                    { color: colors.text, fontFamily: 'Poppins-Regular' },
                  ]}
                >
                  Biometric Lock
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={isBiometricEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Notifications
          </Text>
          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingContent}>
              <Bell color={colors.text} size={22} />
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Enable Notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Data Management
          </Text>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleExportData}
          >
            <View style={styles.settingContent}>
              <Export color={colors.text} size={22} />
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Export Tasks
              </Text>
            </View>
            <ArrowRight color={colors.textSecondary} size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleImportData}
          >
            <View style={styles.settingContent}>
              <Import color={colors.text} size={22} />
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Import Tasks
              </Text>
            </View>
            <ArrowRight color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            About
          </Text>
          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingContent}>
              <Info color={colors.text} size={22} />
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                App Version
              </Text>
            </View>
            <Text
              style={[
                styles.settingValue,
                { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
              ]}
            >
              1.0.0
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingContent}>
              <HelpCircle color={colors.text} size={22} />
              <Text
                style={[
                  styles.settingText,
                  { color: colors.text, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Help & Support
              </Text>
            </View>
            <ArrowRight color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: 'Poppins-SemiBold' },
            ]}
          >
            Data
          </Text>
          <View
            style={[
              styles.statsContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontFamily: 'Poppins-SemiBold' },
                ]}
              >
                {tasks.length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Total Tasks
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontFamily: 'Poppins-SemiBold' },
                ]}
              >
                {tasks.filter(t => t.completed).length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Completed
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontFamily: 'Poppins-SemiBold' },
                ]}
              >
                {tasks.filter(t => !t.completed).length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
                ]}
              >
                Pending
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.dangerButton,
              { backgroundColor: isDark ? colors.backgroundSecondary : '#FEE2E2' },
            ]}
            onPress={handleResetData}
          >
            <Trash2 color={colors.error} size={18} />
            <Text
              style={[
                styles.dangerButtonText,
                { color: colors.error, fontFamily: 'Poppins-Medium' },
              ]}
            >
              Reset All Data
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textSecondary, fontFamily: 'Poppins-Regular' },
            ]}
          >
            © 2025 TaskMaster • All rights reserved
          </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
  },
  passcodeWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  passcodeContainer: {
    width: '100%',
    maxWidth: Math.min(width - 48, 400),
    alignItems: 'center',
    gap:  48,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    color: 'red',
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
});