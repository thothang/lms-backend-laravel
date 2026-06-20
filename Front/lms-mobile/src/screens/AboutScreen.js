import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="book" size={40} color="#0097e6" />
        <Text style={styles.title}>LMSLibrary</Text>
        <Text style={styles.subtitle}>Hệ thống quản lý thư viện hiện đại, kết nối tri thức đến mọi người. Chúng tôi tin rằng kiến thức là chìa khóa mở ra mọi cánh cửa.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sứ mệnh của chúng tôi</Text>
        <Text style={styles.content}>
          LMSLibrary được thành lập với tầm nhìn phổ cập kiến thức cho mọi người. Chúng tôi cung cấp nền tảng thư viện số tiện lợi, giúp bạn đọc tiếp cận hàng ngàn đầu sách vật lý và ebook chất lượng cao một cách dễ dàng, nhanh chóng và tiết kiệm.
        </Text>
        <Text style={styles.content}>
          Với hệ thống quản lý mượn trả thông minh, ví điện tử tích hợp và kho sách đa dạng, chúng tôi cam kết mang đến trải nghiệm đọc sách hiện đại và thuận tiện nhất cho cộng đồng.
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="book-outline" size={24} color="#0097e6" />
          <Text style={styles.statNumber}>10,000+</Text>
          <Text style={styles.statLabel}>Đầu sách</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="people-outline" size={24} color="#8c7ae6" />
          <Text style={styles.statNumber}>5,000+</Text>
          <Text style={styles.statLabel}>Thành viên</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="globe-outline" size={24} color="#4cd137" />
          <Text style={styles.statNumber}>50+</Text>
          <Text style={styles.statLabel}>Thể loại</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="ribbon-outline" size={24} color="#e1b12c" />
          <Text style={styles.statNumber}>99%</Text>
          <Text style={styles.statLabel}>Hài lòng</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Giá trị cốt lõi</Text>
        
        <View style={styles.valueRow}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#0097e6" style={styles.valueIcon} />
          <View style={styles.valueText}>
            <Text style={styles.valueTitle}>Minh bạch</Text>
            <Text style={styles.valueDesc}>Mọi thông tin về phí mượn, thời hạn, quy định đều được công khai rõ ràng. Không có phí ẩn hay điều khoản bất ngờ.</Text>
          </View>
        </View>
        
        <View style={styles.valueRow}>
          <Ionicons name="heart-outline" size={28} color="#8c7ae6" style={styles.valueIcon} />
          <View style={styles.valueText}>
            <Text style={styles.valueTitle}>Cộng đồng</Text>
            <Text style={styles.valueDesc}>Xây dựng cộng đồng đọc sách lành mạnh, nơi mọi người có thể chia sẻ, đánh giá và giới thiệu sách hay cho nhau.</Text>
          </View>
        </View>
        
        <View style={styles.valueRow}>
          <Ionicons name="medal-outline" size={28} color="#4cd137" style={styles.valueIcon} />
          <View style={styles.valueText}>
            <Text style={styles.valueTitle}>Chất lượng</Text>
            <Text style={styles.valueDesc}>Chọn lọc kỹ càng từng đầu sách, đảm bảo nội dung chính hãng, bản quyền rõ ràng, chất lượng in ấn tốt nhất.</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2f3640',
    marginTop: 10,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#718093',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dcdde1',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 15,
  },
  content: {
    fontSize: 15,
    color: '#2f3640',
    lineHeight: 24,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3640',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#718093',
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  valueIcon: {
    marginRight: 15,
    marginTop: 5,
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
  },
  valueDesc: {
    fontSize: 14,
    color: '#718093',
    lineHeight: 22,
  },
});
