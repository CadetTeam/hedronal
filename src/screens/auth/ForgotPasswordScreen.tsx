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
import { Logo } from '../../components/Logo';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { OTPModal } from '../../components/OTPModal';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [sent, setSent] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function validate() {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleResetPassword() {
    if (!validate() || !isLoaded) {
      return;
    }

    setLoading(true);
    try {
      // Initiate password reset
      await signIn.create({
        identifier: email,
      });

      // Prepare password reset
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
      } as any);

      setSent(true);
      setShowOTPModal(true);
    } catch (error: any) {
      const errorMessage =
        error?.errors?.[0]?.message ||
        error?.message ||
        'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(code: string) {
    if (!signIn || !isLoaded) return;

    setOtpLoading(true);
    try {
      // Verify the code
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        // Code verified, now show password reset form
        setShowOTPModal(false);
        // The user will need to set a new password
        // This is handled by Clerk's flow
        Alert.alert(
          'Code Verified',
          'Please set your new password.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Clerk will handle the password reset flow
                // User needs to complete it via the signIn object
              },
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || 'Verification failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOTP() {
    if (!signIn || !isLoaded) return;

    try {
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
      } as any);
    } catch (error: any) {
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || 'Failed to resend code. Please try again.';
      Alert.alert('Error', errorMessage);
      throw error;
    }
  }

  if (sent && !showOTPModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Logo size={80} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Check Your Email</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            We've sent password reset instructions to{'\n'}
            <Text style={{ fontWeight: '600' }}>{email}</Text>
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
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
            <Logo size={80} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

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

            <Button
              title="Send Reset Instructions"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.button}
            />

            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OTPModal
        visible={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setSent(false);
        }}
        email={email}
        onResend={handleResendOTP}
        onVerify={handleVerifyOTP}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    lineHeight: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  button: {
    marginBottom: 12,
  },
});
