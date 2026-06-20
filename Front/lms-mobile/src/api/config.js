// Config for API Base URL
import { Platform } from 'react-native';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lms.kainning.io.vn/api';
export const FRONTEND_URL = API_BASE_URL.replace('/api', '');
