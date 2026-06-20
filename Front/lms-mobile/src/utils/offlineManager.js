import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '../api/config';

const OFFLINE_EBOOKS_KEY = '@offline_ebooks';

export const offlineManager = {
  /**
   * Check if offline feature is supported in the current environment
   */
  isSupported: () => {
    return true; // expo-file-system is always supported in Expo Go and compiled builds
  },

  /**
   * Get local filesystem path for a downloaded ebook PDF
   */
  getOfflinePath: (id) => {
    return `${FileSystem.documentDirectory}ebook_${id}.pdf`;
  },

  /**
   * Check if an ebook is fully downloaded and file exists
   */
  checkDownloaded: async (id) => {
    try {
      const path = offlineManager.getOfflinePath(id);
      const fileInfo = await FileSystem.getInfoAsync(path);
      return fileInfo.exists;
    } catch (e) {
      console.error(`Error checking if ebook ${id} is downloaded:`, e);
      return false;
    }
  },

  /**
   * Get the list of all offline downloaded ebooks metadata from AsyncStorage
   */
  getOfflineEbooks: async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_EBOOKS_KEY);
      if (!stored) return [];
      const list = JSON.parse(stored);
      
      const verifiedList = [];
      for (const ebook of list) {
        const path = offlineManager.getOfflinePath(ebook.id);
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          verifiedList.push(ebook);
        }
      }
      
      if (verifiedList.length !== list.length) {
        await AsyncStorage.setItem(OFFLINE_EBOOKS_KEY, JSON.stringify(verifiedList));
      }
      return verifiedList;
    } catch (e) {
      console.error('Error fetching offline ebooks:', e);
      return [];
    }
  },

  /**
   * Download ebook PDF from server and store it locally using FileSystem
   */
  downloadEbook: async (ebook, token) => {
    const path = offlineManager.getOfflinePath(ebook.id);
    const url = `${API_BASE_URL}/ebooks/${ebook.id}/read`;

    try {
      // 1. Download file using expo-file-system
      const downloadResult = await FileSystem.downloadAsync(
        url,
        path,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Confirm status code is successful (200)
      if (downloadResult.status !== 200) {
        // Delete the failed file if created
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(path, { idempotent: true });
        }
        throw new Error(`Tải xuống thất bại với trạng thái: ${downloadResult.status}`);
      }

      // 2. Save metadata to AsyncStorage
      const offlineList = await offlineManager.getOfflineEbooks();
      
      // Check if already in list, if not add it
      if (!offlineList.some(item => item.id === ebook.id)) {
        const ebookMetadata = {
          id: ebook.id,
          title: ebook.title,
          author: ebook.author || ebook.author_name || 'Không rõ tác giả',
          cover_image: ebook.cover_image,
          localPath: path,
          downloadedAt: new Date().toISOString(),
        };
        offlineList.push(ebookMetadata);
        await AsyncStorage.setItem(OFFLINE_EBOOKS_KEY, JSON.stringify(offlineList));
      }

      return path;
    } catch (e) {
      console.error(`Error downloading ebook ${ebook.id}:`, e);
      // Clean up file if error occurred
      try {
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(path, { idempotent: true });
        }
      } catch (cleanupError) {
        console.error('Error cleaning up failed download file:', cleanupError);
      }
      throw e;
    }
  },

  /**
   * Delete offline downloaded ebook file and remove from metadata
   */
  deleteOfflineEbook: async (id) => {
    try {
      // 1. Delete file from filesystem
      const path = offlineManager.getOfflinePath(id);
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }

      // 2. Remove metadata from AsyncStorage
      const list = await offlineManager.getOfflineEbooks();
      const updatedList = list.filter(item => item.id !== id);
      await AsyncStorage.setItem(OFFLINE_EBOOKS_KEY, JSON.stringify(updatedList));
      return true;
    } catch (e) {
      console.error(`Error deleting offline ebook ${id}:`, e);
      return false;
    }
  }
};
