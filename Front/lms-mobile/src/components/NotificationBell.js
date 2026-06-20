import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { userService } from '../api/userService';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userService.getNotifications(),
    enabled: !!user,
    refetchInterval: 30000, // Tự động refetch mỗi 30s
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : (notificationsData?.notifications || []);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => navigation.navigate('Notifications')}
    >
      <Ionicons name="notifications-outline" size={24} color="#2f3640" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e84118',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
