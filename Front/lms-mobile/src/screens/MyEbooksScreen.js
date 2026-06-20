import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/userService';
import Ionicons from '@expo/vector-icons/Ionicons';
import Skeleton from '../components/Skeleton';
import { tokenManager } from '../api/tokenManager';
import { offlineManager } from '../utils/offlineManager';

export default function MyEbooksScreen({ navigation }) {
  const [downloadedMap, setDownloadedMap] = useState({});
  const [isDownloadingMap, setIsDownloadingMap] = useState({});
  const [offlineEbooks, setOfflineEbooks] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { data: ebooks, isLoading, isError, refetch } = useQuery({
    queryKey: ['myEbooks'],
    queryFn: () => userService.getPurchasedEbooks(),
    retry: 1,
  });

  // Load offline ebooks list from storage
  const loadOfflineData = async () => {
    const localBooks = await offlineManager.getOfflineEbooks();
    setOfflineEbooks(localBooks);
    
    // Build initial downloaded status map
    const map = {};
    for (const b of localBooks) {
      map[b.id] = true;
    }
    
    if (ebooks) {
      for (const item of ebooks) {
        if (map[item.id] === undefined) {
          map[item.id] = await offlineManager.checkDownloaded(item.id);
        }
      }
    }
    setDownloadedMap(map);
  };

  useEffect(() => {
    loadOfflineData();
  }, [ebooks]);

  // Fallback to offline mode on fetch error
  useEffect(() => {
    if (isError) {
      setIsOfflineMode(true);
      loadOfflineData();
    }
  }, [isError]);

  const handleDownload = async (ebook) => {
    const token = tokenManager.getToken();
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tải sách.');
      return;
    }

    setIsDownloadingMap(prev => ({ ...prev, [ebook.id]: true }));
    try {
      await offlineManager.downloadEbook(ebook, token);
      setDownloadedMap(prev => ({ ...prev, [ebook.id]: true }));
      await loadOfflineData();
      Alert.alert('Thành công', `Đã tải offline sách "${ebook.title}" thành công.`);
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Tải sách xuống không thành công.');
    } finally {
      setIsDownloadingMap(prev => ({ ...prev, [ebook.id]: false }));
    }
  };

  const handleDeleteOffline = (ebook) => {
    Alert.alert(
      'Xóa bản offline',
      `Bạn có chắc muốn xóa bản đọc offline của sách "${ebook.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await offlineManager.deleteOfflineEbook(ebook.id);
            setDownloadedMap(prev => ({ ...prev, [ebook.id]: false }));
            await loadOfflineData();
          }
        }
      ]
    );
  };

  const handleRetryOnline = () => {
    setIsOfflineMode(false);
    refetch();
  };

  const renderListSkeleton = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.card}>
          <Skeleton width={70} height={100} borderRadius={6} style={{ marginRight: 15 }} />
          <View style={styles.info}>
            <Skeleton width="90%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
            <Skeleton width={80} height={28} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading && !isOfflineMode) {
    return renderListSkeleton();
  }

  const displayEbooks = isOfflineMode 
    ? offlineEbooks 
    : (activeTab === 'offline' 
        ? (ebooks || []).filter(item => downloadedMap[item.id])
        : (ebooks || []));

  const renderItem = ({ item }) => {
    const isDownloaded = downloadedMap[item.id];
    const isDownloading = isDownloadingMap[item.id];

    return (
      <View style={styles.card}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book" size={24} color="#dcdde1" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.author}>{item.author || item.author_name}</Text>
          
          <View style={styles.btnRow}>
            {/* Read Button */}
            <TouchableOpacity 
              style={styles.readBtn}
              onPress={() => navigation.navigate('EbookReader', { ebook: item })}
            >
              <Ionicons name="book-outline" size={16} color="#fff" />
              <Text style={styles.readBtnText}>Đọc Ngay</Text>
            </TouchableOpacity>

            {/* Offline / Download actions */}
            {isDownloaded ? (
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDeleteOffline(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#e84118" />
              </TouchableOpacity>
            ) : isDownloading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0097e6" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : (
              !isOfflineMode && (
                <TouchableOpacity 
                  style={styles.downloadBtn}
                  onPress={() => handleDownload(item)}
                >
                  <Ionicons name="cloud-download-outline" size={16} color="#fff" />
                  <Text style={styles.downloadBtnText}>Tải offline</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline Alert Banner */}
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="#e84118" />
          <Text style={styles.offlineBannerText}>Đang hoạt động ngoại tuyến. Hiển thị sách đã tải.</Text>
          <TouchableOpacity onPress={handleRetryOnline} style={styles.retryOnlineBtn}>
            <Text style={styles.retryOnlineText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs Filter (only when online) */}
      {!isOfflineMode && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'offline' && styles.activeTabButton]}
            onPress={() => setActiveTab('offline')}
          >
            <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>Đã tải về</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displayEbooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={60} color="#dcdde1" />
            <Text style={styles.emptyText}>
              {isOfflineMode 
                ? 'Không có sách tải sẵn offline.' 
                : (activeTab === 'offline' ? 'Chưa có sách nào được tải về.' : 'Bạn chưa mua Ebook nào.')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listContainer: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cover: {
    width: 70,
    height: 100,
    borderRadius: 6,
    marginRight: 15,
  },
  coverPlaceholder: {
    width: 70,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#f1f2f6',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
  },
  author: {
    fontSize: 14,
    color: '#718093',
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0097e6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  readBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#44bd32',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  downloadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 12,
  },
  deleteBtn: {
    marginLeft: 15,
    padding: 6,
    backgroundColor: '#f5f6fa',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#718093',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#718093',
    marginTop: 15,
  },
  offlineBanner: {
    backgroundColor: '#ffeaa7',
    borderColor: '#f1c40f',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#d35400',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
  },
  retryOnlineBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e67e22',
    borderRadius: 4,
  },
  retryOnlineText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#0097e6',
  },
  tabText: {
    fontWeight: 'bold',
    color: '#718093',
    fontSize: 13,
  },
  activeTabText: {
    color: '#fff',
  },
});
