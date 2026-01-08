import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface PostMenuPopoverProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition: { x: number; y: number };
  isOwnPost: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = 200;
const MENU_ITEM_HEIGHT = 50;

export function PostMenuPopover({
  visible,
  onClose,
  anchorPosition,
  isOwnPost,
  onEdit,
  onShare,
  onDelete,
  onHide,
  onBlock,
  onReport,
}: PostMenuPopoverProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  // Calculate menu position - top right corner should cover the ellipsis
  const menuTop = anchorPosition.y - 8; // 8px above the anchor
  const menuRight = SCREEN_WIDTH - anchorPosition.x - 8; // 8px from right edge

  const menuItems = isOwnPost
    ? [
        { label: 'Edit', icon: 'create-outline', onPress: onEdit, color: theme.colors.text },
        { label: 'Share', icon: 'share-outline', onPress: onShare, color: theme.colors.text },
        { label: 'Delete', icon: 'trash-outline', onPress: onDelete, color: theme.colors.error },
      ]
    : [
        { label: 'Hide Post', icon: 'eye-off-outline', onPress: onHide, color: theme.colors.text },
        { label: 'Block User', icon: 'ban-outline', onPress: onBlock, color: theme.colors.text },
        { label: 'Report Post', icon: 'flag-outline', onPress: onReport, color: theme.colors.error },
      ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              top: menuTop,
              right: menuRight,
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                item.onPress?.();
                onClose();
              }}
            >
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={[styles.menuItemText, { color: item.color }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

