import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, FlatList, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { publicService } from '../api/publicService';
import { userService } from '../api/userService';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import Skeleton from '../components/Skeleton';

export default function BookDetailScreen({ route, navigation }) {
  const { bookId, type = 'book' } = route.params;
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const queryClient = useQueryClient();
  const isEbook = type === 'ebook';
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: bookResp, isLoading } = useQuery({
    queryKey: ['bookDetail', bookId, type],
    queryFn: () => isEbook ? publicService.getEbookDetails(bookId) : publicService.getBookDetails(bookId),
  });

  const book = bookResp?.data || bookResp;

  const { data: relatedData } = useQuery({
    queryKey: ['relatedBooks', book?.category_id],
    queryFn: () => publicService.search({ category_id: book.category_id, limit: 20 }),
    enabled: !!book?.category_id,
  });

  const relatedBooks = (relatedData?.data?.books?.data || relatedData?.books?.data || [])
    .filter(b => b.id !== bookId || type !== 'book');
  const relatedEbooks = (relatedData?.data?.ebooks?.data || relatedData?.ebooks?.data || [])
    .filter(b => b.id !== bookId || type !== 'ebook');

  const handleAction = () => {
    if (!user) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        isEbook ? "Bạn cần đăng nhập để mua hoặc đọc E-book." : "Bạn cần đăng nhập để mượn sách.",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    if (isEbook) {
      if (book.is_free || book.is_purchased || book.is_author) {
        navigation.navigate('EbookReader', { ebook: book });
      } else {
        Alert.alert(
          "Xác nhận mua E-book",
          `Bạn có chắc chắn muốn mua E-book "${book.title}" với giá ${Number(book.price).toLocaleString()}đ không? Tiền sẽ được trừ vào số dư ví của bạn.`,
          [
            { text: "Hủy", style: "cancel" },
            { 
              text: "Mua", 
              onPress: async () => {
                showLoading();
                try {
                  await userService.purchaseEbook(book.id);
                  Alert.alert("Thành công", "Mua E-book thành công! Bạn có thể đọc ngay bây giờ.");
                  queryClient.invalidateQueries({ queryKey: ['bookDetail', bookId, type] });
                  queryClient.invalidateQueries({ queryKey: ['userBalance'] });
                  queryClient.invalidateQueries({ queryKey: ['myEbooks'] });
                } catch (error) {
                  Alert.alert("Lỗi", error.response?.data?.error || "Không thể mua E-book lúc này.");
                } finally {
                  hideLoading();
                }
              }
            }
          ]
        );
      }
    } else {
      navigation.navigate('Borrow', { book });
    }
  };

  const renderRelatedItem = ({ item, isRelatedEbook }) => (
    <TouchableOpacity 
      style={styles.relatedCard}
      onPress={() => {
        // Cần reset params để màn hình load sách mới thay vì đẩy thêm vào stack
        navigation.setParams({ bookId: item.id, type: isRelatedEbook ? 'ebook' : 'book' });
      }}
    >
      <View style={styles.relatedCoverContainer}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.relatedCover} />
        ) : (
          <View style={styles.relatedCoverPlaceholder} />
        )}
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, isRelatedEbook && styles.ebookBadge]}>
            <Text style={styles.badgeText}>{isRelatedEbook ? 'E-book' : 'Sách'}</Text>
          </View>
          {isRelatedEbook && item.is_free && (
            <View style={[styles.badge, styles.freeBadge]}>
              <Text style={styles.badgeText}>Free</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.relatedTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.relatedCategory} numberOfLines={1}>{item.category?.name || 'Đang cập nhật'}</Text>
    </TouchableOpacity>
  );

  const renderDetailSkeleton = () => (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.coverContainer}>
        <Skeleton width={280} height={420} borderRadius={16} />
      </View>
      <View style={styles.content}>
        <Skeleton width={100} height={25} borderRadius={12} style={{ marginBottom: 10 }} />
        <Skeleton width={250} height={30} style={{ marginBottom: 10 }} />
        <Skeleton width={150} height={20} style={{ marginBottom: 20 }} />
        
        <View style={styles.statsRow}>
          <Skeleton width={80} height={35} borderRadius={8} style={{ marginRight: 10 }} />
          <Skeleton width={120} height={35} borderRadius={8} />
        </View>

        <Skeleton width={180} height={25} style={{ marginBottom: 20 }} />
        <Skeleton width={120} height={20} style={{ marginBottom: 15 }} />
        
        <View style={styles.detailsBox}>
          <Skeleton width={'100%'} height={20} style={{ marginBottom: 10 }} />
          <Skeleton width={'80%'} height={20} style={{ marginBottom: 10 }} />
          <Skeleton width={'90%'} height={20} />
        </View>

        <Skeleton width={120} height={20} style={{ marginBottom: 15, marginTop: 15 }} />
        <Skeleton width={'100%'} height={15} style={{ marginBottom: 5 }} />
        <Skeleton width={'100%'} height={15} style={{ marginBottom: 5 }} />
        <Skeleton width={'60%'} height={15} />
      </View>
    </View>
  );

  if (isLoading) {
    return renderDetailSkeleton();
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy thông tin sách.</Text>
      </View>
    );
  }

  const reviewsToDisplay = showAllReviews ? (book.reviews || []) : (book.reviews || []).slice(0, 7);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          {book.cover_image ? (
            <Image source={{ uri: book.cover_image }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book" size={50} color="#a4b0be" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2f3640" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={[styles.typeBadge, isEbook && { backgroundColor: '#74b9ff' }]}>
            <Text style={styles.typeBadgeText}>{isEbook ? 'E-book' : 'Sách vật lý'}</Text>
          </View>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author_name || book.author?.name || 'Đang cập nhật'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="star" size={20} color="#fbc531" />
              <Text style={styles.statText}>{book.average_rating ? Number(book.average_rating).toFixed(1) : '4.5'}/5</Text>
            </View>
            {!isEbook && (
              <View style={styles.statBox}>
                <Ionicons name="book" size={20} color="#0097e6" />
                <Text style={styles.statText}>Còn {book.available_copies || 0} quyển</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{isEbook ? 'Giá mua:' : 'Giá cọc:'}</Text>
            {isEbook && book.is_free ? (
              <Text style={styles.priceValue}>Miễn phí</Text>
            ) : (
              <Text style={styles.priceValue}>{Number(book.price).toLocaleString()}đ</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Danh mục:</Text>
              <Text style={styles.detailValue}>{book.category?.name || 'Đang cập nhật'}</Text>
            </View>
            {!isEbook && book.publisher && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nhà xuất bản:</Text>
                <Text style={styles.detailValue}>{book.publisher}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày thêm:</Text>
              <Text style={styles.detailValue}>{book.created_at ? new Date(book.created_at).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Mô tả sách</Text>
          <Text style={styles.description}>{book.description || 'Chưa có mô tả.'}</Text>
          
          <Text style={styles.sectionTitle}>Đánh giá ({book.total_reviews || book.reviews?.length || 0})</Text>
          {book.reviews && book.reviews.length > 0 ? (
            <>
              {reviewsToDisplay.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.user?.name || 'Người dùng'}</Text>
                    <View style={styles.reviewStars}>
                      <Ionicons name="star" size={14} color="#fbc531" />
                      <Text style={styles.reviewRating}>{review.rating}/5</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('vi-VN')}</Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
              {book.reviews.length > 7 && !showAllReviews && (
                <TouchableOpacity style={styles.showAllBtn} onPress={() => setShowAllReviews(true)}>
                  <Text style={styles.showAllText}>Xem tất cả ({book.reviews.length})</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noReviews}>Chưa có đánh giá nào.</Text>
          )}

          {/* Sách cùng thể loại */}
          {relatedBooks.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>Sách vật lý cùng thể loại</Text>
              <FlatList
                horizontal
                data={relatedBooks}
                keyExtractor={(item) => `book-${item.id}`}
                renderItem={(props) => renderRelatedItem({ ...props, isRelatedEbook: false })}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {relatedEbooks.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>E-book cùng thể loại</Text>
              <FlatList
                horizontal
                data={relatedEbooks}
                keyExtractor={(item) => `ebook-${item.id}`}
                renderItem={(props) => renderRelatedItem({ ...props, isRelatedEbook: true })}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.actionBtn, 
            (!isEbook && book.available_copies <= 0) && styles.actionBtnDisabled
          ]} 
          onPress={handleAction}
          disabled={!isEbook && book.available_copies <= 0}
        >
          <Text style={styles.actionBtnText}>
            {isEbook 
              ? ((book.is_free || book.is_purchased || book.is_author) ? "Đọc Ngay" : "Mua E-book") 
              : (book.available_copies > 0 ? "Mượn Sách" : "Tạm Hết Sách")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginBottom: 80, // Để không bị che bởi footer
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    height: 480,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  coverPlaceholder: {
    width: 280,
    height: 420,
    backgroundColor: '#e1e2e6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  coverImage: {
    width: 280,
    height: 420,
    resizeMode: 'cover',
    borderRadius: 16,
  },
  content: {
    padding: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eccc68',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
  },
  author: {
    fontSize: 16,
    color: '#718093',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  statText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    color: '#718093',
    marginRight: 10,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#44bd32',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 10,
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    color: '#2f3640',
    lineHeight: 24,
    marginBottom: 15,
  },
  detailsBox: {
    backgroundColor: '#f5f6fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718093',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2f3640',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f2f6',
  },
  reviewRating: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  reviewDate: {
    fontSize: 12,
    color: '#a4b0be',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#2f3640',
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 14,
    color: '#718093',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f5f6fa',
  },
  actionBtn: {
    backgroundColor: '#0097e6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: '#bdc3c7',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  showAllBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
  },
  showAllText: {
    color: '#0097e6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  relatedSection: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  relatedCard: {
    width: 120,
    marginRight: 15,
  },
  relatedCoverContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  relatedCover: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  relatedCoverPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f1f2f6',
  },
  badgesContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 1,
  },
  badge: {
    backgroundColor: '#eccc68',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  ebookBadge: {
    backgroundColor: '#74b9ff',
  },
  freeBadge: {
    backgroundColor: '#2ed573',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  relatedTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 2,
  },
  relatedCategory: {
    fontSize: 11,
    color: '#0097e6',
  },
});
