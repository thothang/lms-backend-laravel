import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import Skeleton from '../components/Skeleton';

export default function MyReservationsScreen({ navigation }) {
  const { data: reservations, isLoading, isError, refetch } = useQuery({
    queryKey: ['myReservations'],
    queryFn: () => userService.getReservations()
  });

  const renderListSkeleton = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.card}>
          <Skeleton width={70} height={100} borderRadius={6} style={{ marginRight: 15 }} />
          <View style={styles.info}>
            <Skeleton width="90%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={14} style={{ marginBottom: 10 }} />
            <Skeleton width={100} height={24} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return renderListSkeleton();
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Đã có lỗi xảy ra khi tải danh sách đặt trước.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const book = item.book || {};
    // status: pending, approved, rejected, canceled, fulfilled
    let statusColor = '#7f8fa6';
    let statusLabel = 'Không xác định';

    switch (item.status) {
      case 'pending':
        statusColor = '#f39c12';
        statusLabel = 'Đang chờ duyệt';
        break;
      case 'approved':
        statusColor = '#3498db';
        statusLabel = 'Đã duyệt';
        break;
      case 'rejected':
      case 'canceled':
        statusColor = '#e74c3c';
        statusLabel = item.status === 'rejected' ? 'Bị từ chối' : 'Đã hủy';
        break;
      case 'fulfilled':
        statusColor = '#2ecc71';
        statusLabel = 'Đã nhận sách';
        break;
    }
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('BookDetail', { bookId: book.id, type: 'book' })}
      >
        {book.cover_image ? (
          <Image source={{ uri: book.cover_image }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book" size={24} color="#dcdde1" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{book.title || 'Sách không xác định'}</Text>
          <Text style={styles.date}>Ngày đặt: {moment(item.reservation_date).format('DD/MM/YYYY HH:mm')}</Text>
          <Text style={styles.date}>Hạn lấy sách: {item.valid_until ? moment(item.valid_until).format('DD/MM/YYYY HH:mm') : 'Chưa có'}</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={60} color="#dcdde1" />
            <Text style={styles.emptyText}>Bạn chưa đặt trước cuốn sách nào.</Text>
          </View>
        )}
      />
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
    padding: 20,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cover: {
    width: 70,
    height: 100,
    borderRadius: 6,
    marginRight: 15,
  },
  coverPlaceholder: {
    width: 70,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#f1f2f6',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
  },
  date: {
    fontSize: 13,
    color: '#718093',
    marginBottom: 2,
  },
  statusRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#718093',
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#e84118',
    marginBottom: 15,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#0097e6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
