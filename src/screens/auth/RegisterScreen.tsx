import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/clerk-expo';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../../components/Logo';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { OTPModal } from '../../components/OTPModal';
import { Ionicons } from '@expo/vector-icons';

interface RegisterScreenProps {
  navigation: any;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { theme } = useTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  function validate() {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate() || !isLoaded) {
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
      });

      console.log('[RegisterScreen] User created, preparing email verification...');
      
      // Send email verification code
      try {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        console.log('[RegisterScreen] Email verification code sent successfully');
        setShowOTPModal(true);
      } catch (emailError: any) {
        console.error('[RegisterScreen] Failed to send verification email:', emailError);
        const emailErrorMessage =
          emailError?.errors?.[0]?.message ||
          emailError?.message ||
          'Failed to send verification email.';
        
        Alert.alert(
          'Email Verification Error',
          `${emailErrorMessage}\n\nPlease check:\n• Your Clerk email settings\n• Email provider configuration\n• Spam folder\n\nYou can try resending the code from the verification screen.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Still show OTP modal in case email was sent but there's a different issue
                setShowOTPModal(true);
              },
            },
          ]
        );
        // Still show OTP modal - email might have been sent despite the error
        setShowOTPModal(true);
      }
    } catch (error: any) {
      console.error('[RegisterScreen] Registration error:', error);
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || 'Registration failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(code: string) {
    if (!signUp || !isLoaded) return;

    setOtpLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setShowOTPModal(false);
        Alert.alert('Success', 'Account created successfully!');
        // Navigation will happen automatically via AppNavigator
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
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
    if (!signUp || !isLoaded) return;

    try {
      console.log('[RegisterScreen] Resending verification email...');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('[RegisterScreen] Verification email resent successfully');
      Alert.alert('Success', 'Verification code has been resent. Please check your email.');
    } catch (error: any) {
      console.error('[RegisterScreen] Failed to resend verification email:', error);
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || 'Failed to resend code. Please try again.';
      Alert.alert(
        'Resend Failed',
        `${errorMessage}\n\nPlease check your Clerk email configuration in the dashboard.`
      );
      throw error;
    }
  }

  function handleOpenTerms() {
    // Replace with your actual terms URL
    Linking.openURL('https://hedronal.com/terms');
  }

  function handleOpenPrivacy() {
    // Replace with your actual privacy policy URL
    Linking.openURL('https://hedronal.com/privacy');
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

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              error={errors.name}
            />

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
              placeholder="Create a password"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: acceptedTerms ? theme.colors.primary : 'transparent',
                    borderColor: acceptedTerms ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.background} />
                )}
              </View>
              <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                I agree to the{' '}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                  onPress={handleOpenTerms}
                >
                  Terms and Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                  onPress={handleOpenPrivacy}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.terms}
              </Text>
            )}

            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: theme.colors.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              Sign In
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OTPModal
        visible={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          // Note: Clerk's signUp object doesn't have a reset() method
          // The sign-up state will be managed by Clerk automatically
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
  },
  form: {
    width: '100%',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 32,
  },
  button: {
    marginTop: 8,
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
