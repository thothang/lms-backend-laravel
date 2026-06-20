import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '../api/publicService';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SearchScreen({ route, navigation }) {
  // route.params có thể từ Categories truyền sang
  const initialCategory = route?.params?.category_id || null;
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [keyword]);
  
  const { data: searchResponse, isLoading } = useQuery({
    queryKey: ['searchBooks', debouncedKeyword, initialCategory],
    queryFn: () => publicService.search({ 
      query: debouncedKeyword, 
      category_id: initialCategory 
    }),
    enabled: true, // Cho phép fetch ngay từ đầu để load sách theo category
  });

  const results = useMemo(() => {
    const rawData = searchResponse?.data || searchResponse;
    if (!rawData) return [];
    
    // Nếu API trả về dạng { books: { data: [] }, ebooks: { data: [] } }
    if (rawData.books || rawData.ebooks) {
      const booksArr = rawData.books?.data || [];
      const ebooksArr = rawData.ebooks?.data || [];
      return [...booksArr, ...ebooksArr];
    }
    
    // Fallback nếu API trả về mảng trực tiếp
    return Array.isArray(rawData) ? rawData : [];
  }, [searchResponse]);

  const renderItem = useCallback(({ item }) => {
    // API backend trả về search_type hoặc type
    const itemType = item.search_type || item.type || 'book';
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('BookDetail', { bookId: item.id, type: itemType })}
      >
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book" size={24} color="#dcdde1" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardAuthor} numberOfLines={1}>{item.author_name || item.author?.name || 'Đang cập nhật'}</Text>
          <Text style={styles.cardType}>{itemType === 'ebook' ? 'E-book' : 'Sách vật lý'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#dcdde1" />
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#718093" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập tên sách, tác giả..."
          defaultValue={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
        />
        {keyword.length > 0 && (
          <TouchableOpacity onPress={() => setKeyword('')}>
            <Ionicons name="close-circle" size={20} color="#718093" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0097e6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.search_type || item.type || 'book'}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy kết quả nào</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  cover: {
    width: 50,
    height: 75,
    borderRadius: 4,
    marginRight: 15,
  },
  coverPlaceholder: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: '#f1f2f6',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 4,
  },
  cardAuthor: {
    fontSize: 14,
    color: '#718093',
  },
  cardType: {
    fontSize: 12,
    color: '#0097e6',
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718093',
    marginTop: 30,
    fontSize: 16,
  },
});
