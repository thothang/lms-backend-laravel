import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { FRONTEND_URL, API_BASE_URL } from '../api/config';
import { tokenManager } from '../api/tokenManager';
import { offlineManager } from '../utils/offlineManager';

export default function EbookReaderScreen({ route, navigation }) {
  const { ebook } = route.params;
  const token = tokenManager.getToken();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localPath, setLocalPath] = useState(null);
  const [isLocalChecked, setIsLocalChecked] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isOpeningExternal, setIsOpeningExternal] = useState(false);
  const webViewRef = useRef(null);

  const isExpoGoIOS = Constants.appOwnership === 'expo' && Platform.OS === 'ios';
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // Dynamic require to avoid crash on Expo Go
  let PdfComponent = null;
  if (!isExpoGo) {
    try {
      PdfComponent = require('react-native-pdf').default;
    } catch (e) {
      console.warn('Cannot load react-native-pdf', e);
    }
  }

  useEffect(() => {
    const checkLocalFile = async () => {
      try {
        const isDownloaded = await offlineManager.checkDownloaded(ebook.id);
        console.log(`[OfflineReader] checkDownloaded(${ebook.id}):`, isDownloaded);
        if (isDownloaded) {
          const path = offlineManager.getOfflinePath(ebook.id);
          // Verify file info for debugging
          const fileInfo = await FileSystem.getInfoAsync(path);
          console.log(`[OfflineReader] File info:`, JSON.stringify(fileInfo));
          if (fileInfo.exists) {
            setLocalPath(path);
            console.log(`[OfflineReader] localPath set to:`, path);
          }
        }
      } catch (err) {
        console.error('[OfflineReader] Error checking local file:', err);
      }
      setIsLocalChecked(true);
    };
    checkLocalFile();
  }, [ebook.id]);

  // Open PDF in native viewer via expo-sharing (most reliable for iOS offline)
  const openInNativeViewer = async () => {
    if (!localPath) return;
    setIsOpeningExternal(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(localPath, {
          mimeType: 'application/pdf',
          dialogTitle: ebook.title,
          UTI: 'com.adobe.pdf',
        });
      } else {
        setLoadError('Chức năng chia sẻ không khả dụng trên thiết bị này.');
      }
    } catch (err) {
      console.error('[OfflineReader] Error opening native viewer:', err);
      setLoadError('Không thể mở trình đọc PDF gốc.');
    } finally {
      setIsOpeningExternal(false);
    }
  };

  if (!isLocalChecked) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0097e6" />
        <Text style={{ color: '#718093', marginTop: 10 }}>Đang tải sách...</Text>
      </View>
    );
  }

  // Block access when no token AND no local file
  if (!token && !localPath) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="cloud-offline" size={48} color="#e84118" />
        <Text style={{ color: '#e84118', fontWeight: 'bold', marginTop: 10, textAlign: 'center' }}>
          Cần kết nối mạng để đọc cuốn sách này.
        </Text>
        <Text style={{ color: '#718093', marginTop: 5, textAlign: 'center' }}>
          Hãy tải sách về trước khi đọc offline.
        </Text>
      </View>
    );
  }
  
  const apiReaderUrl = `${API_BASE_URL}/ebooks/${ebook.id}/read`;

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const reloadWebView = () => {
    setLoadError(null);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // Build source for PDF reader (react-native-pdf or WebView)
  const pdfSource = localPath 
    ? { uri: localPath }
    : { uri: apiReaderUrl, headers: { Authorization: `Bearer ${token}` } };

  // For WebView: direct file URI for offline, API URL for online
  const webViewSource = localPath
    ? { uri: localPath }
    : { uri: apiReaderUrl, headers: { Authorization: `Bearer ${token}` } };

  // Determine if we're in offline mode (localPath is set)
  const isOfflineReading = !!localPath;

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} barStyle="dark-content" />
      
      {!isFullscreen && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#2f3640" />
          </TouchableOpacity>
          
          <Text style={styles.title} numberOfLines={1}>
            {ebook.title} {isOfflineReading && <Text style={styles.offlineBadge}>(Offline)</Text>}
          </Text>

          <View style={styles.actions}>
            {/* Open in native PDF viewer button (offline only, iOS) */}
            {isOfflineReading && Platform.OS === 'ios' && (
              <TouchableOpacity 
                onPress={openInNativeViewer} 
                style={styles.iconBtn}
                disabled={isOpeningExternal}
              >
                <Ionicons name="open-outline" size={22} color="#0097e6" />
              </TouchableOpacity>
            )}
            {!isOfflineReading && (
              <TouchableOpacity onPress={reloadWebView} style={styles.iconBtn}>
                <Ionicons name="refresh" size={22} color="#2f3640" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleFullscreen} style={styles.iconBtn}>
              <Ionicons name="expand" size={22} color="#2f3640" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.webViewContainer}>
        {loadError && (
          <View style={styles.errorOverlay}>
            <Ionicons name="alert-circle" size={40} color="#e84118" />
            <Text style={styles.errorText}>Không thể hiển thị sách</Text>
            <Text style={styles.errorSubText}>{loadError}</Text>
            
            {/* Primary action: try native viewer for offline reading */}
            {isOfflineReading && Platform.OS === 'ios' && (
              <TouchableOpacity 
                onPress={openInNativeViewer} 
                style={[styles.retryBtn, { backgroundColor: '#44bd32' }]}
                disabled={isOpeningExternal}
              >
                <Text style={styles.retryText}>
                  {isOpeningExternal ? 'Đang mở...' : '📖 Mở bằng trình đọc PDF'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={reloadWebView} style={styles.retryBtn}>
              <Text style={styles.retryText}>Thử lại trong WebView</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isExpoGoIOS || !PdfComponent ? (
          <WebView 
            ref={webViewRef}
            source={webViewSource}
            startInLoadingState
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }]}>
                <ActivityIndicator size="large" color="#0097e6" />
              </View>
            )}
            allowsFullscreenVideo
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            allowingReadAccessToURL={isOfflineReading ? FileSystem.documentDirectory : undefined}
            originWhitelist={['*']}
            style={{ backgroundColor: '#fff' }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              const desc = nativeEvent.description || nativeEvent.message || 'Lỗi không xác định';
              console.error('[OfflineReader] WebView error:', desc, nativeEvent);
              setLoadError(desc);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[OfflineReader] WebView HTTP error:', nativeEvent.statusCode);
              if (nativeEvent.statusCode >= 400) {
                setLoadError(`Lỗi HTTP: ${nativeEvent.statusCode}`);
              }
            }}
          />
        ) : (
          <PdfComponent
            source={pdfSource}
            trustAllCerts={false}
            style={styles.pdf}
            onError={(error) => {
              console.log('[OfflineReader] PDF component error:', error);
              setLoadError('Không thể đọc file PDF');
            }}
          />
        )}
        
        {isFullscreen && (
          <TouchableOpacity 
            style={styles.floatingExitBtn} 
            onPress={toggleFullscreen}
          >
            <Ionicons name="contract" size={20} color="#2f3640" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
    backgroundColor: '#f5f6fa',
  },
  backBtn: {
    padding: 5,
  },
  iconBtn: {
    padding: 5,
    marginLeft: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginLeft: 10,
  },
  offlineBadge: {
    fontSize: 12,
    color: '#44bd32',
    fontWeight: 'normal',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingExitBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginTop: 10,
  },
  errorSubText: {
    fontSize: 13,
    color: '#718093',
    marginTop: 5,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0097e6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
