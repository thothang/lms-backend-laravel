import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import Skeleton from '../components/Skeleton';

export default function MyBorrowsScreen({ navigation }) {
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [renewDays, setRenewDays] = useState('9');

  const { data: borrows, isLoading, isError, refetch } = useQuery({
    queryKey: ['myBorrows'],
    queryFn: () => userService.getBorrows()
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
            <Skeleton width={80} height={24} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return renderListSkeleton();
  }

  const handleRenew = (borrowId) => {
    const days = parseInt(renewDays, 10);
    if (!days || days < 1 || days > 30) {
      Alert.alert('Lỗi', 'Số ngày gia hạn không hợp lệ (1-30 ngày)');
      return;
    }

    Alert.alert('Xác nhận', `Bạn có chắc chắn muốn gia hạn phiếu mượn này thêm ${days} ngày không?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gia hạn', onPress: async () => {
          try {
            await userService.renewBorrow(borrowId, days);
            Alert.alert('Thành công', 'Gia hạn sách thành công!');
            setSelectedBorrow(null);
            refetch();
          } catch (error) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể gia hạn sách');
          }
        }
      }
    ]);
  };

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Đã có lỗi xảy ra khi tải danh sách mượn sách.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusInfo = (item) => {
    const isOverdue = item.status === 'active' && item.due_date && moment().startOf('day').isAfter(moment(item.due_date).startOf('day'));
    const displayStatus = isOverdue ? 'overdue' : item.status;

    let color = '#7f8fa6';
    let text = 'Đã trả';

    switch (displayStatus) {
      case 'active':
        color = '#4cd137';
        text = 'Đang mượn';
        break;
      case 'pending_pickup':
        color = '#f39c12';
        text = 'Chờ nhận sách';
        break;
      case 'pending_return':
        color = '#e67e22';
        text = 'Chờ thanh toán';
        break;
      case 'overdue':
        color = '#e84118';
        text = 'Quá hạn';
        break;
      case 'cancelled':
        color = '#e84118';
        text = 'Quá hạn lấy';
        break;
    }

    return { displayStatus, color, text };
  };

  const renderItem = ({ item }) => {
    const book = item.copy?.book || item.book || {};
    const { color, text } = getStatusInfo(item);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => setSelectedBorrow(item)}
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
          <Text style={styles.date}>Mã phiếu: #{item.id}</Text>
          <Text style={styles.date}>Ngày mượn: {moment(item.borrow_date).format('DD/MM/YYYY')}</Text>
          <Text style={styles.date}>Hạn trả: {moment(item.due_date).format('DD/MM/YYYY')}</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: color }]}>
              <Text style={styles.statusText}>{text}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => {
    if (!selectedBorrow) return null;

    const book = selectedBorrow.copy?.book || selectedBorrow.book || {};
    const { color, text } = getStatusInfo(selectedBorrow);

    const depositAmount = Number(selectedBorrow.deposit_amount || 0);
    const prepaidAmount = Number(selectedBorrow.prepaid_amount || 0);
    const totalCollected = depositAmount + prepaidAmount;
    const actualFee = Number(selectedBorrow.actual_fee || 0);

    return (
      <Modal
        visible={!!selectedBorrow}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBorrow(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết phiếu mượn</Text>
              <TouchableOpacity onPress={() => setSelectedBorrow(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#2f3640" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBookInfo}>
                {book.cover_image ? (
                  <Image source={{ uri: book.cover_image }} style={styles.modalCover} />
                ) : (
                  <View style={[styles.coverPlaceholder, styles.modalCover]}>
                    <Ionicons name="book" size={40} color="#dcdde1" />
                  </View>
                )}
                <View style={styles.modalBookDetails}>
                  <Text style={styles.modalBookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.modalBookAuthor}>{book.author_name || book.author}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: color, alignSelf: 'flex-start', marginTop: 10 }]}>
                    <Text style={styles.statusText}>{text}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thời gian</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày tạo phiếu:</Text>
                  <Text style={styles.detailValue}>{moment(selectedBorrow.borrow_date).format('DD/MM/YYYY HH:mm')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hạn trả sách:</Text>
                  <Text style={styles.detailValue}>{moment(selectedBorrow.due_date).format('DD/MM/YYYY')}</Text>
                </View>
                {selectedBorrow.actual_return_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày hoàn tất:</Text>
                    <Text style={styles.detailValue}>{moment(selectedBorrow.actual_return_date).format('DD/MM/YYYY HH:mm')}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Chi phí</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tiền cọc:</Text>
                  <Text style={styles.detailValue}>{depositAmount.toLocaleString('vi-VN')} ₫</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phí mượn trả trước:</Text>
                  <Text style={styles.detailValue}>{prepaidAmount.toLocaleString('vi-VN')} ₫</Text>
                </View>
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.detailLabelBold}>Tổng đã thu:</Text>
                  <Text style={styles.detailValueBold}>{totalCollected.toLocaleString('vi-VN')} ₫</Text>
                </View>

                {selectedBorrow.status === 'returned' || selectedBorrow.status === 'cancelled' ? (
                  <View style={[styles.detailRow, { marginTop: 10 }]}>
                    <Text style={styles.detailLabel}>Phí thực tế:</Text>
                    <Text style={[styles.detailValue, { color: '#e84118' }]}>
                      {actualFee.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity 
                style={styles.viewBookBtn}
                onPress={() => {
                  const id = book.id;
                  setSelectedBorrow(null);
                  navigation.navigate('BookDetail', { bookId: id, type: 'book' });
                }}
              >
                <Ionicons name="book-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.viewBookBtnText}>Xem chi tiết sách</Text>
              </TouchableOpacity>

              {selectedBorrow.status === 'active' && (
                <View style={[styles.detailSection, { marginTop: 5, backgroundColor: '#fffbe7', borderColor: '#ffeaa7', borderWidth: 1 }]}>
                  <Text style={styles.sectionTitle}>Gia hạn mượn sách</Text>
                  
                  <View style={{ marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ffeaa7' }}>
                    <View style={[styles.detailRow, { marginBottom: 5 }]}>
                      <Text style={styles.detailLabel}>Số lần đã gia hạn:</Text>
                      <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{selectedBorrow.renew_count || 0} / 2 lần</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phí thu thêm tạm tính:</Text>
                      <Text style={[styles.detailValueBold, { color: '#e84118' }]}>
                        {((parseInt(renewDays) || 0) * (parseFloat(selectedBorrow.daily_fee_applied) || 0)).toLocaleString('vi-VN')} ₫
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={{ flex: 1, fontSize: 14, color: '#2f3640' }}>Số ngày (tối đa 30 ngày):</Text>
                    <TextInput 
                      style={{ width: 60, height: 40, borderWidth: 1, borderColor: '#dcdde1', borderRadius: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', backgroundColor: '#fff' }}
                      keyboardType="numeric"
                      value={renewDays}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                        if (!text) {
                           setRenewDays('');
                        } else if (num > 30) {
                           setRenewDays('30');
                        } else {
                           setRenewDays(num.toString());
                        }
                      }}
                      maxLength={2}
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    {[7, 9, 14, 30].map(d => (
                      <TouchableOpacity 
                        key={d}
                        style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, borderColor: renewDays === d.toString() ? '#0097e6' : '#dcdde1', backgroundColor: renewDays === d.toString() ? '#0097e6' : '#fff' }}
                        onPress={() => setRenewDays(d.toString())}
                      >
                        <Text style={{ color: renewDays === d.toString() ? '#fff' : '#718093', fontWeight: 'bold' }}>{d} ngày</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[styles.viewBookBtn, { backgroundColor: '#eccc68', marginTop: 0 }]}
                    onPress={() => handleRenew(selectedBorrow.id)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#2f3640" style={{ marginRight: 8 }} />
                    <Text style={[styles.viewBookBtnText, { color: '#2f3640' }]}>Xác nhận gia hạn</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={borrows}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="journal-outline" size={60} color="#dcdde1" />
            <Text style={styles.emptyText}>Bạn chưa mượn cuốn sách nào.</Text>
          </View>
        )}
      />
      {renderModal()}
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
  errorText: {
    color: '#e84118',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0097e6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8fa6',
    marginTop: 15,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  closeBtn: {
    padding: 5,
  },
  modalBookInfo: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  modalCover: {
    width: 90,
    height: 130,
    borderRadius: 8,
  },
  modalBookDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  modalBookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
  },
  modalBookAuthor: {
    fontSize: 15,
    color: '#718093',
  },
  detailSection: {
    backgroundColor: '#f5f6fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718093',
  },
  detailValue: {
    fontSize: 14,
    color: '#2f3640',
    fontWeight: '500',
  },
  detailLabelBold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  detailValueBold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0097e6',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dcdde1',
  },
  viewBookBtn: {
    backgroundColor: '#0097e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  viewBookBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
