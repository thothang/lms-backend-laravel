import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function NotificationsScreen({ navigation }) {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userService.getNotifications(),
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : (notificationsData?.notifications || []);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => userService.markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        const oldArray = Array.isArray(old) ? old : (old.notifications || []);
        const newArray = oldArray.map(n => n.id === id ? { ...n, is_read: true } : n);
        return Array.isArray(old) ? newArray : { ...old, notifications: newArray };
      });
      return { previousNotifications };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['notifications'], context.previousNotifications);
      console.error('Error marking notification as read', err);
    },
    onSettled: () => {
      // Background refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationPress = useCallback((notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Show details in an alert
    Alert.alert(
      notification.title,
      notification.content,
      [{ text: 'Đóng' }]
    );
  }, [markAsReadMutation]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.is_read ? "notifications-outline" : "notifications"} 
          size={24} 
          color={item.is_read ? "#a4b0be" : "#0097e6"} 
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.is_read && styles.unreadText]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString('vi-VN')}
        </Text>
        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleNotificationPress]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0097e6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#dcdde1" />
          <Text style={styles.emptyText}>Bạn không có thông báo nào</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#f1f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0097e6',
  },
  iconContainer: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f3640',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    fontSize: 12,
    color: '#a4b0be',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#718093',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#718093',
  },
});
