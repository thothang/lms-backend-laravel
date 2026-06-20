import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Image, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '../api/publicService';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeData'],
    queryFn: () => publicService.getHomeData(),
  });

  const carousel = useMemo(() => {
    if (!homeData) return [];
    const carouselBooks = (homeData.carousel?.books || []).map(b => ({ ...b, type: 'book' }));
    const carouselEbooks = (homeData.carousel?.ebooks || []).map(e => ({ ...e, type: 'ebook' }));
    const combined = [...carouselBooks, ...carouselEbooks];
    combined.sort((a, b) => (a.carousel_order || 999) - (b.carousel_order || 999));
    return combined;
  }, [homeData]);

  const hotBooks = useMemo(() => homeData ? [
    ...(homeData.hot?.books || []).map(b => ({ ...b, type: 'book' })), 
    ...(homeData.hot?.ebooks || []).map(e => ({ ...e, type: 'ebook' }))
  ] : [], [homeData]);
  
  const featuredBooks = useMemo(() => homeData ? [
    ...(homeData.featured?.books || []).map(b => ({ ...b, type: 'book' })), 
    ...(homeData.featured?.ebooks || []).map(e => ({ ...e, type: 'ebook' }))
  ] : [], [homeData]);
  
  const freeEbooks = useMemo(() => (homeData?.free_ebooks || []).map(e => ({ ...e, type: 'ebook' })), [homeData]);
  const categories = useMemo(() => homeData?.categories || [], [homeData]);

  const renderBookItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id, type: item.type || 'book' })}
    >
      <View style={styles.imageContainer}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.imagePlaceholder} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        
        {/* Type Badge */}
        <View style={[styles.cardTypeBadge, item.type === 'ebook' && { backgroundColor: '#74b9ff' }]}>
          <Text style={styles.cardTypeBadgeText}>{item.type === 'ebook' ? 'E-book' : 'Sách'}</Text>
        </View>

        {/* Free Badge */}
        {item.type === 'ebook' && item.is_free && (
          <View style={styles.cardFreeBadge}>
            <Text style={styles.cardFreeBadgeText}>Free</Text>
          </View>
        )}
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.bookCategory} numberOfLines={1}>{item.category?.name || 'Đang cập nhật'}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{item.author_name || item.author?.name || 'Đang cập nhật'}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderCarouselItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.carouselCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id, type: item.type || 'book' })}
    >
      {item.cover_image ? (
        <Image source={{ uri: item.cover_image }} style={styles.carouselImage} />
      ) : (
        <View style={styles.carouselImagePlaceholder} />
      )}
      <View style={styles.carouselOverlay}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
          <View style={[styles.carouselBadge, item.type === 'ebook' && { backgroundColor: '#74b9ff' }]}>
            <Text style={styles.carouselBadgeText}>{item.type === 'ebook' ? 'E-book' : 'Sách vật lý'}</Text>
          </View>
          {item.type === 'ebook' && item.is_free && (
            <View style={[styles.carouselBadge, { backgroundColor: '#44bd32', marginLeft: 5 }]}>
              <Text style={[styles.carouselBadgeText, { color: '#fff' }]}>Free</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{item.category?.name || 'Đang cập nhật'}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description || 'Chưa có mô tả cho sách này.'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const renderCategoryItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('Khám phá', { category_id: item.id })}
    >
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.books_count + item.ebooks_count} tài liệu</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderHomeSkeleton = () => (
    <View style={{ padding: 20 }}>
      <Skeleton width={width - 40} height={200} borderRadius={15} style={{ marginBottom: 30 }} />
      <Skeleton width={200} height={25} style={{ marginBottom: 15 }} />
      <View style={{ flexDirection: 'row', marginBottom: 30 }}>
        <Skeleton width={120} height={45} borderRadius={25} style={{ marginRight: 15 }} />
        <Skeleton width={100} height={45} borderRadius={25} style={{ marginRight: 15 }} />
        <Skeleton width={110} height={45} borderRadius={25} style={{ marginRight: 15 }} />
      </View>
      <Skeleton width={180} height={25} style={{ marginBottom: 15 }} />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ marginRight: 15 }}>
          <Skeleton width={140} height={200} borderRadius={10} style={{ marginBottom: 10 }} />
          <Skeleton width={120} height={15} style={{ marginBottom: 5 }} />
          <Skeleton width={80} height={15} />
        </View>
        <View style={{ marginRight: 15 }}>
          <Skeleton width={140} height={200} borderRadius={10} style={{ marginBottom: 10 }} />
          <Skeleton width={120} height={15} style={{ marginBottom: 5 }} />
          <Skeleton width={80} height={15} />
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          {user ? `Xin chào, ${user.name} 👋` : 'Chào mừng bạn đến với Thư viện 👋'}
        </Text>
        <Text style={styles.subtitle}>Hôm nay bạn muốn đọc gì?</Text>
      </View>

      {isLoading ? (
        renderHomeSkeleton()
      ) : (
        <>
          {carousel.length > 0 && (
            <View style={styles.carouselSection}>
              <FlatList
                horizontal
                data={carousel}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={renderCarouselItem}
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 40}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselList}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                removeClippedSubviews={true}
              />
            </View>
          )}

          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh Mục Thư Viện 📚</Text>
              <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => `category-${item.id}`}
                renderItem={renderCategoryItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
              />
            </View>
          )}

          {hotBooks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sách Đang Hot 🔥</Text>
              <FlatList
                horizontal
                data={hotBooks}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={renderBookItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
              />
            </View>
          )}

          {featuredBooks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sách Nổi Bật ⭐</Text>
              <FlatList
                horizontal
                data={featuredBooks}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={renderBookItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
              />
            </View>
          )}

          {freeEbooks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>E-book Miễn Phí 🆓</Text>
              <FlatList
                horizontal
                data={freeEbooks}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={renderBookItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
              />
            </View>
          )}

          <View style={styles.homeFooter}>
            <Text style={styles.footerText}>© 2026 LMS Thư Viện</Text>
            <Text style={styles.footerSubText}>Hệ thống quản lý thư viện thông minh</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8fa6',
    marginTop: 5,
  },
  carouselSection: {
    marginTop: 15,
  },
  carouselList: {
    paddingHorizontal: 20,
  },
  carouselCard: {
    width: width - 50,
    height: 180,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#dcdde1',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  carouselBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eccc68',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 5,
  },
  carouselBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  bookCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 5, 
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f2f6',
    borderRadius: 6,
    resizeMode: 'cover',
  },
  cardTypeBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#eccc68',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardTypeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  cardFreeBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#44bd32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardFreeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    marginTop: 5,
  },
  cardCategory: {
    fontSize: 12,
    color: '#74b9ff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#dcdde1',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 2,
  },
  bookCategory: {
    fontSize: 12,
    color: '#0097e6',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#718093',
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: '#0097e6',
    textAlign: 'center',
  },
  homeFooter: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#718093',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerSubText: {
    color: '#a4b0be',
    fontSize: 12,
    marginTop: 4,
  }
});
