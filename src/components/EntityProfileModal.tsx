import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { EntityCreationModal } from './EntityCreationModal';
import { updateEntity } from '../services/entityService';
import { useAuth } from '@clerk/clerk-expo';

const ACCORDION_ITEMS = [
  { key: 'Domain', description: "Configure your entity's domain name and website settings" },
  { key: 'Workspace', description: 'Set up your workspace and collaboration tools' },
  { key: 'Formation', description: 'Document your entity formation details and structure' },
  { key: 'Bank', description: 'Add banking information and account details' },
  { key: 'Cap Table', description: 'Manage your capitalization table and ownership structure' },
  { key: 'CRM', description: 'Configure customer relationship management system' },
  { key: 'Legal', description: 'Add legal documents and compliance information' },
  { key: 'Tax', description: 'Set up tax information and filing preferences' },
  { key: 'Accounting', description: 'Configure accounting systems and chart of accounts' },
  { key: 'Invoicing', description: 'Set up invoicing preferences and templates' },
  { key: 'DUNS', description: 'Add DUNS number and business credit information' },
  { key: 'Lender', description: 'Document lender information and loan details' },
];

interface EntityProfileModalProps {
  visible: boolean;
  onClose: () => void;
  entity: any;
  onUpdate?: (entity: any) => void;
}

export function EntityProfileModal({
  visible,
  onClose,
  entity,
  onUpdate,
}: EntityProfileModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [showAccordionModal, setShowAccordionModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(entity?.completedItems || [])
  );
  const [step2Data, setStep2Data] = useState<{ [key: string]: any }>(entity?.step2Data || {});
  const [editingField, setEditingField] = useState<'name' | 'handle' | 'brief' | null>(null);
  const [editingName, setEditingName] = useState(entity?.name || '');
  const [editingHandle, setEditingHandle] = useState(entity?.handle || '');
  const [editingBrief, setEditingBrief] = useState(entity?.brief || '');
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const handleInputRef = useRef<TextInput>(null);
  const briefInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
    if (entity) {
      setCompletedItems(new Set(entity.completedItems || []));
      setStep2Data(entity.step2Data || {});
      setEditingName(entity.name || '');
      setEditingHandle(entity.handle || '');
      setEditingBrief(entity.brief || '');
    }
  }, [entity]);

  React.useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  function handleFieldPress(field: 'name' | 'handle' | 'brief') {
    setEditingField(field);
    setTimeout(() => {
      if (field === 'name' && nameInputRef.current) {
        nameInputRef.current.focus();
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else if (field === 'handle' && handleInputRef.current) {
        handleInputRef.current.focus();
        scrollViewRef.current?.scrollTo({ y: 50, animated: true });
      } else if (field === 'brief' && briefInputRef.current) {
        briefInputRef.current.focus();
        scrollViewRef.current?.scrollTo({ y: 100, animated: true });
      }
    }, 100);
  }

  async function handleFieldBlur(field: 'name' | 'handle' | 'brief') {
    setEditingField(null);

    // Check if value actually changed
    let hasChanges = false;
    if (field === 'name' && editingName !== entity?.name) {
      hasChanges = true;
    } else if (field === 'handle' && editingHandle !== entity?.handle) {
      hasChanges = true;
    } else if (field === 'brief' && editingBrief !== entity?.brief) {
      hasChanges = true;
    }

    if (!hasChanges || !entity?.id) {
      return;
    }

    // Save to backend
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please sign in again to save changes');
        setSaving(false);
        return;
      }

      const updates: any = {};
      if (field === 'name') {
        updates.name = editingName;
      } else if (field === 'handle') {
        updates.handle = editingHandle;
      } else if (field === 'brief') {
        updates.brief = editingBrief;
      }

      const result = await updateEntity(entity.id, updates, token);

      if (result.success && result.entity) {
        // Transform the updated entity to match expected format
        const updatedEntity = {
          ...entity,
          name: result.entity.name || entity.name,
          handle: result.entity.handle || entity.handle,
          brief: result.entity.brief || entity.brief,
        };

        if (onUpdate) {
          onUpdate(updatedEntity);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to save changes');
        // Revert to original values
        if (field === 'name') {
          setEditingName(entity.name || '');
        } else if (field === 'handle') {
          setEditingHandle(entity.handle || '');
        } else if (field === 'brief') {
          setEditingBrief(entity.brief || '');
        }
      }
    } catch (error: any) {
      console.error('Error saving entity:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
      // Revert to original values
      if (field === 'name') {
        setEditingName(entity.name || '');
      } else if (field === 'handle') {
        setEditingHandle(entity.handle || '');
      } else if (field === 'brief') {
        setEditingBrief(entity.brief || '');
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleAccordionItem(item: string) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(item)) {
      newExpanded.delete(item);
    } else {
      newExpanded.add(item);
    }
    setExpandedItems(newExpanded);
  }

  function toggleCompletedItem(item: string) {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(item)) {
      newCompleted.delete(item);
    } else {
      newCompleted.add(item);
    }
    setCompletedItems(newCompleted);
    if (onUpdate) {
      onUpdate({
        ...entity,
        completedItems: Array.from(newCompleted),
        step2Data,
      });
    }
  }

  function handleAccordionUpdate(updatedEntity: any) {
    setCompletedItems(new Set(updatedEntity.completedItems || []));
    setStep2Data(updatedEntity.step2Data || {});
    if (onUpdate) {
      onUpdate({
        ...entity,
        ...updatedEntity,
      });
    }
    setShowAccordionModal(false);
  }

  if (!entity) return null;

  const SOCIAL_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    twitter: 'logo-twitter',
    linkedin: 'logo-linkedin',
    github: 'logo-github',
    instagram: 'logo-instagram',
    website: 'globe-outline',
    email: 'mail-outline',
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <BlurredModalOverlay visible={visible} onClose={onClose}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 500 + insets.bottom * 2,
                maxHeight: 650,
                marginBottom: keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0,
              },
            ]}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom * 2 + 100 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Banner */}
              <TouchableOpacity activeOpacity={0.8}>
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: entity.banner
                        ? theme.colors.background
                        : theme.colors.primary,
                    },
                  ]}
                >
                  {entity.banner ? (
                    <Image source={{ uri: entity.banner }} style={styles.bannerImage} />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color={theme.colors.background} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Profile Info */}
              <View style={styles.profileSection}>
                <TouchableOpacity activeOpacity={0.8}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: entity.avatar ? 'transparent' : theme.colors.primary,
                        borderColor: theme.colors.background,
                      },
                    ]}
                  >
                    {entity.avatar ? (
                      <Image source={{ uri: entity.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                        {entity.name?.charAt(0).toUpperCase() || 'E'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleFieldPress('name')}
                  style={styles.editableField}
                >
                  {editingField === 'name' ? (
                    <TextInput
                      ref={nameInputRef}
                      style={[styles.nameInput, { color: theme.colors.text }]}
                      value={editingName}
                      onChangeText={setEditingName}
                      onBlur={() => handleFieldBlur('name')}
                      autoFocus
                      placeholder="Name"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  ) : (
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                      {entity.name || 'Name'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleFieldPress('handle')}
                  style={styles.editableField}
                >
                  {editingField === 'handle' ? (
                    <TextInput
                      ref={handleInputRef}
                      style={[styles.usernameInput, { color: theme.colors.textSecondary }]}
                      value={editingHandle}
                      onChangeText={setEditingHandle}
                      onBlur={() => handleFieldBlur('handle')}
                      autoFocus
                      placeholder="@handle"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  ) : (
                    <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
                      {entity.handle ? `@${entity.handle}` : '@handle'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleFieldPress('brief')}
                  style={styles.editableField}
                >
                  {editingField === 'brief' ? (
                    <TextInput
                      ref={briefInputRef}
                      style={[styles.bioInput, { color: theme.colors.textSecondary }]}
                      value={editingBrief}
                      onChangeText={setEditingBrief}
                      onBlur={() => handleFieldBlur('brief')}
                      autoFocus
                      placeholder="Bio"
                      placeholderTextColor={theme.colors.textTertiary}
                      multiline
                      textAlign="center"
                    />
                  ) : (
                    <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
                      {entity.brief || 'Bio'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Social Links */}
                {entity.socialLinks && entity.socialLinks.length > 0 && (
                  <View style={styles.socialLinks}>
                    {entity.socialLinks.map((link: any, index: number) => {
                      const iconName = SOCIAL_ICONS[link.type] || 'globe-outline';
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.socialLink,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          <Ionicons name={iconName} size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Stats */}
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                      {completedItems.size}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                      {ACCORDION_ITEMS.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                      Total
                    </Text>
                  </View>
                </View>

                {/* Configuration Button */}
                <TouchableOpacity
                  style={[styles.configButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowAccordionModal(true)}
                >
                  <Ionicons name="settings-outline" size={20} color={theme.colors.background} />
                  <Text style={[styles.configButtonText, { color: theme.colors.background }]}>
                    Configure Settings
                  </Text>
                </TouchableOpacity>

                {/* Accordion Section */}
                <View style={styles.accordionSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Configuration
                  </Text>
                  {ACCORDION_ITEMS.map(item => {
                    const isExpanded = expandedItems.has(item.key);
                    const isCompleted = completedItems.has(item.key);
                    return (
                      <View
                        key={item.key}
                        style={[
                          styles.accordionItem,
                          {
                            backgroundColor: theme.colors.surfaceVariant,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.accordionHeader}
                          onPress={() => toggleAccordionItem(item.key)}
                        >
                          <View style={styles.accordionHeaderLeft}>
                            {isCompleted && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={theme.colors.success || '#10b981'}
                                style={styles.completedIcon}
                              />
                            )}
                            <View style={styles.accordionHeaderText}>
                              <Text style={[styles.accordionTitle, { color: theme.colors.text }]}>
                                {item.key}
                              </Text>
                              {!isExpanded && (
                                <Text
                                  style={[
                                    styles.accordionDescription,
                                    { color: theme.colors.textSecondary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.description}
                                </Text>
                              )}
                            </View>
                          </View>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.text}
                          />
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={styles.accordionContent}>
                            <Text
                              style={[
                                styles.accordionDescriptionFull,
                                { color: theme.colors.textSecondary, marginBottom: 12 },
                              ]}
                            >
                              {item.description}
                            </Text>
                            <TextInput
                              style={[
                                styles.input,
                                {
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text,
                                },
                              ]}
                              placeholder={`Enter ${item.key.toLowerCase()} information`}
                              placeholderTextColor={theme.colors.textTertiary}
                              value={step2Data[item.key] || ''}
                              onChangeText={value => {
                                const updated = { ...step2Data, [item.key]: value };
                                setStep2Data(updated);
                                if (onUpdate) {
                                  onUpdate({
                                    ...entity,
                                    step2Data: updated,
                                  });
                                }
                              }}
                              multiline
                            />
                            <TouchableOpacity
                              style={[
                                styles.completeButton,
                                {
                                  backgroundColor: isCompleted
                                    ? theme.colors.success || '#10b981'
                                    : theme.colors.primary,
                                  marginTop: 12,
                                },
                              ]}
                              onPress={() => toggleCompletedItem(item.key)}
                            >
                              <Ionicons
                                name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                size={20}
                                color={theme.colors.background}
                              />
                              <Text
                                style={[
                                  styles.completeButtonText,
                                  { color: theme.colors.background },
                                ]}
                              >
                                {isCompleted ? 'Completed' : 'Mark as Complete'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? [`${theme.colors.surface}ff`, `${theme.colors.surface}00`]
                    : [`${theme.colors.surface}ff`, `${theme.colors.surface}00`]
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{entity.name}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Accordion Edit Modal */}
      <EntityCreationModal
        visible={showAccordionModal}
        onClose={() => setShowAccordionModal(false)}
        onComplete={handleAccordionUpdate}
      />
    </>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 16,
    zIndex: 10,
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
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
  },
  banner: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  editableField: {
    width: '100%',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
    padding: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  usernameInput: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
    padding: 4,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    maxWidth: '90%',
  },
  bioInput: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    maxWidth: '90%',
    width: '100%',
    padding: 4,
    minHeight: 60,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  socialLink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 32,
    width: '100%',
  },
  configButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  accordionSection: {
    width: '100%',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  accordionItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  completedIcon: {
    marginRight: 4,
  },
  accordionHeaderText: {
    flex: 1,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accordionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  accordionDescriptionFull: {
    fontSize: 14,
  },
  accordionContent: {
    padding: 16,
    paddingTop: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
