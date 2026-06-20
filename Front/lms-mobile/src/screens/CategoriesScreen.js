import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '../api/publicService';
import Ionicons from '@expo/vector-icons/Ionicons';
import Skeleton from '../components/Skeleton';

export default function CategoriesScreen({ route, navigation }) {
  const initialCategory = route?.params?.category_id || '';
  
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState({
    category_id: initialCategory,
    type: 'all' // 'all', 'book', 'ebook'
  });
  
  // State for modal
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // Update filters if navigated with new category_id
  useEffect(() => {
    if (route?.params?.category_id) {
      setFilters(prev => ({ ...prev, category_id: route.params.category_id }));
      setTempFilters(prev => ({ ...prev, category_id: route.params.category_id }));
    }
  }, [route?.params?.category_id]);

  // Fetch categories for the filter modal
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => publicService.getCategories(),
  });

  // Fetch search/catalog data
  const { data: searchResponse, isLoading } = useQuery({
    queryKey: ['catalog', keyword, filters],
    queryFn: () => publicService.search({ 
      query: keyword, 
      category_id: filters.category_id,
      type: filters.type !== 'all' ? filters.type : undefined,
      limit: 100
    }),
  });

  const results = (() => {
    const rawData = searchResponse?.data || searchResponse;
    if (!rawData) return [];
    
    if (rawData.books || rawData.ebooks) {
      const booksArr = rawData.books?.data || [];
      const ebooksArr = rawData.ebooks?.data || [];
      const combined = [];
      if (filters.type === 'book') {
        combined.push(...booksArr);
      } else if (filters.type === 'ebook') {
        combined.push(...ebooksArr);
      } else {
        combined.push(...booksArr, ...ebooksArr);
      }
      return combined;
    }
    
    return Array.isArray(rawData) ? rawData : [];
  })();

  const handleApplyFilter = () => {
    setFilters(tempFilters);
    setFilterVisible(false);
  };

  const handleClearFilter = () => {
    const defaultFilters = { category_id: '', type: 'all' };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setKeyword('');
    setFilterVisible(false);
  };

  const renderItem = ({ item }) => {
    const itemType = item.search_type || item.type || 'book';
    
    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={() => navigation.navigate('BookDetail', { bookId: item.id, type: itemType })}
      >
        <View style={styles.imageContainer}>
          {item.cover_image ? (
            <Image source={{ uri: item.cover_image }} style={styles.gridCover} />
          ) : (
            <View style={styles.gridCoverPlaceholder}>
              <Ionicons name="book" size={30} color="#dcdde1" />
            </View>
          )}
          <View style={[styles.gridBadge, itemType === 'ebook' && { backgroundColor: '#74b9ff' }]}>
            <Text style={styles.gridBadgeText}>{itemType === 'ebook' ? 'E-book' : 'Sách'}</Text>
          </View>
          
          {/* Free Badge */}
          {itemType === 'ebook' && item.is_free && (
            <View style={styles.gridFreeBadge}>
              <Text style={styles.gridFreeBadgeText}>Free</Text>
            </View>
          )}
        </View>
        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.gridCategory} numberOfLines={1}>{item.category?.name || 'Đang cập nhật'}</Text>
          <Text style={styles.gridAuthor} numberOfLines={1}>{item.author_name || item.author?.name || 'Đang cập nhật'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridSkeleton = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 10 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={[styles.gridCard, { width: '48%', marginBottom: 15 }]}>
          <Skeleton width="100%" height={180} />
          <View style={styles.gridContent}>
            <Skeleton width="90%" height={15} style={{ marginBottom: 5 }} />
            <Skeleton width="60%" height={12} style={{ marginBottom: 5 }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#718093" style={styles.searchIcon} />
          <TextInput autoCorrect={false} spellCheck={false} autoCapitalize="none"
            style={styles.searchInput}
            placeholder="Nhập tên sách, tác giả..."
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <Ionicons name="close-circle" size={20} color="#718093" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterBtn}
          onPress={() => {
            setTempFilters(filters);
            setFilterVisible(true);
          }}
        >
          <Ionicons name="funnel" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {(filters.category_id !== '' || filters.type !== 'all') && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterText}>Đang lọc: </Text>
          {filters.type !== 'all' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filters.type === 'ebook' ? 'E-book' : 'Sách vật lý'}</Text>
            </View>
          )}
          {filters.category_id !== '' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {categories.find(c => c.id === filters.category_id)?.name || 'Danh mục'}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleClearFilter} style={{marginLeft: 'auto'}}>
            <Text style={styles.clearText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        renderGridSkeleton()
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.search_type || item.type || 'book'}-${item.id}`}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.rowWrapper}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={60} color="#dcdde1" />
              <Text style={styles.emptyText}>Không tìm thấy cuốn sách nào</Text>
              <Text style={styles.emptySubText}>Hãy thử thay đổi từ khóa hoặc bộ lọc</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc sách</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#2f3640" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Filter Type */}
              <Text style={styles.filterSectionTitle}>Loại sách</Text>
              <View style={styles.radioGroup}>
                {['all', 'book', 'ebook'].map(t => (
                  <TouchableOpacity 
                    key={t}
                    style={[styles.radioBtn, tempFilters.type === t && styles.radioBtnActive]}
                    onPress={() => setTempFilters({...tempFilters, type: t})}
                  >
                    <Text style={[styles.radioText, tempFilters.type === t && styles.radioTextActive]}>
                      {t === 'all' ? 'Tất cả' : (t === 'ebook' ? 'E-book' : 'Sách vật lý')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter Category */}
              <Text style={styles.filterSectionTitle}>Danh mục</Text>
              {isCategoriesLoading ? (
                <ActivityIndicator size="small" color="#0097e6" />
              ) : (
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.categoryPill, tempFilters.category_id === '' && styles.categoryPillActive]}
                    onPress={() => setTempFilters({...tempFilters, category_id: ''})}
                  >
                    <Text style={[styles.categoryPillText, tempFilters.category_id === '' && styles.categoryPillTextActive]}>Tất cả danh mục</Text>
                  </TouchableOpacity>
                  
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat.id}
                      style={[styles.categoryPill, tempFilters.category_id === cat.id && styles.categoryPillActive]}
                      onPress={() => setTempFilters({...tempFilters, category_id: cat.id})}
                    >
                      <Text style={[styles.categoryPillText, tempFilters.category_id === cat.id && styles.categoryPillTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleClearFilter}>
                <Text style={styles.resetBtnText}>Thiết lập lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter}>
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  filterBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#0097e6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  activeFilterText: {
    fontSize: 13,
    color: '#718093',
    marginRight: 5,
  },
  badge: {
    backgroundColor: '#eccc68',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  clearText: {
    fontSize: 13,
    color: '#e84118',
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  gridCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#eccc68',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  gridFreeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#44bd32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gridFreeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  gridContent: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 2,
  },
  gridCategory: {
    fontSize: 12,
    color: '#0097e6',
    marginBottom: 4,
  },
  gridAuthor: {
    fontSize: 12,
    color: '#718093',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#2f3640',
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#718093',
    marginTop: 5,
    fontSize: 14,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  modalBody: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 10,
    marginTop: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  radioBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcdde1',
    marginRight: 10,
    marginBottom: 10,
  },
  radioBtnActive: {
    backgroundColor: '#0097e6',
    borderColor: '#0097e6',
  },
  radioText: {
    color: '#718093',
    fontSize: 14,
  },
  radioTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryPill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f6fa',
    marginRight: 10,
    marginBottom: 10,
  },
  categoryPillActive: {
    backgroundColor: '#eccc68',
  },
  categoryPillText: {
    color: '#718093',
    fontSize: 14,
  },
  categoryPillTextActive: {
    color: '#2f3640',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  resetBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  resetBtnText: {
    color: '#718093',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#0097e6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
