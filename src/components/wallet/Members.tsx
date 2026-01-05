import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../EmptyState';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatar?: string;
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  permissions: string[];
}

interface MembersProps {
  members?: Member[];
  onMemberPress?: (member: Member) => void;
  onInvitePress?: () => void;
}

const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@acmecapital.com',
    role: 'owner',
    status: 'active',
    joinedDate: '2023-01-15',
    permissions: ['full_access'],
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@acmecapital.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2023-03-20',
    permissions: ['manage_finances', 'view_reports'],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@acmecapital.com',
    role: 'member',
    status: 'active',
    joinedDate: '2023-06-10',
    permissions: ['view_transactions'],
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david@acmecapital.com',
    role: 'member',
    status: 'pending',
    joinedDate: '2024-01-10',
    permissions: ['view_transactions'],
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa@acmecapital.com',
    role: 'viewer',
    status: 'active',
    joinedDate: '2023-09-05',
    permissions: ['view_only'],
  },
];

export function Members({ members = MOCK_MEMBERS, onMemberPress, onInvitePress }: MembersProps) {
  const { theme } = useTheme();

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'owner':
        return theme.colors.primary;
      case 'admin':
        return theme.colors.warning || '#f59e0b';
      case 'member':
        return theme.colors.success || '#10b981';
      case 'viewer':
        return theme.colors.textTertiary;
      default:
        return theme.colors.textSecondary;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return theme.colors.success || '#10b981';
      case 'pending':
        return theme.colors.warning || '#f59e0b';
      case 'inactive':
        return theme.colors.error || '#ef4444';
      default:
        return theme.colors.textTertiary;
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner':
        return 'shield-checkmark';
      case 'admin':
        return 'settings';
      case 'member':
        return 'person';
      case 'viewer':
        return 'eye';
      default:
        return 'person-outline';
    }
  }

  function renderMember({ item }: { item: Member }) {
    const roleColor = getRoleColor(item.role);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[
          styles.memberCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onMemberPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.memberLeft}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  backgroundColor: `${roleColor}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: roleColor,
                  },
                ]}
              >
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.memberInfo}>
            <View style={styles.memberHeader}>
              <Text style={[styles.memberName, { color: theme.colors.text }]}>{item.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${statusColor}20`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: statusColor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: statusColor,
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
              {item.email}
            </Text>
            <View style={styles.memberMeta}>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: `${roleColor}20`,
                  },
                ]}
              >
                <Ionicons name={getRoleIcon(item.role)} size={14} color={roleColor} />
                <Text
                  style={[
                    styles.roleText,
                    {
                      color: roleColor,
                    },
                  ]}
                >
                  {item.role}
                </Text>
              </View>
              <Text style={[styles.joinedDate, { color: theme.colors.textTertiary }]}>
                Joined {formatDate(item.joinedDate)}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    );
  }

  if (members.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No members yet"
          message="Invite team members to collaborate on your wallet"
          icon="people-outline"
        />
        {onInvitePress && (
          <TouchableOpacity
            style={[
              styles.inviteButton,
              {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={onInvitePress}
          >
            <Ionicons name="person-add" size={20} color={theme.colors.background} />
            <Text style={[styles.inviteButtonText, { color: theme.colors.background }]}>
              Invite Member
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onInvitePress && (
        <TouchableOpacity
          style={[
            styles.inviteButton,
            {
              backgroundColor: theme.colors.primary,
              marginBottom: 16,
            },
          ]}
          onPress={onInvitePress}
        >
          <Ionicons name="person-add" size={20} color={theme.colors.background} />
          <Text style={[styles.inviteButtonText, { color: theme.colors.background }]}>
            Invite Member
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  memberEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  joinedDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    gap: 24,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
