import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn } from '@clerk/clerk-expo';
import { useTheme } from '../../context/ThemeContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { Logo } from '../../components/Logo';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { OTPModal } from '../../components/OTPModal';

interface LoginScreenProps {
  navigation: any;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme } = useTheme();
  const { enableDemoMode, isDemoMode } = useDemoMode();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  function handleLongPressStart() {
    enableDemoMode();
    Alert.alert('Demo Mode', 'Demo mode has been enabled!');
  }

  function validate() {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate() || !isLoaded) {
      return;
    }

    if (!signIn) {
      Alert.alert('Error', 'Sign in service is not ready. Please try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('[LoginScreen] Attempting sign in...');
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log('[LoginScreen] Sign in result status:', result.status);

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          console.log('[LoginScreen] Setting active session...');
          await setActive({ session: result.createdSessionId });
          console.log('[LoginScreen] Sign in successful');
          // Navigation will happen automatically via AppNavigator
        } else {
          console.error('[LoginScreen] No session ID in result');
          Alert.alert('Error', 'Sign in completed but no session was created. Please try again.');
        }
      } else if (result.status === 'needs_second_factor') {
        // 2FA is optional - show OTP modal but allow user to skip
        console.log('[LoginScreen] 2FA required, showing OTP modal (optional)');
        setShowOTPModal(true);
      } else {
        console.warn('[LoginScreen] Sign in status:', result.status);
        Alert.alert('Error', 'Unable to sign in. Please try again.');
      }
    } catch (error: any) {
      console.error('[LoginScreen] Sign in error:', error);
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || 'Login failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Logo size={100} onLongPressStart={handleLongPressStart} onLongPressEnd={() => {}} />
            {isDemoMode && (
              <Text style={[styles.demoBadge, { color: theme.colors.accent }]}>DEMO MODE</Text>
            )}
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.button} />

            <Button
              title="Forgot Password?"
              onPress={() => navigation.navigate('ForgotPassword')}
              variant="outline"
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: theme.colors.primary }]}
              onPress={() => navigation.navigate('Register')}
            >
              Sign Up
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OTPModal
        visible={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          // Allow user to skip 2FA - they can try signing in again later
        }}
        email={email}
        onResend={async () => {
          if (!signIn || !isLoaded) return;
          try {
            await signIn.prepareSecondFactor({
              strategy: 'totp',
            });
          } catch (error: any) {
            const errorMessage =
              error?.errors?.[0]?.message ||
              error?.message ||
              'Failed to resend code. Please try again.';
            Alert.alert('Error', errorMessage);
            throw error;
          }
        }}
        onVerify={async (code: string) => {
          if (!signIn || !isLoaded) return;

          setOtpLoading(true);
          try {
            const result = await signIn.attemptSecondFactor({
              strategy: 'totp',
              code,
            });

            if (result.status === 'complete') {
              await setActive({ session: result.createdSessionId });
              setShowOTPModal(false);
              console.log('[LoginScreen] Sign in successful with 2FA');
            } else {
              Alert.alert('Error', 'Invalid verification code. Please try again.');
            }
          } catch (error: any) {
            const errorMessage =
              error?.errors?.[0]?.message ||
              error?.message ||
              'Verification failed. Please try again.';
            Alert.alert('Error', errorMessage);
          } finally {
            setOtpLoading(false);
          }
        }}
        loading={otpLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  demoBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  button: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
