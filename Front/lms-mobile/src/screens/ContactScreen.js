import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { publicService } from '../api/publicService';

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tên, email và nội dung tin nhắn.');
      return;
    }

    try {
      setIsSubmitting(true);
      await publicService.submitContact(formData);
      Alert.alert('Thành công', 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={50} color="#0097e6" />
        <Text style={styles.title}>Liên hệ với chúng tôi</Text>
        <Text style={styles.subtitle}>Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua các kênh dưới đây hoặc gửi tin nhắn trực tiếp.</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Thông tin liên hệ cơ bản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          
          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="location-outline" size={24} color="#4f46e5" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Địa chỉ</Text>
              <Text style={styles.contactValue}>123 Đường Sách, Thành phố Tri Thức, Việt Nam</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="call-outline" size={24} color="#4f46e5" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Điện thoại</Text>
              <Text style={styles.contactValue}>1900 1234</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="mail-outline" size={24} color="#4f46e5" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@lmslibrary.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Giờ làm việc */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giờ làm việc</Text>
          <View style={styles.workingHoursCard}>
            <Ionicons name="time-outline" size={24} color="#059669" style={styles.workingHoursIcon} />
            <View style={styles.workingHoursInfo}>
              <Text style={styles.workingHoursLabel}>Thứ 2 - Thứ 6:</Text>
              <Text style={styles.workingHoursValue}>08:00 - 20:00</Text>
              <Text style={[styles.workingHoursLabel, { marginTop: 8 }]}>Thứ 7 - Chủ nhật:</Text>
              <Text style={styles.workingHoursValue}>09:00 - 17:00</Text>
            </View>
          </View>
        </View>

        {/* Form Gửi tin nhắn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gửi tin nhắn cho chúng tôi</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên <Text style={styles.required}>*</Text></Text>
              <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                style={styles.input}
                placeholder="Nhập họ tên của bạn"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email <Text style={styles.required}>*</Text></Text>
              <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                style={styles.input}
                placeholder="Nhập địa chỉ email"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tiêu đề</Text>
              <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                style={styles.input}
                placeholder="Vấn đề bạn cần hỗ trợ"
                value={formData.subject}
                onChangeText={(text) => setFormData({...formData, subject: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nội dung <Text style={styles.required}>*</Text></Text>
              <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
                style={[styles.input, styles.textArea]}
                placeholder="Nhập nội dung tin nhắn..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.message}
                onChangeText={(text) => setFormData({...formData, message: text})}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Gửi tin nhắn</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 15,
    marginLeft: 5,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 3,
  },
  contactValue: {
    fontSize: 14,
    color: '#718093',
  },
  workingHoursCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  workingHoursIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  workingHoursInfo: {
    flex: 1,
  },
  workingHoursLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#718093',
    marginBottom: 2,
  },
  workingHoursValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 8,
  },
  required: {
    color: '#e84118',
  },
  input: {
    backgroundColor: '#f1f2f6',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2f3640',
  },
  textArea: {
    height: 100,
  },
  submitBtn: {
    backgroundColor: '#0097e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
