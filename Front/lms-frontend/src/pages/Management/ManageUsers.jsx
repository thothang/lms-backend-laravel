import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, MoreVertical, Lock, Unlock, ArrowUpCircle
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import DetailModal from '../../components/ui/DetailModal';
import { useUsers, useUpdateUserStatus, useMakeAuthor } from '../../hooks/queries';

const ManageUsers = () => {
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // React Query hooks
  const { data: usersData, isLoading } = useUsers();
  const updateStatusMutation = useUpdateUserStatus();
  const makeAuthorMutation = useMakeAuthor();

  // Pagination
  const { 
    currentPage, 
    perPage, 
    setCurrentPage, 
    resetPage,
    calculateTotalPages 
  } = usePagination({ defaultPage: 1, defaultPerPage: 10 });

  // Search state (managed internally for debounce)
  const [searchTerm, setSearchTerm] = useState('');

  // Reset page when search/filter changes
  useEffect(() => {
    resetPage();
  }, [searchTerm, filterRole]);

  const handleStatusToggle = (user) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    updateStatusMutation.mutate(
      { id: user.id, status: newStatus },
      {
        onError: (err) => {
          handleApiError(err);
        },
      }
    );
  };

  const handleMakeAuthor = (userId) => {
    if (!window.confirm('Bạn có chắc muốn nâng cấp người dùng này lên vai trò Tác giả?')) return;
    makeAuthorMutation.mutate(userId, {
      onError: (err) => {
        handleApiError(err);
      },
    });
  };

  // Filter users (computed on the fly)
  const filteredUsers = useMemo(() => {
    const users = usersData?.data || usersData || [];
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [usersData, searchTerm, filterRole]);

  // Paginated users
  const totalPages = calculateTotalPages(filteredUsers.length);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, currentPage, perPage]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý người dùng</h1>
          <p className="text-slate-500 font-medium mt-1">Quản soát tài khoản, phân quyền và bảo mật hệ thống.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <Users size={20} className="text-indigo-600" />
              <span className="font-black text-slate-800">{filteredUsers.length} <span className="text-slate-400 font-bold ml-1 text-xs uppercase">Users</span></span>
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Tìm theo tên hoặc email người dùng..."
            debounceMs={300}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['all', 'user', 'author', 'librarian', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest whitespace-nowrap transition-all border ${
                filterRole === role 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-lg' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tham gia</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-slate-100 rounded-full"></div><div className="space-y-2"><div className="h-3 bg-slate-100 rounded w-24"></div><div className="h-2 bg-slate-50 rounded w-32"></div></div></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={(e) => {
                    if (e.target.closest('button')) return;
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center font-black text-slate-500 shadow-sm border border-white">
                          {(user?.name && typeof user.name === 'string') ? user.name.charAt(0).toUpperCase() : '?'}
                       </div>
                       <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm tracking-tight truncate max-w-[180px]">{user.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      user.role === 'admin' ? 'bg-rose-50 text-rose-600' :
                      user.role === 'librarian' ? 'bg-amber-50 text-amber-600' :
                      user.role === 'author' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                       <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`}></div>
                       <span className="text-[11px] font-bold text-slate-600 capitalize">{user.status || 'active'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-500">{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                       <AnimatePresence>
                          {user.role === 'user' && (user.status === 'active' || user.status === 'unverified') && (
                            <button 
                              onClick={() => handleMakeAuthor(user.id)}
                              className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              title="Nâng cấp lên Tác giả"
                            >
                              <ArrowUpCircle size={18} />
                            </button>
                          )}
                       </AnimatePresence>
                       <button 
                         onClick={() => handleStatusToggle(user)}
                         className={`p-2.5 rounded-xl transition-all shadow-sm ${
                           user.status === 'active' 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                         }`}
                         title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                       >
                         {user.status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}
                       </button>
                       <button className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                          <MoreVertical size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredUsers.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">Không tìm thấy người dùng nào.</div>
          )}
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          perPage={perPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

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

export default ManageUsers;
