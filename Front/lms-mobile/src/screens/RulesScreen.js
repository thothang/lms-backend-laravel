import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RulesScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={50} color="#0097e6" />
        <Text style={styles.title}>Quy Định Thư Viện</Text>
        <Text style={styles.subtitle}>Vui lòng đọc kỹ các quy định dưới đây trước khi sử dụng dịch vụ mượn sách tại LMSLibrary.</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Điều kiện mượn sách */}
        <View style={styles.ruleCard}>
          <View style={[styles.ruleHeader, { backgroundColor: '#4f46e5' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <Text style={styles.ruleTitle}>1. Điều kiện mượn sách</Text>
          </View>
          <View style={styles.ruleBody}>
            <View style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#4f46e5' }]} />
              <Text style={styles.listText}>Người mượn phải đăng ký tài khoản và xác minh email thành công trên hệ thống LMSLibrary.</Text>
            </View>
            <View style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#4f46e5' }]} />
              <Text style={styles.listText}>Tài khoản phải có đủ số dư trong ví nội bộ để đặt cọc cho cuốn sách muốn mượn.</Text>
            </View>
            <View style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#4f46e5' }]} />
              <Text style={styles.listText}>Mỗi thành viên được mượn tối đa <Text style={styles.boldText}>5 cuốn sách</Text> cùng lúc.</Text>
            </View>
          </View>
        </View>

        {/* Thời hạn mượn sách */}
        <View style={styles.ruleCard}>
          <View style={[styles.ruleHeader, { backgroundColor: '#7c3aed' }]}>
            <Ionicons name="time-outline" size={24} color="#fff" />
            <Text style={styles.ruleTitle}>2. Thời hạn mượn sách</Text>
          </View>
          <View style={styles.ruleBody}>
            <View style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#7c3aed' }]} />
              <Text style={styles.listText}>Thời hạn mượn mặc định: <Text style={styles.boldText}>14 ngày</Text> kể từ ngày xác nhận mượn.</Text>
            </View>
            <View style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#7c3aed' }]} />
              <Text style={styles.listText}>Bạn đọc có thể <Text style={styles.boldText}>gia hạn 1 lần</Text> (thêm 7 ngày) nếu sách chưa được đặt trước bởi người khác.</Text>
            </View>
            <View style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#7c3aed' }]} />
              <Text style={styles.listText}>Sau khi hết hạn, hệ thống sẽ tự động tính phí phạt quá hạn.</Text>
            </View>
          </View>
        </View>

        {/* Phí và tiền cọc */}
        <View style={styles.ruleCard}>
          <View style={[styles.ruleHeader, { backgroundColor: '#059669' }]}>
            <Ionicons name="cash-outline" size={24} color="#fff" />
            <Text style={styles.ruleTitle}>3. Phí mượn & Tiền cọc</Text>
          </View>
          <View style={styles.ruleBody}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColLabel, { color: '#059669' }]}>Phí mượn</Text>
              <Text style={styles.tableColValue}>Tính theo ngày, hiển thị trên trang chi tiết sách.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColLabel, { color: '#059669' }]}>Tiền cọc</Text>
              <Text style={styles.tableColValue}>Trừ trước từ ví nội bộ, sẽ hoàn lại khi trả sách đúng hạn và sách còn nguyên vẹn.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColLabel, { color: '#059669' }]}>Phí quá hạn</Text>
              <Text style={styles.tableColValue}>Tính theo ngày quá hạn, trừ trực tiếp vào tiền cọc.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColLabel, { color: '#059669' }]}>Mua E-Book</Text>
              <Text style={styles.tableColValue}>Thanh toán 1 lần qua ví. Sở hữu vĩnh viễn & đọc không giới hạn.</Text>
            </View>
          </View>
        </View>

        {/* Xử lý vi phạm */}
        <View style={styles.ruleCard}>
          <View style={[styles.ruleHeader, { backgroundColor: '#e11d48' }]}>
            <Ionicons name="close-circle-outline" size={24} color="#fff" />
            <Text style={styles.ruleTitle}>4. Xử lý vi phạm</Text>
          </View>
          <View style={styles.ruleBody}>
            <View style={styles.listItem}>
              <Ionicons name="alert-triangle-outline" size={18} color="#e11d48" style={styles.listIcon} />
              <Text style={styles.listText}><Text style={styles.boldText}>Trả sách quá hạn:</Text> Bị trừ phí phạt vào tiền cọc. Nếu phí phạt vượt quá tiền cọc, tài khoản sẽ bị nợ.</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="alert-triangle-outline" size={18} color="#e11d48" style={styles.listIcon} />
              <Text style={styles.listText}><Text style={styles.boldText}>Làm hư hỏng sách:</Text> Phải bồi thường theo giá bìa của cuốn sách.</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="alert-triangle-outline" size={18} color="#e11d48" style={styles.listIcon} />
              <Text style={styles.listText}><Text style={styles.boldText}>Làm mất sách:</Text> Phải bồi thường 100% giá bìa và không được hoàn cọc.</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="alert-triangle-outline" size={18} color="#e11d48" style={styles.listIcon} />
              <Text style={styles.listText}><Text style={styles.boldText}>Tài khoản nợ quá hạn:</Text> Bị tạm khóa chức năng mượn sách cho đến khi thanh toán khoản nợ.</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={24} color="#4f46e5" style={styles.noteIcon} />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Lưu ý quan trọng</Text>
            <Text style={styles.noteText}>
              Các quy định trên có thể được cập nhật theo thời gian. Vui lòng kiểm tra lại định kỳ. Nếu có bất kỳ thắc mắc nào, hãy liên hệ đội ngũ hỗ trợ qua email support@lmslibrary.com hoặc hotline 1900 1234.
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f3640',
    marginTop: 15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#718093',
    textAlign: 'center',
    lineHeight: 22,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  ruleTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  ruleBody: {
    padding: 15,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  listIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#2f3640',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingVertical: 10,
  },
  tableColLabel: {
    width: 100,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableColValue: {
    flex: 1,
    fontSize: 14,
    color: '#2f3640',
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 15,
  },
  noteIcon: {
    marginRight: 10,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3730a3',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 13,
    color: '#4338ca',
    lineHeight: 20,
  },
});
