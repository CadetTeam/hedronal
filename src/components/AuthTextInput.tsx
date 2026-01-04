import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface AuthTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function AuthTextInput({
  label,
  error,
  secureTextEntry,
  style,
  ...props
}: AuthTextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry === true;
  const actualSecureTextEntry = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 20 : 10}
          tint="light"
          style={styles.blurContainer}
        >
          <RNTextInput
            style={[
              styles.input,
              {
                paddingRight: showPasswordToggle ? 48 : 16,
              },
              style,
            ]}
            placeholderTextColor="rgba(62, 39, 35, 0.6)"
            secureTextEntry={actualSecureTextEntry}
            {...props}
          />
          {showPasswordToggle && (
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="rgba(62, 39, 35, 0.8)"
              />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#3E2723',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  blurContainer: {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
    color: '#3E2723',
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    color: '#FF6B6B',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
