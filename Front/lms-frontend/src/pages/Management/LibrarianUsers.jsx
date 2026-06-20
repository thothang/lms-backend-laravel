import React, { useState, useEffect } from 'react';
import {
  Users, Search, RefreshCw, UserCheck, UserX, Mail, Phone
} from 'lucide-react';
import { useLibrarianUsers, useUpdateUserStatus } from '../../hooks/queries';
import { handleApiError } from '../../utils/toastHelper';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import DetailModal from '../../components/ui/DetailModal';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import api from '../../services/api';

const ROLE_MAP = {
  user: 'Độc giả',
  author: 'Tác giả',
  librarian: 'Thủ thư',
  admin: 'Quản trị viên'
};

const LibrarianUsers = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    keyword: '',
    role: '',
    status: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Pagination
  const { 
    currentPage, 
    perPage, 
    setCurrentPage, 
    resetPage 
  } = usePagination({ defaultPage: 1, defaultPerPage: 10 });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [filters.keyword, filters.role, filters.status, resetPage]);

  // React Query hooks
  const { data: usersData, isLoading, refetch } = useLibrarianUsers({ 
    ...filters, 
    page: currentPage, 
    limit: perPage 
  });
  const updateStatusMutation = useUpdateUserStatus();

  // Extract users from response
  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);
  const totalItems = usersData?.total || 0;
  const totalPages = Math.ceil(totalItems / perPage);

  // Prefetch next page
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextParams = { ...filters, page: currentPage + 1, limit: perPage };
      queryClient.prefetchQuery({
        queryKey: ['librarian', 'users', nextParams],
        queryFn: () => api.get('/librarian/users/all', { params: nextParams }).then(res => res.data)
      });
    }
  }, [currentPage, totalPages, filters, perPage, queryClient]);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    } catch (err) {
      handleApiError(err, 'Không thể cập nhật trạng thái');
    }
  };

  const isUpdating = updateStatusMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý Định danh</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý thông tin, phân loại và trạng thái tài khoản người dùng thư viện.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm tên, email..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-sm"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-bold text-slate-600 outline-none cursor-pointer"
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="">Tất cả Vai trò</option>
              <option value="user">Độc giả</option>
              <option value="author">Tác giả</option>
            </select>

            <select
              className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-bold text-slate-600 outline-none cursor-pointer"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Mọi trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>

            <button
              onClick={() => refetch()}
              disabled={isLoading || isUpdating}
              className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Users size={32} />
          </div>
          <h3 className="font-black text-slate-700 text-lg">Không tìm thấy người dùng</h3>
          <p className="text-slate-400 font-medium">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => {
            const isActive = user.status === 'active';
            const isUserUpdating = isUpdating && updateStatusMutation.variables?.id === user.id;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer"
                onClick={(e) => {
                  if (e.target.closest('button')) return;
                  setSelectedUser(user);
                  setShowUserModal(true);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-gradient-to-tr from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm border border-white text-xl shrink-0">
                      {(user?.name && typeof user.name === 'string') ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-black text-slate-800 text-lg leading-tight truncate max-w-[150px]">{user.name}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-widest mt-1 w-fit">
                        {ROLE_MAP[user.role] || user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(user.id, user.status)}
                    disabled={isUserUpdating}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isUserUpdating ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' :
                        isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105'
                      }`}
                    title={isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                  >
                    {isUserUpdating ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : isActive ? (
                      <UserCheck size={18} />
                    ) : (
                      <UserX size={18} />
                    )}
                  </button>
                </div>

                <div className="space-y-3 flex-1 mt-2">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Mail size={16} className="text-slate-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Phone size={16} className="text-slate-400" />
                    <span>{user.phone || 'Chưa cung cấp'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-50 mt-6 pt-4 flex justify-between items-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isActive ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* User Detail Modal */}
      <DetailModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        data={selectedUser}
        type="user"
      />

    </div>
  );
};

export default LibrarianUsers;
