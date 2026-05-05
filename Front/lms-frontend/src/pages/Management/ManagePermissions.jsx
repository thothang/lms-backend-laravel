import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Search, Save,
  Users, CheckCircle, XCircle, RefreshCw,
  ToggleLeft, ToggleRight, Mail, Info
} from 'lucide-react';
import { useLibrarianPermissions, useUpdatePermissions } from '../../hooks/queries';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { motion } from 'framer-motion';

const PERMISSION_LABELS = {
  can_approve_ebook: { label: 'Duyệt Ebook', desc: 'Cho phép kiểm duyệt và phê duyệt bản thảo ebook từ tác giả' },
  can_manage_finance: { label: 'Quản lý tài chính', desc: 'Truy cập báo cáo tài chính và xử lý yêu cầu rút tiền' },
  can_manage_users: { label: 'Quản lý người dùng', desc: 'Xem và chỉnh sửa thông tin, trạng thái người dùng' },
  can_manage_books: { label: 'Quản lý kho sách', desc: 'Thêm, sửa, xóa sách và quản lý số bản sao' },
  can_manage_borrow_offline: { label: 'Mượn/Trả Offline', desc: 'Xử lý giao dịch mượn trả trực tiếp tại quầy' },
  can_manage_reservations: { label: 'Quản lý đặt trước', desc: 'Xử lý hàng chờ đặt trước sách' },
  can_mark_lost_books: { label: 'Báo mất/hỏng sách', desc: 'Ghi nhận sách bị mất hoặc hư hỏng' },
  can_view_reports: { label: 'Xem báo cáo', desc: 'Truy cập các loại báo cáo thống kê' },
  can_manage_hot_books: { label: 'Quản lý sách hot', desc: 'Đánh dấu và quản lý danh sách sách nổi bật' },
  can_manage_messages: { label: 'Quản lý tin nhắn', desc: 'Gửi và quản lý thông báo tới người dùng' },
};

const ManagePermissions = () => {
  const [librarians, setLibrarians] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  // Track local edits: { [librarianId]: { permKey: bool, ... } }
  const [editedPermissions, setEditedPermissions] = useState({});

  // React Query for fetching permissions
  const { isLoading, refetch } = useLibrarianPermissions();

  // React Query mutation for updating permissions
  const updatePermissionsMutation = useUpdatePermissions();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPermissions = async () => {
    const res = await refetch();
    if (res.data) {
      setLibrarians(res.data.data || res.data || []);
      setEditedPermissions({});
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (librarianId, permKey) => {
    setEditedPermissions(prev => {
      const currentPerms = prev[librarianId] || {};
      const librarian = librarians.find(l => l.id === librarianId);
      const originalVal = librarian?.permissions?.[permKey] ?? false;
      const currentVal = currentPerms[permKey] ?? originalVal;
      return {
        ...prev,
        [librarianId]: {
          ...currentPerms,
          [permKey]: !currentVal
        }
      };
    });
  };

  const getPermValue = (librarianId, permKey) => {
    const edited = editedPermissions[librarianId];
    if (edited && permKey in edited) return edited[permKey];
    const librarian = librarians.find(l => l.id === librarianId);
    return librarian?.permissions?.[permKey] ?? false;
  };

  const hasChanges = (librarianId) => {
    const edited = editedPermissions[librarianId];
    if (!edited) return false;
    const librarian = librarians.find(l => l.id === librarianId);
    return Object.keys(edited).some(key => edited[key] !== (librarian?.permissions?.[key] ?? false));
  };

  const handleSave = async (librarianId) => {
    const librarian = librarians.find(l => l.id === librarianId);
    const edited = editedPermissions[librarianId] || {};
    // Build full permissions object with all keys
    const mergedPermissions = {};
    Object.keys(PERMISSION_LABELS).forEach(key => {
      if (key in edited) {
        mergedPermissions[key] = edited[key];
      } else {
        mergedPermissions[key] = librarian?.permissions?.[key] ?? false;
      }
    });

    setSavingId(librarianId);
    try {
      await updatePermissionsMutation.mutateAsync({
        userId: librarianId,
        permissions: mergedPermissions
      });
      showSuccess(`Đã cập nhật quyền cho ${librarian.name}`);
      
      // Update local state with the merged permissions
      setLibrarians(prev => prev.map(l => 
        l.id === librarianId ? { ...l, permissions: mergedPermissions } : l
      ));
      // Clear edited state for this librarian
      setEditedPermissions(prev => {
        const next = { ...prev };
        delete next[librarianId];
        return next;
      });
    } catch (err) {
      handleApiError(err, 'Không thể cập nhật quyền.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredLibrarians = useMemo(() => {
    return librarians.filter(l =>
      l.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [librarians, debouncedSearchTerm]);

  const countActivePerms = (librarianId) => {
    return Object.keys(PERMISSION_LABELS).filter(k => getPermValue(librarianId, k)).length;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Phân quyền Thủ thư</h1>
          <p className="text-slate-500 font-medium mt-1">Cấu hình chi tiết quyền hạn cho từng thủ thư trong hệ thống.</p>
        </div>
        <button
          onClick={fetchPermissions}
          className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm thủ thư theo tên hoặc email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLibrarians.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center">
          <ShieldAlert size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 italic">Không tìm thấy thủ thư nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLibrarians.map((librarian, idx) => (
            <motion.div
              key={librarian.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Librarian Header */}
              <div
                className="p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedId(expandedId === librarian.id ? null : librarian.id)}
              >
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm border border-white text-lg">
                  {(librarian?.name && typeof librarian.name === 'string') ? librarian.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-800 tracking-tight">{librarian.name}</div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Mail size={12} /> {librarian.email}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    {countActivePerms(librarian.id)}/{Object.keys(PERMISSION_LABELS).length} quyền
                  </span>
                  {hasChanges(librarian.id) && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 animate-pulse">
                      Chưa lưu
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${expandedId === librarian.id ? 'rotate-90' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              {expandedId === librarian.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="border-t border-slate-50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => {
                        const isActive = getPermValue(librarian.id, key);
                        return (
                          <button
                            key={key}
                            onClick={() => handleToggle(librarian.id, key)}
                            className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${
                              isActive
                                ? 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300'
                                : 'border-slate-100 bg-slate-50/30 hover:border-slate-200'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isActive ? (
                                <ToggleRight size={24} className="text-indigo-600" />
                              ) : (
                                <ToggleLeft size={24} className="text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-slate-500'}`}>
                                {label}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-50">
                      <button
                        onClick={() => handleSave(librarian.id)}
                        disabled={!hasChanges(librarian.id) || savingId === librarian.id}
                        className={`flex items-center gap-2 py-3 px-8 rounded-2xl font-bold text-sm transition-all ${
                          hasChanges(librarian.id)
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {savingId === librarian.id ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        {savingId === librarian.id ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ManagePermissions;
