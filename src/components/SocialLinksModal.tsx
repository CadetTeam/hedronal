import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';

const SOCIAL_ICONS = [
  { name: 'close-circle-outline', label: 'X.com', type: 'x' },
  { name: 'logo-linkedin', label: 'LinkedIn', type: 'linkedin' },
  { name: 'logo-github', label: 'GitHub', type: 'github' },
  { name: 'logo-instagram', label: 'Instagram', type: 'instagram' },
  { name: 'globe-outline', label: 'Website', type: 'website' },
  { name: 'mail-outline', label: 'Email', type: 'email' },
];

interface SocialLinksModalProps {
  visible: boolean;
  onClose: () => void;
  socialLinks: Array<{ type: string; url: string }>;
  onSave: (socialLinks: Array<{ type: string; url: string }>) => void;
}

export function SocialLinksModal({
  visible,
  onClose,
  socialLinks: initialSocialLinks,
  onSave,
}: SocialLinksModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [socialLinks, setSocialLinks] =
    useState<Array<{ type: string; url: string }>>(initialSocialLinks);
  const [showSocialDropdown, setShowSocialDropdown] = useState<number | null>(null);

  React.useEffect(() => {
    if (visible) {
      setSocialLinks(initialSocialLinks);
      setShowSocialDropdown(null);
    }
  }, [visible, initialSocialLinks]);

  function handleSave() {
    onSave(socialLinks);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurredModalOverlay visible={visible} onClose={onClose}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              minHeight: 500 + insets.bottom * 2,
              maxHeight: 650,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <LinearGradient
              colors={
                isDark
                  ? [theme.colors.surface, `${theme.colors.surface}00`]
                  : [theme.colors.surface, `${theme.colors.surface}00`]
              }
              style={styles.modalHeaderGradient}
              pointerEvents="none"
            />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Social Links</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom * 2 + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <View style={styles.socialLinksHeader}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Social Links</Text>
                <TouchableOpacity
                  style={[
                    styles.addSocialLinkIconButton,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSocialLinks([...socialLinks, { type: 'x', url: '' }]);
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              {socialLinks.map((link, index) => {
                const icon = SOCIAL_ICONS.find(s => s.type === link.type);
                const isDropdownOpen = showSocialDropdown === index;
                return (
                  <View key={index} style={styles.socialLinkRow}>
                    <View
                      style={[
                        styles.socialLinkItem,
                        {
                          backgroundColor: theme.colors.surfaceVariant,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.socialIconButton}
                        onPress={() => setShowSocialDropdown(isDropdownOpen ? null : index)}
                      >
                        <Ionicons name={icon?.name as any} size={20} color={theme.colors.text} />
                        <Ionicons name="chevron-down" size={16} color={theme.colors.textTertiary} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.socialLinkInput, { color: theme.colors.text }]}
                        value={link.url}
                        onChangeText={url => {
                          const updated = [...socialLinks];
                          updated[index] = { ...updated[index], url };
                          setSocialLinks(updated);
                        }}
                        placeholder="Enter URL"
                        placeholderTextColor={theme.colors.textTertiary}
                        keyboardType="url"
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setSocialLinks(socialLinks.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                    {isDropdownOpen && (
                      <View
                        style={[
                          styles.socialDropdown,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        {SOCIAL_ICONS.map(social => (
                          <TouchableOpacity
                            key={social.type}
                            style={[
                              styles.socialDropdownItem,
                              {
                                backgroundColor:
                                  link.type === social.type
                                    ? theme.colors.surfaceVariant
                                    : 'transparent',
                              },
                            ]}
                            onPress={() => {
                              const updated = [...socialLinks];
                              updated[index] = { ...updated[index], type: social.type };
                              setSocialLinks(updated);
                              setShowSocialDropdown(null);
                            }}
                          >
                            <Ionicons
                              name={social.name as any}
                              size={20}
                              color={theme.colors.text}
                            />
                            <Text style={[styles.socialDropdownText, { color: theme.colors.text }]}>
                              {social.type.charAt(0).toUpperCase() + social.type.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View
            style={[
              styles.navigationButtons,
              { borderTopColor: theme.colors.border, paddingBottom: insets.bottom },
            ]}
          >
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: theme.colors.background }]}>Save</Text>
            </TouchableOpacity>
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
  },
  modalHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: -1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 1,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  socialLinksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSocialLinkIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  socialLinkRow: {
    marginBottom: 12,
  },
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  socialIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialLinkInput: {
    flex: 1,
    fontSize: 16,
  },
  socialDropdown: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  socialDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  socialDropdownText: {
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
