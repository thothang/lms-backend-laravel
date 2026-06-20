import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

export default function DepositScreen({ navigation }) {
  const [amount, setAmount] = useState('100000');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const queryClient = useQueryClient();

  const handleDeposit = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount < 10000) {
      Alert.alert('Lỗi', 'Số tiền tối thiểu nạp là 10.000 ₫');
      return;
    }

    setLoading(true);
    try {
      const response = await userService.deposit(numAmount);
      const { checkout_url, form_fields } = response.data || response;
      
      if (checkout_url && form_fields) {
        setPaymentData({ checkout_url, form_fields });
      } else {
        Alert.alert('Lỗi', 'Dữ liệu thanh toán không hợp lệ');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo yêu cầu nạp tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigation = async (navState) => {
    // Nếu URL chuyển hướng về trang thành công/thất bại của app (nếu SePay hỗ trợ)
    if (navState.url.includes('payment/success')) {
      // 1. Đóng WebView ngay lập tức để không bị lướt qua trang đăng nhập của Web
      setPaymentData(null);
      setLoading(true);

      try {
        // 2. Gọi API để cộng tiền thực tế (do IPN không chạy ở máy ảo)
        const requestId = Date.now().toString() + Math.random().toString(36).substring(7);
        await userService.confirmTopup({ 
          amount: Number(amount), 
          requestId 
        });

        // 3. Cập nhật lại số dư
        queryClient.invalidateQueries({ queryKey: ['userBalance'] });
        
        Alert.alert('Thành công', 'Nạp tiền thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } catch (error) {
        Alert.alert('Lỗi', 'Giao dịch thành công nhưng không thể cộng tiền. Vui lòng liên hệ hỗ trợ.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } finally {
        setLoading(false);
      }
    } else if (navState.url.includes('payment/cancel') || navState.url.includes('payment/error')) {
      Alert.alert('Thất bại', 'Giao dịch đã bị hủy hoặc xảy ra lỗi', [
        { text: 'OK', onPress: () => setPaymentData(null) }
      ]);
    }
  };

  if (paymentData) {
    // Generate HTML to auto submit POST form to SePay
    const formHtml = `
      <html>
        <body onload="document.forms[0].submit()">
          <form action="${paymentData.checkout_url}" method="POST">
            ${Object.entries(paymentData.form_fields).map(([key, value]) => 
              `<input type="hidden" name="${key}" value="${value}" />`
            ).join('')}
          </form>
          <div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <h2>Đang chuyển hướng sang cổng thanh toán...</h2>
          </div>
        </body>
      </html>
    `;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity onPress={() => setPaymentData(null)} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#2f3640" />
            <Text style={styles.backText}>Hủy giao dịch</Text>
          </TouchableOpacity>
        </View>
        <WebView 
          source={{ html: formHtml }}
          onNavigationStateChange={handleWebViewNavigation}
          startInLoadingState
        />
      </View>
    );
  }

  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nạp tiền vào ví</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Số tiền muốn nạp (VNĐ)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="wallet-outline" size={24} color="#0097e6" style={styles.icon} />
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="100000"
          />
        </View>

        <View style={styles.quickAmounts}>
          {quickAmounts.map(amt => (
            <TouchableOpacity 
              key={amt} 
              style={[styles.quickBtn, amount === amt.toString() && styles.quickBtnActive]}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={[styles.quickBtnText, amount === amt.toString() && styles.quickBtnTextActive]}>
                {amt.toLocaleString('vi-VN')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleDeposit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Tiếp tục nạp tiền</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.note}>* Bạn sẽ được chuyển sang cổng thanh toán an toàn của SePay</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  quickBtnActive: {
    borderColor: '#0097e6',
    backgroundColor: '#0097e6',
  },
  quickBtnText: {
    color: '#2f3640',
    fontWeight: 'bold',
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#0097e6',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#7f8fa6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  webviewHeader: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: '#2f3640',
  }
});
