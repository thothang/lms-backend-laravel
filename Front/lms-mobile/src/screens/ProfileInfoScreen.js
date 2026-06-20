import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import { useLoading } from '../context/LoadingContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProfileInfoScreen({ navigation }) {
  const { user, login } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    dob: ''
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  const loadUserData = async () => {
    try {
      showLoading();
      const fullProfile = await userService.getProfile();
      setProfileData({
        name: fullProfile.name || '',
        phone: fullProfile.phone || '',
        address: fullProfile.address || '',
        dob: fullProfile.dob ? new Date(fullProfile.dob).toISOString().split('T')[0] : ''
      });
      setRefreshKey(k => k + 1); // Buộc TextInput load lại defaultValue
    } catch (e) {
      console.log('Lỗi tải thông tin user:', e);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleCancelEdit = () => {
    loadUserData();
    setIsEditingProfile(false);
  };

  const getDobDate = () => {
    if (profileData.dob) {
      const parsed = new Date(profileData.dob);
      if (!isNaN(parsed)) return parsed;
    }
    return new Date();
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setProfileData({ ...profileData, dob: formattedDate });
      setRefreshKey(k => k + 1); // Buộc TextInput cập nhật lại value mới chọn
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống');
      return;
    }

    showLoading();
    try {
      const res = await userService.updateProfile(profileData);
      const updatedUser = res.data || res.user;
      if (updatedUser) {
        await login(updatedUser); // Update context
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
        setIsEditingProfile(false);
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      hideLoading();
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.password || !passwordData.password_confirmation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin mật khẩu');
      return;
    }

    if (passwordData.password !== passwordData.password_confirmation) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    showLoading();
    try {
      await userService.changePassword(passwordData);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra');
    } finally {
      hideLoading();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f5f6fa' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
      {/* Cập nhật thông tin */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={24} color="#0097e6" />
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên (*)</Text>
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            key={`name-${refreshKey}`}
            style={[styles.input, !isEditingProfile && styles.inputDisabled]}
            defaultValue={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            placeholder="Nhập họ và tên"
            editable={isEditingProfile}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            key={`phone-${refreshKey}`}
            style={[styles.input, !isEditingProfile && styles.inputDisabled]}
            defaultValue={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            editable={isEditingProfile}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            key={`address-${refreshKey}`}
            style={[styles.input, !isEditingProfile && styles.inputDisabled]}
            defaultValue={profileData.address}
            onChangeText={(text) => setProfileData({ ...profileData, address: text })}
            placeholder="Nhập địa chỉ"
            editable={isEditingProfile}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
          <View style={styles.dateInputContainer}>
            <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
              key={`dob-${refreshKey}`}
              style={[styles.input, {flex: 1}, !isEditingProfile && styles.inputDisabled]}
              defaultValue={profileData.dob}
              onChangeText={(text) => setProfileData({ ...profileData, dob: text })}
              placeholder="Ví dụ: 1990-12-31"
              editable={isEditingProfile}
            />
            {isEditingProfile && (
              <TouchableOpacity 
                style={styles.calendarIcon}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color="#0097e6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showDatePicker && (
          Platform.OS === 'ios' ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#dcdde1', overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: '#f5f6fa', borderBottomWidth: 1, borderBottomColor: '#dcdde1' }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: '#0097e6', fontWeight: 'bold', fontSize: 16 }}>Xong</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={getDobDate()}
                mode="date"
                is24Hour={true}
                display="spinner"
                onChange={onDateChange}
              />
            </View>
          ) : (
            <DateTimePicker
              testID="dateTimePicker"
              value={getDobDate()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onDateChange}
            />
          )
        )}

        {isEditingProfile ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancelEdit}
            >
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleUpdateProfile}
            >
              <Text style={styles.buttonText}>Lưu thông tin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setIsEditingProfile(true)}
          >
            <Text style={styles.buttonText}>Sửa thông tin</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Đổi mật khẩu */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={24} color="#0097e6" />
          <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu hiện tại</Text>
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            style={styles.input}
            value={passwordData.current_password}
            onChangeText={(text) => setPasswordData({ ...passwordData, current_password: text })}
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            style={styles.input}
            value={passwordData.password}
            onChangeText={(text) => setPasswordData({ ...passwordData, password: text })}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            style={styles.input}
            value={passwordData.password_confirmation}
            onChangeText={(text) => setPasswordData({ ...passwordData, password_confirmation: text })}
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={handleChangePassword}
        >
          <Text style={styles.buttonText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dcdde1',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#718093',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2f3640',
    backgroundColor: '#f8f9fa',
  },
  inputDisabled: {
    backgroundColor: '#f1f2f6',
    color: '#718093',
    borderColor: 'transparent',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  calendarIcon: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0097e6',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    marginLeft: 5,
    marginTop: 0,
  },
  cancelButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: '#a4b0be',
    marginTop: 0,
  },
  buttonSecondary: {
    backgroundColor: '#2f3640',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
