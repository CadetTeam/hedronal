import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';

interface OTPModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string;
  phone?: string;
  onResend: () => Promise<void>;
  onVerify: (code: string) => Promise<void>;
  loading?: boolean;
}

export function OTPModal({
  visible,
  onClose,
  email,
  phone,
  onResend,
  onVerify,
  loading = false,
}: OTPModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      setCode('');
      setResendCooldown(0);
      // Focus first input after modal appears
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleVerify() {
    if (code.length === 6) {
      await onVerify(code);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      await onResend();
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      // Error handled by parent
    } finally {
      setResendLoading(false);
    }
  }

  function handleCodeChange(text: string, index: number) {
    const newCode = code.split('');
    newCode[index] = text;
    const updatedCode = newCode.join('').slice(0, 6);
    setCode(updatedCode);

    // Auto-advance to next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6 digits entered
    if (updatedCode.length === 6) {
      Keyboard.dismiss();
      handleVerify();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurredModalOverlay visible={visible} onClose={onClose}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              minHeight: 200 + insets.bottom * 2,
              maxHeight: 650,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                  : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
              }
              style={styles.modalHeaderGradient}
              pointerEvents="none"
            />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Verify Code</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Enter the verification code sent to{'\n'}
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>
                {email || phone}
              </Text>
            </Text>

            <View style={styles.codeContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: code[index]
                        ? theme.colors.primary
                        : theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  value={code[index] || ''}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                Didn't receive the code?{' '}
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
              >
                <Text
                  style={[
                    styles.resendLink,
                    {
                      color:
                        resendCooldown > 0 || resendLoading
                          ? theme.colors.textTertiary
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : resendLoading
                    ? 'Sending...'
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Verify"
              onPress={handleVerify}
              loading={loading}
              disabled={code.length !== 6}
              style={styles.button}
            />
          </View>
        </View>
      </BlurredModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
    zIndex: 2,
  },
  modalHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 10,
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
  },
});

