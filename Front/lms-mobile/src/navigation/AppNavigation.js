import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Image, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import RulesScreen from '../screens/RulesScreen';
import DepositScreen from '../screens/DepositScreen';
import BorrowScreen from '../screens/BorrowScreen';
import MyEbooksScreen from '../screens/MyEbooksScreen';
import MyBorrowsScreen from '../screens/MyBorrowsScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';
import EbookReaderScreen from '../screens/EbookReaderScreen';
import ProfileInfoScreen from '../screens/ProfileInfoScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationBell from '../components/NotificationBell';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs cho màn hình chính
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, // Có thể chỉnh false nếu muốn tự làm header
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Trang chủ') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Khám phá') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0097e6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Trang chủ" 
        component={HomeScreen} 
        options={{ 
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={{ width: 30, height: 30, marginRight: 10, borderRadius: 6 }} 
                resizeMode="contain"
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2f3640' }}>LMSLibrary</Text>
            </View>
          ),
          headerRight: () => <NotificationBell />
        }} 
      />
      <Tab.Screen name="Khám phá" component={CategoriesScreen} />
      <Tab.Screen name="Menu" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'Về chúng tôi' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ headerShown: true, title: 'Liên hệ' }} />
      <Stack.Screen name="Rules" component={RulesScreen} options={{ headerShown: true, title: 'Quy định thư viện' }} />
      <Stack.Screen name="Deposit" component={DepositScreen} options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="Borrow" component={BorrowScreen} options={{ headerShown: true, title: 'Xác nhận mượn sách' }} />
      <Stack.Screen name="MyEbooks" component={MyEbooksScreen} options={{ headerShown: true, title: 'Ebook đã mua' }} />
      <Stack.Screen name="MyBorrows" component={MyBorrowsScreen} options={{ headerShown: true, title: 'Sách đang mượn' }} />
      <Stack.Screen name="MyReservations" component={MyReservationsScreen} options={{ headerShown: true, title: 'Sách đặt trước' }} />
      <Stack.Screen name="EbookReader" component={EbookReaderScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileInfo" component={ProfileInfoScreen} options={{ headerShown: true, title: 'Thông tin cá nhân' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Thông báo' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0097e6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
