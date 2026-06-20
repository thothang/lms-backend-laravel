import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, ScrollView } from 'react-native';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useLoading } from '../context/LoadingContext';

export default function BorrowScreen({ route, navigation }) {
  const { book } = route.params;
  const [daysText, setDaysText] = useState('7');
  const { showLoading, hideLoading } = useLoading();
  const queryClient = useQueryClient();

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['userBalance'],
    queryFn: () => userService.getBalance(),
  });

  const userBalance = Number(balanceData?.balance || 0);

  // Calculate fees based on backend logic
  const bookPrice = Number(book.price || 0);
  const depositAmount = book.deposit_fee ? Number(book.deposit_fee) : Math.min(bookPrice * 0.5, 300000);
  const dailyFee = Number(book.daily_fee || 5000);
  
  const days = parseInt(daysText) || 0;
  const borrowFee = dailyFee * days;
  const totalCost = depositAmount + borrowFee;
  const isInsufficient = userBalance < totalCost;

  const handleBorrow = async () => {
    if (days <= 0) {
      Alert.alert('Lỗi', 'Số ngày mượn phải lớn hơn 0');
      return;
    }
    
    showLoading();
    try {
      await userService.borrowBook(book.id, days);
      Alert.alert('Thành công', 'Bạn đã mượn sách thành công! Vui lòng đến thư viện để nhận sách.', [
        { 
          text: 'OK', 
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ['userBalance'] });
            queryClient.invalidateQueries({ queryKey: ['book', book.id] });
            navigation.navigate('Main', { screen: 'Profile' });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || error.response?.data?.error || 'Không thể mượn sách. Vui lòng kiểm tra lại số dư ví.');
    } finally {
      hideLoading();
    }
  };

  const dayOptions = [7, 14, 21, 30];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.bookInfo}>
        {book.cover_image && (
          <Image source={{ uri: book.cover_image }} style={styles.cover} />
        )}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.author}>{book.author_name || book.author}</Text>
          {book.category && (
            <Text style={styles.infoText}>Thể loại: {book.category.name}</Text>
          )}
          {book.publisher && (
            <Text style={styles.infoText}>NXB: {book.publisher}</Text>
          )}
          <Text style={styles.infoText}>Giá bìa: {bookPrice.toLocaleString('vi-VN')} ₫</Text>
          <Text style={styles.infoText}>Phí mượn / ngày: <Text style={{fontWeight: 'bold', color: '#e84118'}}>{dailyFee.toLocaleString('vi-VN')} ₫</Text></Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Chọn thời gian mượn</Text>
      <View style={styles.optionsContainer}>
        {dayOptions.map((opt) => (
          <TouchableOpacity 
            key={opt}
            style={[styles.optionBtn, days === opt && styles.optionBtnActive]}
            onPress={() => setDaysText(opt.toString())}
          >
            <Text style={[styles.optionText, days === opt && styles.optionTextActive]}>{opt} ngày</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customDaysContainer}>
        <Text style={styles.customDaysLabel}>Hoặc nhập số ngày cụ thể:</Text>
        <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none" 
          style={styles.daysInput}
          value={daysText}
          onChangeText={setDaysText}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tạm giữ (Cọc):</Text>
          <Text style={styles.summaryValue}>{depositAmount.toLocaleString('vi-VN')} ₫</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí mượn ({days} ngày):</Text>
          <Text style={styles.summaryValue}>{borrowFee.toLocaleString('vi-VN')} ₫</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalValue}>{totalCost.toLocaleString('vi-VN')} ₫</Text>
        </View>
        <Text style={styles.note}>* Số tiền cọc sẽ được hoàn lại vào ví sau khi bạn trả sách đúng hạn.</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet-outline" size={20} color="#2f3640" />
          <Text style={styles.balanceTitle}>Số dư ví của bạn:</Text>
        </View>
        {balanceLoading ? (
          <ActivityIndicator size="small" color="#0097e6" />
        ) : (
          <Text style={[styles.balanceAmount, isInsufficient && styles.balanceInsufficient]}>
            {userBalance.toLocaleString('vi-VN')} ₫
          </Text>
        )}
      </View>

      {isInsufficient && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color="#e84118" style={{ marginTop: 2 }} />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningText}>Số dư của bạn không đủ để mượn sách này. Vui lòng nạp thêm tiền.</Text>
            <TouchableOpacity 
              style={styles.depositBtn}
              onPress={() => navigation.navigate('Deposit')}
            >
              <Text style={styles.depositBtnText}>Nạp tiền ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.submitBtn, (isInsufficient || days <= 0) && styles.submitBtnDisabled]} 
        onPress={handleBorrow} 
        disabled={isInsufficient || days <= 0}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{marginRight: 8}} />
        <Text style={styles.submitBtnText}>Xác nhận Mượn Sách</Text>
      </TouchableOpacity>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  bookInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    marginRight: 15,
    backgroundColor: '#f1f2f6',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 8,
  },
  author: {
    fontSize: 15,
    color: '#0097e6',
    marginBottom: 6,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#718093',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  optionBtnActive: {
    backgroundColor: '#0097e6',
    borderColor: '#0097e6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  optionTextActive: {
    color: '#fff',
  },
  customDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  customDaysLabel: {
    fontSize: 15,
    color: '#2f3640',
    marginRight: 10,
  },
  daysInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    width: 60,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#718093',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f3640',
  },
  divider: {
    height: 1,
    backgroundColor: '#dcdde1',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e84118',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e84118',
  },
  note: {
    fontSize: 13,
    color: '#7f8fa6',
    fontStyle: 'italic',
    marginTop: 10,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0097e6',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4cd137',
  },
  balanceInsufficient: {
    color: '#e84118',
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffefef',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#e84118',
    marginBottom: 10,
    lineHeight: 20,
  },
  depositBtn: {
    backgroundColor: '#e84118',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  depositBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#4cd137',
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#b2bec3',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
