import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: balanceData, isLoading: balanceLoading, refetch } = useQuery({
    queryKey: ['userBalance'],
    queryFn: () => userService.getBalance(),
    enabled: !!user,
  });

  // Tự động refetch số dư khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) refetch();
    }, [user])
  );

  const balance = balanceData?.balance || '0';

  const MenuItem = ({ icon, title, onPress, color = '#2f3640' }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={color} style={styles.menuIcon} />
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#dcdde1" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {user ? (
        <>
          <View style={styles.headerCard}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          {/* Wallet Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletLeft}>
              <Ionicons name="wallet" size={24} color="#0097e6" />
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Số dư ví</Text>
                {balanceLoading ? (
                  <ActivityIndicator size="small" color="#0097e6" />
                ) : (
                  <Text style={styles.walletBalance}>{Number(balance).toLocaleString('vi-VN')} ₫</Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.depositBtn}
              onPress={() => navigation.navigate('Deposit')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.depositText}>Nạp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cá nhân</Text>
            <MenuItem icon="person-circle-outline" title="Thông tin cá nhân" onPress={() => navigation.navigate('ProfileInfo')} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quản lý thư viện</Text>
            <MenuItem icon="book-outline" title="Sách đang mượn" onPress={() => navigation.navigate('MyBorrows')} />
            <MenuItem icon="bookmark-outline" title="Đặt trước sách" onPress={() => navigation.navigate('MyReservations')} />
            <MenuItem icon="heart-outline" title="Ebook đã mua" onPress={() => navigation.navigate('MyEbooks')} />
          </View>
        </>
      ) : (
        <View style={styles.guestHeaderCard}>
          <Text style={styles.guestText}>Bạn chưa đăng nhập</Text>
          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnLogin]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.btnTextLogin}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnRegister]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.btnTextRegister}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
        <MenuItem icon="information-circle-outline" title="Về chúng tôi" onPress={() => navigation.navigate('About')} />
        <MenuItem icon="call-outline" title="Liên hệ" onPress={() => navigation.navigate('Contact')} />
        <MenuItem icon="document-text-outline" title="Quy định thư viện" onPress={() => navigation.navigate('Rules')} />
      </View>

      {user && (
        <View style={styles.section}>
          <MenuItem icon="log-out-outline" title="Đăng xuất" onPress={logout} color="#e84118" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guestHeaderCard: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletCard: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletInfo: {
    marginLeft: 15,
  },
  walletLabel: {
    fontSize: 12,
    color: '#718093',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0097e6',
  },
  depositBtn: {
    backgroundColor: '#0097e6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  depositText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0097e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#718093',
  },
  guestText: {
    fontSize: 16,
    color: '#2f3640',
    marginBottom: 15,
    width: '100%',
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnLogin: {
    backgroundColor: '#0097e6',
    marginRight: 10,
  },
  btnRegister: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0097e6',
  },
  btnTextLogin: {
    color: '#fff',
    fontWeight: 'bold',
  },
  btnTextRegister: {
    color: '#0097e6',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dcdde1',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8fa6',
    margin: 15,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuTitle: {
    fontSize: 16,
  },
});
