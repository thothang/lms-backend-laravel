# Hướng dẫn sử dụng React Query - Auto Reload sau CRUD

## Tổng quan

React Query (@tanstack/react-query) giúp quản lý dữ liệu server-side với:
- **Tự động cache dữ liệu** - Không cần gọi API lại khi data chưa stale
- **Auto reload sau CRUD** - Chỉ reload phần dữ liệu bị thay đổi
- **Optimistic updates** - UI update ngay lập tức, background sync với server
- **Background refetch** - Tự động refetch khi window focus, reconnect

## Cơ chế hoạt động

### 1. Query Keys - Định danh dữ liệu

```javascript
// Query key là mảng định danh dữ liệu
queryKey: ['user', 'profile']        // Profile user
queryKey: ['user', 'balance']        // Balance user
queryKey: ['user', 'borrows']        // Danh sách sách mượn
queryKey: ['books', params]          // Danh sách sách với filter
queryKey: ['book', id]               // Chi tiết sách cụ thể
```

### 2. useQuery - Load và cache dữ liệu

```javascript
import { useUserBalance } from '../hooks/queries';

function UserProfilePage() {
  // Tự động load, cache, và refetch khi cần
  const { data: balanceData, isLoading } = useUserBalance();
  
  // Khi component mount → fetch data
  // Khi component unmount → cache giữ lại
  // Khi component mount lại → dùng cache nếu chưa stale
  
  return <div>Balance: {balanceData?.balance}</div>;
}
```

### 3. useMutation + invalidateQueries - CRUD và auto reload

```javascript
import { useUpdateProfile } from '../hooks/queries';

function ProfileForm() {
  const updateMutation = useUpdateProfile();
  
  const handleSubmit = (data) => {
    // Gọi API update
    updateMutation.mutate(data);
    // ↑ Sau khi thành công, tự động:
    // 1. Invalidate queryKey: ['user', 'profile']
    // 2. Refetch dữ liệu mới
    // 3. Tất cả component dùng useUserProfile sẽ auto update
  };
}
```

## Ví dụ thực tế

### Ví dụ 1: Gia hạn sách (BorrowHistory.jsx)

**Trước (cách cũ):**
```javascript
const executeRenew = async (days) => {
  await userService.renewBook(borrowId, days);
  // Phải manual reload
  queryClient.invalidateQueries({ queryKey: ['user', 'borrows'] });
  userService.refreshBalance(); // Manual
};
```

**Sau (với React Query):**
```javascript
import { useUserBorrows, useRenewBook } from '../hooks/queries';

function BorrowHistory() {
  // Auto load và cache borrows
  const { data: borrows } = useUserBorrows();
  
  // Mutation tự invalidate queries liên quan
  const renewMutation = useRenewBook();
  
  const handleRenew = (borrowId, days) => {
    renewMutation.mutate({ borrowId, days });
    // ↑ Sau khi thành công, tự động:
    // - invalidateQueries(['user', 'borrows'])
    // - invalidateQueries(['librarian', 'borrows'])
    // → UI tự update mà không cần reload trang
  };
}
```

### Ví dụ 2: Nạp tiền (UserProfilePage.jsx)

```javascript
import { useUserBalance, useDeposit } from '../hooks/queries';

function UserProfilePage() {
  // Balance auto load và refetch khi:
  // - Component mount
  // - Window focus (sau khi redirect từ trang thanh toán)
  // - Sau mutation useDeposit thành công
  const { data: balanceData } = useUserBalance();
  
  const depositMutation = useDeposit();
  
  const handleDeposit = (amount) => {
    depositMutation.mutate(amount);
    // ↑ Sau khi thành công, tự động:
    // - invalidateQueries(['user', 'balance'])
    // → Balance số hiển thị tự update
  };
}
```

## Query Key Structure

### Hierarchical Keys

```javascript
// Generic → Specific
['books']                    // Tất cả books
['books', { status: 'active' }]  // Books với filter
['book', 123]                // Book cụ thể ID 123

// Invalidate patterns
queryClient.invalidateQueries({ queryKey: ['books'] })
// ↑ Invalidate tất cả queries bắt đầu bằng ['books']

queryClient.invalidateQueries({ queryKey: ['book', 123] })
// ↑ Chỉ invalidate book ID 123
```

### User-specific Keys

```javascript
['user', 'profile']          // Profile user hiện tại
['user', 'balance']          // Balance
['user', 'borrows']          // Sách đang mượn
['user', 'reservations']     // Đặt trước
['user', 'purchased-ebooks'] // Ebook đã mua
```

### Admin/Librarian Keys

```javascript
['admin', 'users']           // Quản lý users
['admin', 'withdrawals']    // Yêu cầu rút tiền
['librarian', 'borrows']    // Quản lý mượn trả
['reports', 'overview']      // Báo cáo tổng quan
```

## Mutation Patterns

### Pattern 1: Simple Invalidate

```javascript
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put('/profile', data),
    onSuccess: () => {
      // Chỉ invalidate profile
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};
```

### Pattern 2: Multiple Invalidate

```javascript
export const useBorrowBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, days }) => api.post(`/borrow`, { bookId, days }),
    onSuccess: () => {
      // Invalidate tất cả queries liên quan
      queryClient.invalidateQueries({ queryKey: ['librarian', 'borrows'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'overview'] });
    },
  });
};
```

### Pattern 3: Optimistic Update

```javascript
export const usePurchaseEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/ebook/${id}/purchase`),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['ebook', id] });
      
      // Snapshot previous value
      const previousEbook = queryClient.getQueryData(['ebook', id]);
      
      // Optimistically update UI ngay lập tức
      queryClient.setQueryData(['ebook', id], (old) => ({
        ...old,
        is_purchased: true,
      }));
      
      return { previousEbook, id };
    },
    onError: (err, variables, context) => {
      // Rollback nếu lỗi
      if (context?.previousEbook) {
        queryClient.setQueryData(['ebook', context.id], context.previousEbook);
      }
    },
    onSettled: (data, error, variables) => {
      // Luôn refetch để sync với server
      queryClient.invalidateQueries({ queryKey: ['ebook', variables] });
    },
  });
};
```

## Stale Time Configuration

```javascript
useQuery({
  queryKey: ['user', 'profile'],
  queryFn: () => api.get('/profile'),
  staleTime: 5 * 60 * 1000,  // 5 phút - cache vẫn "fresh"
  gcTime: 10 * 60 * 1000,     // 10 phút - xóa khỏi cache
});
```

- **staleTime**: Thời gian data được coi là "fresh" (không refetch)
- **gcTime**: Thời gian data được giữ trong cache (garbage collection)

### Recommended Stale Times

```javascript
// Data thay đổi thường xuyên
balance: 1 * 60 * 1000,           // 1 phút
notifications: 30 * 1000,         // 30 giây

// Data thay đổi ít
profile: 5 * 60 * 1000,           // 5 phút
books: 10 * 60 * 1000,            // 10 phút

// Data tĩnh
ebook details: 30 * 60 * 1000,    // 30 phút
```

## Refetch Options

```javascript
useQuery({
  queryKey: ['user', 'balance'],
  queryFn: () => api.get('/balance'),
  refetchOnWindowFocus: true,      // Refetch khi tab được focus
  refetchOnMount: true,            // Refetch khi component mount
  refetchOnReconnect: true,        // Refetch khi reconnect internet
  refetchInterval: 60000,         // Refetch mỗi 60 giây
});
```

## Best Practices

### 1. Tạo custom hooks cho từng resource

```javascript
// hooks/queries.js
export const useUserProfile = () => useQuery({ ... });
export const useUserBalance = () => useQuery({ ... });
export const useUpdateProfile = () => useMutation({ ... });
```

### 2. Sử dụng query keys có cấu trúc

```javascript
// ✅ Good - hierarchical
['user', 'profile']
['user', 'borrows']

// ❌ Bad - flat
['profile']
['borrows']
```

### 3. Invalidate chính xác queries cần thiết

```javascript
// ✅ Good - chỉ invalidate liên quan
queryClient.invalidateQueries({ queryKey: ['user', 'balance'] });

// ❌ Bad - invalidate tất cả
queryClient.invalidateQueries();
```

### 4. Sử dụng enabled để conditional fetching

```javascript
useQuery({
  queryKey: ['user', 'notifications'],
  queryFn: () => api.get('/notifications'),
  enabled: isAuthenticated,  // Chỉ fetch khi đã login
});
```

## Debugging

### React Query DevTools

```javascript
// main.jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Xem query state

```javascript
const { data, isLoading, isError, error, isFetching, isStale } = useQuery(...);
```

## Migration từ cách cũ

### Trước (useState + useEffect)

```javascript
const [balance, setBalance] = useState('0');
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  userService.getBalance()
    .then(res => setBalance(res.balance))
    .finally(() => setLoading(false));
}, []);

// Sau CRUD - phải manual reload
const handleDeposit = (amount) => {
  api.post('/topup', { amount })
    .then(() => {
      // Manual reload
      userService.getBalance().then(res => setBalance(res.balance));
    });
};
```

### Sau (React Query)

```javascript
const { data: balanceData, isLoading } = useUserBalance();
const depositMutation = useDeposit();

const handleDeposit = (amount) => {
  depositMutation.mutate(amount);
  // ↑ Auto reload balance, không cần code thêm
};
```

## Tóm tắt

| Feature | Cách cũ | React Query |
|---------|---------|-------------|
| Load data | useEffect + useState | useQuery |
| Cache | Manual | Tự động |
| Refetch sau CRUD | Manual code | invalidateQueries |
| Loading state | Manual useState | isLoading từ query |
| Error handling | Manual try/catch | onError callback |
| Optimistic updates | Phức tạp | onMutate callback |

React Query giúp:
- ✅ Giảm code boilerplate
- ✅ Tự động quản lý cache
- ✅ UI update mượt mà sau CRUD
- ✅ Chỉ reload phần data thay đổi
- ✅ Better UX (optimistic updates)
