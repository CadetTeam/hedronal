import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { EntityCreationModal } from './EntityCreationModal';

const ACCORDION_ITEMS = [
  { key: 'Domain', description: 'Configure your entity\'s domain name and website settings' },
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

export function EntityProfileModal({ visible, onClose, entity, onUpdate }: EntityProfileModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showAccordionModal, setShowAccordionModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set(entity?.completedItems || []));
  const [step2Data, setStep2Data] = useState<{ [key: string]: any }>(entity?.step2Data || {});

  React.useEffect(() => {
    if (entity) {
      setCompletedItems(new Set(entity.completedItems || []));
      setStep2Data(entity.step2Data || {});
    }
  }, [entity]);

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
              },
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom * 2 + 100 }]}
              showsVerticalScrollIndicator={false}
            >
              {/* Banner */}
              <TouchableOpacity activeOpacity={0.8}>
                <View
                  style={[
                    styles.banner,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  {entity.banner ? (
                    <Image source={{ uri: entity.banner }} style={styles.bannerImage} />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />
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

                <Text style={[styles.name, { color: theme.colors.text }]}>
                  {entity.name}
                </Text>

                <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
                  {entity.handle ? `@${entity.handle}` : ''}
                </Text>

                {entity.brief && (
                  <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
                    {entity.brief}
                  </Text>
                )}

                {/* Social Links */}
                {entity.socialLinks && entity.socialLinks.length > 0 && (
                  <View style={styles.socialLinks}>
                    {entity.socialLinks.map((link: any, index: number) => {
                      const iconName = SOCIAL_ICONS[link.type] || 'globe-outline';
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.socialLink, { backgroundColor: theme.colors.surfaceVariant }]}
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
                  {ACCORDION_ITEMS.map((item) => {
                    const isExpanded = expandedItems.has(item.key);
                    const isCompleted = completedItems.has(item.key);
                    return (
                      <View key={item.key} style={[styles.accordionItem, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}>
                        <TouchableOpacity
                          style={styles.accordionHeader}
                          onPress={() => toggleAccordionItem(item.key)}
                        >
                          <View style={styles.accordionHeaderLeft}>
                            {isCompleted && (
                              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success || '#10b981'} style={styles.completedIcon} />
                            )}
                            <View style={styles.accordionHeaderText}>
                              <Text style={[styles.accordionTitle, { color: theme.colors.text }]}>{item.key}</Text>
                              {!isExpanded && (
                                <Text style={[styles.accordionDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
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
                            <Text style={[styles.accordionDescriptionFull, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                              {item.description}
                            </Text>
                            <TextInput
                              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                              placeholder={`Enter ${item.key.toLowerCase()} information`}
                              placeholderTextColor={theme.colors.textTertiary}
                              value={step2Data[item.key] || ''}
                              onChangeText={(value) => {
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
                                  backgroundColor: isCompleted ? theme.colors.success || '#10b981' : theme.colors.primary,
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
                              <Text style={[styles.completeButtonText, { color: theme.colors.background }]}>
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
                colors={isDark ? [`${theme.colors.surface}ff`, `${theme.colors.surface}00`] : [`${theme.colors.surface}ff`, `${theme.colors.surface}00`]}
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {entity.name}
              </Text>
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
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    maxWidth: '90%',
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

