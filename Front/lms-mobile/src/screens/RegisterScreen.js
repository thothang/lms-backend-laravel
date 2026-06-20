import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, ImageBackground, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { authService } from '../api/authService';
import { useLoading } from '../context/LoadingContext';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const { showLoading, hideLoading } = useLoading();

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.password_confirmation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    showLoading();
    try {
      await authService.register(formData);
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đăng ký. Email có thể đã tồn tại.');
    } finally {
      hideLoading();
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80' }} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <TouchableOpacity 
              style={styles.logoContainer} 
              onPress={() => navigation.navigate('Main', { screen: 'Trang chủ' })}
            >
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <Text style={styles.logoText}>LMSLibrary</Text>
            </TouchableOpacity>

            {/* Form */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>Đăng Ký Mới</Text>
              <Text style={styles.subtitle}>Tạo tài khoản để mượn và đọc sách</Text>
              
              <View style={styles.form}>
                <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                  style={styles.input}
                  placeholder="Họ và tên (*)"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholderTextColor="#a4b0be"
                />
                
                <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                  style={styles.input}
                  placeholder="Email (*)"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#a4b0be"
                />

                <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                  style={styles.input}
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  keyboardType="phone-pad"
                  placeholderTextColor="#a4b0be"
                />
                
                <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                  style={styles.input}
                  placeholder="Mật khẩu (*)"
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  secureTextEntry
                  placeholderTextColor="#a4b0be"
                />

                <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu (*)"
                  value={formData.password_confirmation}
                  onChangeText={(text) => setFormData({...formData, password_confirmation: text})}
                  secureTextEntry
                  placeholderTextColor="#a4b0be"
                />
                
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleRegister}
                >
                  <Text style={styles.buttonText}>Đăng Ký</Text>
                </TouchableOpacity>

                {/* Link sang Đăng nhập */}
                <View style={styles.footerLinkContainer}>
                  <Text style={styles.footerText}>Đã có tài khoản? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.footerLink}>Đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 14,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2f3640',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#718093',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 52,
    backgroundColor: '#f1f2f6',
    borderWidth: 1,
    borderColor: '#dfe4ea',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
    color: '#2f3640',
  },
  button: {
    backgroundColor: '#0097e6',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0097e6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#718093',
    fontSize: 14,
  },
  footerLink: {
    color: '#0097e6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
