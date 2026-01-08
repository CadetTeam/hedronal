import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  FlatList,
  Keyboard,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useClerkContext } from '../context/ClerkContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { useEntityCreation } from '../services/entityService';
import { fetchProvidersByCategory, Provider } from '../services/providerService';
import { useAuth } from '@clerk/clerk-expo';

const ENTITY_DRAFT_KEY = '@entity_draft';

interface EntityDraft {
  step: number;
  step1?: {
    name: string;
    handle: string;
    banner?: string;
    avatar?: string;
    brief: string;
    socialLinks: Array<{ type: string; url: string }>;
  };
  step2?: {
    data: { [key: string]: any };
    completedItems: string[];
  };
  step3?: {
    selectedContacts: Array<{ id: string; name: string; phone?: string; email?: string }>;
  };
}

interface EntityCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (entity: any) => void;
}

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

const SOCIAL_ICONS = [
  { name: 'logo-twitter', label: 'Twitter', type: 'twitter' },
  { name: 'logo-linkedin', label: 'LinkedIn', type: 'linkedin' },
  { name: 'logo-github', label: 'GitHub', type: 'github' },
  { name: 'logo-instagram', label: 'Instagram', type: 'instagram' },
  { name: 'globe-outline', label: 'Website', type: 'website' },
  { name: 'mail-outline', label: 'Email', type: 'email' },
];

export function EntityCreationModal({ visible, onClose, onComplete }: EntityCreationModalProps) {
  const { theme, isDark } = useTheme();
  const { userId } = useClerkContext();
  const { getToken } = useAuth();
  const { createEntityWithOrganization } = useEntityCreation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showMinimizedTitle, setShowMinimizedTitle] = useState(false);
  const scrollY = useSharedValue(0);
  const minimizedTitleOpacity = useRef(new Animated.Value(0)).current;
  const minimizedTitleTranslateY = useRef(new Animated.Value(20)).current;

  // Step 1 state
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [banner, setBanner] = useState<string | undefined>();
  const [avatar, setAvatar] = useState<string | undefined>();
  const [brief, setBrief] = useState('');
  const [socialLinks, setSocialLinks] = useState<Array<{ type: string; url: string }>>([]);
  const [showSocialDropdown, setShowSocialDropdown] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'brief' | null>(null);

  // Step 2 state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [step2Data, setStep2Data] = useState<{ [key: string]: any }>({});
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [providers, setProviders] = useState<{ [key: string]: Provider[] }>({});
  const [loadingProviders, setLoadingProviders] = useState<{ [key: string]: boolean }>({});

  // Step 3 state
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; phone?: string; email?: string }>
  >([]);
  const [people, setPeople] = useState<
    Array<{ id: string; name: string; phone?: string; email?: string }>
  >([]);
  const [selectedContacts, setSelectedContacts] = useState<
    Array<{ id: string; name: string; phone?: string; email?: string }>
  >([]);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSource, setInviteSource] = useState<'contacts' | 'people' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sort and filter contacts/people alphabetically by name
  const sortedAndFilteredList = useMemo(() => {
    const sourceList =
      inviteSource === 'contacts' ? contacts : inviteSource === 'people' ? people : [];

    // Sort alphabetically by name
    const sorted = [...sourceList].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return sorted.filter(item => {
        const name = item.name.toLowerCase();
        const phone = item.phone?.toLowerCase() || '';
        const email = item.email?.toLowerCase() || '';
        return name.includes(query) || phone.includes(query) || email.includes(query);
      });
    }

    return sorted;
  }, [inviteSource, contacts, people, searchQuery]);

  useEffect(() => {
    if (visible) {
      loadDraft();
    }
  }, [visible]);

  // Reset minimized title when step changes
  useEffect(() => {
    setShowMinimizedTitle(false);
    minimizedTitleOpacity.setValue(0);
    minimizedTitleTranslateY.setValue(20);
  }, [currentStep]);

  // Auto-load contacts when step 3 loads if permission already granted
  useEffect(() => {
    if (currentStep === 3 && inviteSource === null) {
      checkAndLoadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  async function checkAndLoadContacts() {
    try {
      // Check if permission is already granted
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') {
        // Permission already granted, load contacts automatically
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });
        if (data && data.length > 0) {
          setContacts(
            data.map(contact => ({
              id: contact.id,
              name: contact.name || 'Unknown',
              phone: contact.phoneNumbers?.[0]?.number,
              email: contact.emails?.[0]?.email,
            }))
          );
          setInviteSource('contacts');
        }
      }
    } catch (error) {
      // Silently fail - user can still manually import
      console.log('[EntityCreationModal] Could not auto-load contacts:', error);
    }
  }

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    // Generate handle from name
    if (name) {
      const generatedHandle = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setHandle(generatedHandle);
    }
  }, [name]);

  useEffect(() => {
    // Generate invite message when contacts are selected
    if (selectedContacts.length > 0 && !inviteMessage) {
      const deepLink = 'https://apps.apple.com/app/hedronal'; // Replace with actual deep link
      const message = `Hi! I'd like to invite you to join Hedronal, a platform for managing entities, portfolios, and connections. Download the app here: ${deepLink}`;
      setInviteMessage(message);
    }
  }, [selectedContacts]);

  async function loadDraft() {
    try {
      const draftJson = await AsyncStorage.getItem(ENTITY_DRAFT_KEY);
      if (draftJson) {
        const draft: EntityDraft = JSON.parse(draftJson);
        setCurrentStep(draft.step || 1);
        if (draft.step1) {
          setName(draft.step1.name || '');
          setHandle(draft.step1.handle || '');
          setBanner(draft.step1.banner);
          setAvatar(draft.step1.avatar);
          setBrief(draft.step1.brief || '');
          setSocialLinks(draft.step1.socialLinks || []);
        }
        if (draft.step2) {
          setStep2Data(draft.step2.data || {});
          setCompletedItems(new Set(draft.step2.completedItems || []));
        }
        if (draft.step3) {
          setSelectedContacts(draft.step3.selectedContacts || []);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }

  async function saveDraft() {
    try {
      const draft: EntityDraft = {
        step: currentStep,
        step1: {
          name,
          handle,
          banner,
          avatar,
          brief,
          socialLinks,
        },
        step2: {
          data: step2Data,
          completedItems: Array.from(completedItems),
        },
        step3: {
          selectedContacts,
        },
      };
      await AsyncStorage.setItem(ENTITY_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }

  async function clearDraft() {
    try {
      await AsyncStorage.removeItem(ENTITY_DRAFT_KEY);
      resetForm();
      Alert.alert('Draft Cleared', 'Your draft has been cleared.');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }

  function resetForm() {
    setCurrentStep(1);
    setName('');
    setHandle('');
    setBanner(undefined);
    setAvatar(undefined);
    setBrief('');
    setSocialLinks([]);
    setStep2Data({});
    setSelectedContacts([]);
    setExpandedItems(new Set());
    setHasScrolledToBottom(false);
    setShowMenu(false);
  }

  async function handleClose() {
    await saveDraft();
    onClose();
  }

  async function pickImage(type: 'banner' | 'avatar') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'banner' ? [16, 9] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'banner') {
        setBanner(result.assets[0].uri);
      } else {
        setAvatar(result.assets[0].uri);
      }
    }
  }

  async function toggleAccordionItem(item: string) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(item)) {
      newExpanded.delete(item);
    } else {
      newExpanded.add(item);
      // Fetch providers when expanding
      if (!providers[item] && !loadingProviders[item]) {
        setLoadingProviders({ ...loadingProviders, [item]: true });
        try {
          const token = await getToken();
          const categoryProviders = await fetchProvidersByCategory(item, token || undefined);
          setProviders({ ...providers, [item]: categoryProviders });
        } catch (error) {
          console.error(`[EntityCreationModal] Error fetching providers for ${item}:`, error);
        } finally {
          setLoadingProviders({ ...loadingProviders, [item]: false });
        }
      }
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
  }

  function handleScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const offsetY = contentOffset.y;

    // Update scroll position for minimized title
    scrollY.value = offsetY;
    const shouldShow = offsetY > 50;

    if (shouldShow !== showMinimizedTitle) {
      setShowMinimizedTitle(shouldShow);

      // Animate title appearance
      Animated.parallel([
        Animated.timing(minimizedTitleOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(minimizedTitleTranslateY, {
          toValue: shouldShow ? 0 : 20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Check if scrolled to bottom (for step 2)
    if (currentStep === 2) {
      const paddingToBottom = 20;
      const isAtBottom = layoutMeasurement.height + offsetY >= contentSize.height - paddingToBottom;
      setHasScrolledToBottom(isAtBottom);
    }
  }

  async function requestContactsPermission() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      setContacts(
        data.map(contact => ({
          id: contact.id,
          name: contact.name || 'Unknown',
          phone: contact.phoneNumbers?.[0]?.number,
          email: contact.emails?.[0]?.email,
        }))
      );
      setInviteSource('contacts');
    } else {
      Alert.alert('Permission Denied', 'Please grant contacts permission to import contacts.');
    }
  }

  function loadPeople() {
    // TODO: Load people from People screen/context
    // For now, this is a placeholder
    setInviteSource('people');
  }

  function toggleContactSelection(contact: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  }) {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  }

  function canProceedToStep2() {
    return name.trim().length > 0 && brief.trim().length > 0;
  }

  function canProceedToStep3() {
    return hasScrolledToBottom;
  }

  async function handleNext() {
    await saveDraft();
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
      setHasScrolledToBottom(false);
    } else if (currentStep === 2 && canProceedToStep3()) {
      setCurrentStep(3);
      // Don't auto-load contacts, let user choose
    }
  }

  async function handleComplete() {
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to create an entity.');
      return;
    }

    try {
      // Create entity data
      const entityData = {
        name,
        handle,
        banner,
        avatar,
        brief,
        type: step2Data.type || undefined,
        socialLinks,
        step2Data,
        completedItems: Array.from(completedItems),
        invitedContacts: selectedContacts,
      };

      // Create Clerk organization and save to Supabase (via service)
      const result = await createEntityWithOrganization(entityData);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create entity');
        return;
      }

      const entity = {
        id: result.entityId || `entity-${Date.now()}`,
        clerkOrgId: result.clerkOrgId,
        name,
        handle,
        banner,
        avatar,
        brief,
        socialLinks,
        step2Data,
        completedItems: Array.from(completedItems),
        invitedContacts: selectedContacts,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.removeItem(ENTITY_DRAFT_KEY);
      resetForm();
      onComplete(entity);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create entity. Please try again.');
    }
  }

  async function handleSendInvites() {
    setShowInviteMessage(true);
  }

  async function sendInvites() {
    // In a real app, you would send the invites via SMS/Email
    Alert.alert('Invites Sent', `${selectedContacts.length} invitation(s) sent successfully.`);
    setShowInviteMessage(false);
    await handleComplete();
  }

  function renderStep1() {
    return (
      <View style={styles.stepContainer}>
        <ScrollView
          style={styles.stepContent}
          contentContainerStyle={[
            styles.stepContentContainer,
            { paddingBottom: insets.bottom * 2 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Profile</Text>
          <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
            Set up your entity's profile information
          </Text>

          {/* Banner */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => pickImage('banner')}>
            <View
              style={[
                styles.banner,
                { backgroundColor: banner ? theme.colors.background : theme.colors.primary },
              ]}
            >
              {banner ? (
                <Image source={{ uri: banner }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={theme.colors.background} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.avatarContainer}
            onPress={() => pickImage('avatar')}
          >
            <View style={[styles.avatar, { backgroundColor: theme.colors.background }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={32} color={theme.colors.textTertiary} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Name <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setEditingField('name')}
              style={[
                styles.input,
                styles.inputTouchable,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.inputText,
                  { color: name ? theme.colors.text : theme.colors.textTertiary },
                ]}
              >
                {name || 'Entity name'}
              </Text>
            </TouchableOpacity>
            {handle && (
              <Text style={[styles.handlePreview, { color: theme.colors.textSecondary }]}>
                Handle: @{handle}
              </Text>
            )}
          </View>

          {/* Brief */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Brief <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setEditingField('brief')}
              style={[
                styles.textArea,
                styles.inputTouchable,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.inputText,
                  { color: brief ? theme.colors.text : theme.colors.textTertiary },
                ]}
              >
                {brief || 'Company bio'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Links */}
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
                  setSocialLinks([...socialLinks, { type: 'twitter', url: '' }]);
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
                        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
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
                          <Ionicons name={social.name as any} size={20} color={theme.colors.text} />
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

        {/* Sticky Input Bar for Name */}
        {editingField === 'name' && (
          <>
            <TouchableOpacity
              style={styles.inputOverlay}
              activeOpacity={1}
              onPress={() => {
                setEditingField(null);
                Keyboard.dismiss();
              }}
            />
            <View
              style={[
                styles.stickyInputBar,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  bottom: keyboardVisible ? keyboardHeight : insets.bottom,
                },
              ]}
            >
              <Text style={[styles.stickyInputLabel, { color: theme.colors.text }]}>Name</Text>
              <TextInput
                style={[styles.stickyInput, { color: theme.colors.text }]}
                placeholder="Entity name"
                placeholderTextColor={theme.colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoFocus
                onBlur={() => {
                  setEditingField(null);
                }}
              />
              {name.length > 0 && (
                <TouchableOpacity
                  onPress={() => setName('')}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Sticky Input Bar for Brief */}
        {editingField === 'brief' && (
          <>
            <TouchableOpacity
              style={styles.inputOverlay}
              activeOpacity={1}
              onPress={() => {
                setEditingField(null);
                Keyboard.dismiss();
              }}
            />
            <View
              style={[
                styles.stickyInputBar,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  bottom: keyboardVisible ? keyboardHeight : insets.bottom,
                },
              ]}
            >
              <Text style={[styles.stickyInputLabel, { color: theme.colors.text }]}>Brief</Text>
              <TextInput
                style={[
                  styles.stickyInput,
                  styles.stickyInputMultiline,
                  { color: theme.colors.text },
                ]}
                placeholder="Company bio"
                placeholderTextColor={theme.colors.textTertiary}
                value={brief}
                onChangeText={setBrief}
                multiline
                autoFocus
                onBlur={() => {
                  setEditingField(null);
                }}
              />
              {brief.length > 0 && (
                <TouchableOpacity
                  onPress={() => setBrief('')}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  }

  function renderStep2() {
    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.stepContent}
        contentContainerStyle={[
          styles.stepContentContainer,
          { paddingBottom: insets.bottom * 2 + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Configuration</Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          Configure your entity settings. Scroll to the bottom to continue.
        </Text>

        {ACCORDION_ITEMS.map(item => {
          const isExpanded = expandedItems.has(item.key);
          const isCompleted = completedItems.has(item.key);
          return (
            <View
              key={item.key}
              style={[
                styles.accordionItem,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
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
                        style={[styles.accordionDescription, { color: theme.colors.textSecondary }]}
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
                  
                  {/* Provider Selection */}
                  {loadingProviders[item.key] ? (
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                      Loading providers...
                    </Text>
                  ) : providers[item.key] && providers[item.key].length > 0 ? (
                    <View style={styles.providersContainer}>
                      <Text style={[styles.providersLabel, { color: theme.colors.text }]}>
                        Select a Provider
                      </Text>
                      {providers[item.key].map(provider => {
                        const selectedProvider = step2Data[item.key]?.providerId === provider.id;
                        return (
                          <TouchableOpacity
                            key={provider.id}
                            style={[
                              styles.providerItem,
                              {
                                backgroundColor: selectedProvider
                                  ? theme.colors.primary + '20'
                                  : theme.colors.surfaceVariant,
                                borderColor: selectedProvider
                                  ? theme.colors.primary
                                  : theme.colors.border,
                              },
                            ]}
                            onPress={() => {
                              const updatedData = {
                                ...step2Data,
                                [item.key]: {
                                  providerId: provider.id,
                                  providerName: provider.company_name,
                                  providerUrl: provider.url,
                                  pricingPageUrl: provider.pricing_page_url,
                                  pricing: provider.pricing,
                                  notes: step2Data[item.key]?.notes || '',
                                },
                              };
                              setStep2Data(updatedData);
                            }}
                          >
                            <View style={styles.providerInfo}>
                              <Text style={[styles.providerName, { color: theme.colors.text }]}>
                                {provider.company_name}
                              </Text>
                              {provider.pricing && (
                                <Text
                                  style={[styles.providerPricing, { color: theme.colors.textSecondary }]}
                                >
                                  {provider.pricing}
                                </Text>
                              )}
                            </View>
                            {selectedProvider && (
                              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Notes/Additional Information */}
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                        marginTop: 12,
                      },
                    ]}
                    placeholder={`Add notes or additional ${item.key.toLowerCase()} information`}
                    placeholderTextColor={theme.colors.textTertiary}
                    value={step2Data[item.key]?.notes || ''}
                    onChangeText={notes => {
                      const updatedData = {
                        ...step2Data,
                        [item.key]: {
                          ...step2Data[item.key],
                          notes,
                        },
                      };
                      setStep2Data(updatedData);
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
                    <Text style={[styles.completeButtonText, { color: theme.colors.background }]}>
                      {isCompleted ? 'Completed' : 'Mark as Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  function renderStep3() {
    return (
      <View style={styles.stepContent}>
        <ScrollView
          style={styles.stepContent}
          contentContainerStyle={[
            styles.stepContentContainer,
            {
              paddingBottom:
                insets.bottom * 2 +
                (selectedContacts.length > 0 ? 80 : 0) +
                (showInviteMessage ? 200 : 0),
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Invite People</Text>
          <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
            Invite people to join your entity (optional)
          </Text>

          {inviteSource !== null && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={theme.colors.textTertiary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search contacts..."
                placeholderTextColor={theme.colors.textTertiary}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearButton}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {inviteSource === null ? (
            <View style={styles.inviteSourceButtons}>
              <TouchableOpacity
                style={[styles.importButton, { backgroundColor: theme.colors.primary }]}
                onPress={requestContactsPermission}
              >
                <Ionicons name="person-add-outline" size={20} color={theme.colors.background} />
                <Text style={[styles.importButtonText, { color: theme.colors.background }]}>
                  Import Contacts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={loadPeople}
              >
                <Ionicons name="people-outline" size={20} color={theme.colors.text} />
                <Text style={[styles.importButtonText, { color: theme.colors.text }]}>
                  From People List
                </Text>
              </TouchableOpacity>
            </View>
          ) : sortedAndFilteredList.length === 0 ? (
            <View style={styles.emptyContacts}>
              <Text style={[styles.emptyContactsText, { color: theme.colors.textSecondary }]}>
                {searchQuery.trim()
                  ? 'No contacts found matching your search'
                  : inviteSource === 'contacts'
                    ? 'No contacts found'
                    : 'No people in your list'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedAndFilteredList}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedContacts.some(c => c.id === item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.contactItem,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                    onPress={() => toggleContactSelection(item)}
                  >
                    <View
                      style={[
                        styles.contactAvatar,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.contactAvatarText,
                          { color: isSelected ? theme.colors.background : theme.colors.text },
                        ]}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: theme.colors.text }]}>
                        {item.name}
                      </Text>
                      {item.phone && (
                        <Text style={[styles.contactDetail, { color: theme.colors.textSecondary }]}>
                          {item.phone}
                        </Text>
                      )}
                      {item.email && (
                        <Text style={[styles.contactDetail, { color: theme.colors.textSecondary }]}>
                          {item.email}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              scrollEnabled={false}
            />
          )}
        </ScrollView>

        {/* Send Invite Button */}
        {selectedContacts.length > 0 && (
          <View
            style={[
              styles.sendInviteButtonContainer,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
                bottom: keyboardVisible ? keyboardHeight : insets.bottom,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.sendInviteButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSendInvites}
            >
              <Text style={[styles.sendInviteButtonText, { color: theme.colors.background }]}>
                Send Invite ({selectedContacts.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invite Message - Sticky to Keyboard */}
        {showInviteMessage && (
          <View
            style={[
              styles.inviteMessageContainer,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
                bottom: keyboardVisible ? keyboardHeight : insets.bottom,
              },
            ]}
          >
            <View style={styles.inviteMessageHeader}>
              <Text style={[styles.inviteMessageTitle, { color: theme.colors.text }]}>
                Invitation Message
              </Text>
              <TouchableOpacity onPress={() => setShowInviteMessage(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View
              style={[styles.deepLinkContainer, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Text
                style={[styles.deepLinkText, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                https://apps.apple.com/app/hedronal
              </Text>
              <Ionicons name="lock-closed" size={16} color={theme.colors.textTertiary} />
            </View>
            <TextInput
              style={[
                styles.inviteMessageInput,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={inviteMessage}
              onChangeText={setInviteMessage}
              placeholder="Edit your invitation message..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={sendInvites}
            >
              <Text style={[styles.sendButtonText, { color: theme.colors.background }]}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  function getSocialIcon(type: string) {
    const icon = SOCIAL_ICONS.find(s => s.type === type);
    return icon?.name || 'globe-outline';
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <BlurredModalOverlay visible={visible} onClose={handleClose}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              minHeight: 500 + insets.bottom * 2,
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
            <View style={styles.headerLeft}>
              {currentStep === 3 ? (
                <TouchableOpacity onPress={() => setCurrentStep(2)}>
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
              {showMenu && (
                <View
                  style={[
                    styles.menu,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={async () => {
                      await clearDraft();
                      setShowMenu(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={async () => {
                      await saveDraft();
                      setShowMenu(false);
                      Alert.alert('Draft Saved', 'Your progress has been saved.');
                    }}
                  >
                    <Ionicons name="save-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                      Save as Draft
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      Alert.alert('Help', 'Need assistance? Contact support at help@hedronal.com');
                    }}
                  >
                    <Ionicons name="help-circle-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                      Get Help
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Create Entity ({currentStep}/3)
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Step Indicator with Minimized Title */}
          <View style={styles.stepIndicatorContainer}>
            <Animated.View
              style={[
                styles.minimizedTitleContainer,
                {
                  opacity: minimizedTitleOpacity,
                  transform: [{ translateY: minimizedTitleTranslateY }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={[styles.minimizedTitle, { color: theme.colors.text }]}>
                {currentStep === 1
                  ? 'Profile'
                  : currentStep === 2
                    ? 'Configuration'
                    : 'Invite People'}
              </Text>
            </Animated.View>
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map(step => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        step <= currentStep ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <View
              style={[
                styles.navigationButtons,
                { borderTopColor: theme.colors.border, paddingBottom: insets.bottom },
              ]}
            >
              {currentStep > 1 && (
                <TouchableOpacity
                  style={[styles.backButton, { borderColor: theme.colors.border }]}
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Text style={[styles.backButtonText, { color: theme.colors.text }]}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  {
                    backgroundColor:
                      (currentStep === 1 && !canProceedToStep2()) ||
                      (currentStep === 2 && !canProceedToStep3())
                        ? theme.colors.border
                        : theme.colors.primary,
                  },
                ]}
                onPress={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedToStep2()) ||
                  (currentStep === 2 && !canProceedToStep3())
                }
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    {
                      color:
                        (currentStep === 1 && !canProceedToStep2()) ||
                        (currentStep === 2 && !canProceedToStep3())
                          ? theme.colors.textTertiary
                          : theme.colors.background,
                    },
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Complete Button for Step 3 */}
          {currentStep === 3 && (
            <View
              style={[
                styles.navigationButtons,
                { borderTopColor: theme.colors.border, paddingBottom: insets.bottom },
              ]}
            >
              {selectedContacts.length === 0 && (
                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleComplete}
                >
                  <Text style={[styles.completeButtonText, { color: theme.colors.background }]}>
                    Complete
                  </Text>
                </TouchableOpacity>
              )}
              {selectedContacts.length > 0 && (
                <TouchableOpacity
                  style={[styles.backButton, { borderColor: theme.colors.border }]}
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Text style={[styles.backButtonText, { color: theme.colors.text }]}>Back</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </BlurredModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500,
    maxHeight: 650,
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
  headerLeft: {
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: 40,
    left: 0,
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 10,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  minimizedTitleContainer: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  minimizedTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepContentContainer: {
    padding: 16,
    paddingTop: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  banner: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginBottom: -50,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  bannerPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  stepContainer: {
    flex: 1,
    position: 'relative',
  },
  inputTouchable: {
    minHeight: 48,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
  },
  inputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  stickyInputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  stickyInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stickyInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 20,
  },
  stickyInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  handlePreview: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  socialLinksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addSocialLinkIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  inviteSourceButtons: {
    gap: 12,
    marginTop: 24,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  emptyContacts: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingLeft: 44,
    fontSize: 16,
    minHeight: 48,
  },
  searchClearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 12,
  },
  sendInviteButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sendInviteButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendInviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteMessageContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inviteMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteMessageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  deepLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  deepLinkText: {
    flex: 1,
    fontSize: 12,
  },
  inviteMessageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  sendButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepCompleteButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
  providersContainer: {
    marginBottom: 12,
  },
  providersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerPricing: {
    fontSize: 12,
  },
});
