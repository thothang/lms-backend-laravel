import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/authService';
import { useLoading } from '../context/LoadingContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showLoading, hideLoading } = useLoading();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    showLoading();
    try {
      const response = await authService.login({ email, password });
      if (response.user) {
        await login(response.user);
        navigation.navigate('Main', { screen: 'Trang chủ' });
      } else {
        Alert.alert('Lỗi', 'Đăng nhập thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kết nối đến máy chủ');
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
              <Text style={styles.title}>Đăng Nhập</Text>
              <Text style={styles.subtitle}>Vui lòng đăng nhập để tiếp tục</Text>
              
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  defaultValue={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#a4b0be"
                  autoCorrect={false}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  defaultValue={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#a4b0be"
                  autoCorrect={false}
                />
                
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleLogin}
                >
                  <Text style={styles.buttonText}>Đăng Nhập</Text>
                </TouchableOpacity>

                {/* Link sang Đăng ký */}
                <View style={styles.footerLinkContainer}>
                  <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.footerLink}>Đăng ký ngay</Text>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2f3640',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#718093',
    textAlign: 'center',
    marginBottom: 25,
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
    marginBottom: 15,
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
    marginTop: 25,
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
