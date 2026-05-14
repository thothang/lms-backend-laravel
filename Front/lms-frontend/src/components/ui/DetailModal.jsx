import React from 'react';
import Modal from './Modal';
import { 
  BookOpen, User, Wallet, Calendar, Clock, 
  FileText, Package, CheckCircle, XCircle, 
  AlertCircle, MapPin, Phone, Mail, IdCard
} from 'lucide-react';

const DetailModal = ({ isOpen, onClose, data, type }) => {
  if (!data) return null;

  const renderDetailRow = (Icon, label, value, color = 'text-slate-600') => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`text-sm font-medium ${color} break-words`}>{value || '—'}</div>
      </div>
    </div>
  );

  const renderStatusBadge = (status) => {
    const statusConfig = {
      // Ebook/Transaction status
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Đã duyệt' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Đang chờ' },
      rejected: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Đã từ chối' },
      active: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Đang hoạt động' },
      inactive: { bg: 'bg-slate-50', text: 'text-slate-600', label: 'Không hoạt động' },
      returned: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Đã trả' },
      overdue: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Quá hạn' },
      borrowed: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Đang mượn' },
      // Borrow record specific
      pending_pickup: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Chờ nhận sách' },
      pending_return: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Chờ thanh toán' },
      lost: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Mất sách' },
      cancelled: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Đã hủy' },
      // Transaction status
      success: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Thành công' },
      failed: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Thất bại' },
      // Reservation status
      fulfilled: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Đã hoàn tất' },
    };
    const config = statusConfig[status] || { bg: 'bg-slate-50', text: 'text-slate-600', label: status };
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider`}>
        {config.label}
      </span>
    );
  };

  const renderEbookDetails = () => (
    <div className="space-y-4">
      {data.cover_image && (
        <div className="flex justify-center mb-6">
          <img 
            src={data.cover_image} 
            alt={data.title} 
            className="w-48 h-64 object-cover rounded-2xl shadow-lg"
          />
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-slate-800 mb-2">{data.title}</h3>
        <div className="flex justify-center gap-2 mb-3">
          {renderStatusBadge(data.status)}
          {data.is_free && (
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Miễn phí
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm line-clamp-3">{data.description}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Tác giả', data.author_name || data.author?.name)}
        {renderDetailRow(FileText, 'Danh mục', data.category?.name)}
        {renderDetailRow(Wallet, 'Giá', data.is_free ? 'Miễn phí' : `${Number(data.price).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(Calendar, 'Ngày đăng', new Date(data.created_at).toLocaleDateString('vi-VN'))}
        {renderDetailRow(CheckCircle, 'Lượt mua', data.purchase_count || 0)}
        {renderDetailRow(CheckCircle, 'Đánh giá trung bình', data.average_rating ? `${data.average_rating}/5` : 'Chưa có')}
        {data.rejection_reason && renderDetailRow(XCircle, 'Lý do từ chối', data.rejection_reason, 'text-rose-600')}
      </div>
    </div>
  );

  const renderUserDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-black mx-auto mb-3">
          {(data?.name && typeof data.name === 'string') ? data.name.charAt(0).toUpperCase() : '?'}
        </div>
        <h3 className="text-xl font-black text-slate-800">{data.name}</h3>
        {renderStatusBadge(data.status)}
        <div className="mt-2 text-xs font-black text-slate-400 uppercase tracking-wider">{data.role}</div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(Mail, 'Email', data.email)}
        {renderDetailRow(Phone, 'Số điện thoại', data.phone)}
        {renderDetailRow(MapPin, 'Địa chỉ', data.address)}
        {renderDetailRow(Calendar, 'Ngày sinh', data.dob ? new Date(data.dob).toLocaleDateString('vi-VN') : null)}
        {renderDetailRow(Wallet, 'Số dư', `${Number(data.balance || 0).toLocaleString('vi-VN')} ₫`, 'text-emerald-600')}
        {renderDetailRow(AlertCircle, 'Tổng nợ', `${Number(data.total_debt || 0).toLocaleString('vi-VN')} ₫`, data.total_debt > 0 ? 'text-rose-600' : 'text-slate-600')}
        {renderDetailRow(Calendar, 'Ngày tham gia', new Date(data.created_at).toLocaleDateString('vi-VN'))}
      </div>
    </div>
  );

  const renderTransactionDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 ${
          data.status === 'success' ? 'bg-emerald-500' : data.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
        }`}>
          {data.status === 'success' ? '✓' : data.status === 'pending' ? '⏳' : '✗'}
        </div>
        <h3 className="text-xl font-black text-slate-800">Giao dịch #{data.id}</h3>
        {renderStatusBadge(data.status)}
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Người dùng', data.user?.name)}
        {renderDetailRow(FileText, 'Loại giao dịch', data.type)}
        {renderDetailRow(Wallet, 'Số tiền', `${Number(data.amount || 0).toLocaleString('vi-VN')} ₫`, 'text-slate-800 font-black')}
        {renderDetailRow(Calendar, 'Thời gian', new Date(data.created_at).toLocaleString('vi-VN'))}
        {data.payment_gateway && renderDetailRow(Package, 'Cổng thanh toán', data.payment_gateway)}
        {data.gateway_transaction_id && renderDetailRow(IdCard, 'Mã giao dịch cổng', data.gateway_transaction_id)}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="py-3 border-b border-slate-50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Thông tin thêm</div>
            <div className="text-sm text-slate-600 space-y-1">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">{key}:</span>
                  <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBorrowDetails = () => {
    // Determine if overdue
    const isOverdue = data.status !== 'returned' && data.status !== 'cancelled' && 
      data.due_date && new Date(data.due_date) < new Date();
    
    return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black mx-auto mb-3">
          <BookOpen size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800">Phiếu mượn #{data.id}</h3>
        <div className="mt-2 flex gap-2 justify-center">
          {renderStatusBadge(data.status)}
          {isOverdue && (
            <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Quá hạn
            </span>
          )}
        </div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Người mượn', data.user?.name || data.guest_name)}
        {renderDetailRow(BookOpen, 'Sách mượn', data.book?.title || data.copy?.book?.title)}
        {renderDetailRow(Calendar, 'Ngày mượn', data.borrow_date ? new Date(data.borrow_date).toLocaleDateString('vi-VN') : '—')}
        {renderDetailRow(Calendar, 'Hạn trả', data.due_date ? new Date(data.due_date).toLocaleDateString('vi-VN') : '—', isOverdue ? 'text-rose-600' : 'text-slate-600')}
        {data.actual_return_date && renderDetailRow(Calendar, 'Ngày trả thực tế', new Date(data.actual_return_date).toLocaleDateString('vi-VN'))}
        {renderDetailRow(Wallet, 'Phí mượn/ngày', `${Number(data.daily_fee_applied || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(Wallet, 'Tiền cọc', `${Number(data.deposit_amount || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(Wallet, 'Đã trả trước', `${Number(data.prepaid_amount || 0).toLocaleString('vi-VN')} ₫`)}
        {data.actual_fee !== null && renderDetailRow(Wallet, 'Phí thực tế', `${Number(data.actual_fee || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(CheckCircle, 'Số lần gia hạn', data.renew_count || 0)}
        {data.copy?.barcode && renderDetailRow(IdCard, 'Mã bản copy', data.copy.barcode)}
      </div>
    </div>
    );
  };

  const renderReservationDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 text-2xl font-black mx-auto mb-3">
          <Clock size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800">Đặt trước #{data.id}</h3>
        {renderStatusBadge(data.status)}
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Người đặt', data.user?.name)}
        {renderDetailRow(BookOpen, 'Sách yêu cầu', data.book?.title)}
        {renderDetailRow(Calendar, 'Ngày đặt', new Date(data.created_at).toLocaleDateString('vi-VN'))}
        {renderDetailRow(Calendar, 'Ngày hết hạn', data.expires_at ? new Date(data.expires_at).toLocaleDateString('vi-VN') : null)}
        {renderDetailRow(CheckCircle, 'Vị trí hàng đợi', `#${data.queue_position}`)}
        {renderDetailRow(Wallet, 'Phí giữ chỗ', `${Number(data.fee || 0).toLocaleString('vi-VN')} ₫`)}
        {data.notes && renderDetailRow(FileText, 'Ghi chú', data.notes)}
      </div>
    </div>
  );

  const renderBookDetails = () => (
    <div className="space-y-4">
      {data.cover_image && (
        <div className="flex justify-center mb-6">
          <img 
            src={data.cover_image} 
            alt={data.title} 
            className="w-48 h-64 object-cover rounded-2xl shadow-lg"
          />
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-slate-800 mb-2">{data.title}</h3>
        <div className="flex justify-center gap-2 mb-3">
          {data.is_hot && (
            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Hot
            </span>
          )}
          {data.is_featured && (
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Nổi bật
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm line-clamp-3">{data.description}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Tác giả', data.author_name)}
        {renderDetailRow(FileText, 'Danh mục', data.category?.name || data.category_name)}
        {renderDetailRow(Package, 'Bản sao', `${data.available_copies || 0} / ${data.total_copies || 0} (Sẵn có / Tổng)`)}
        {renderDetailRow(Wallet, 'Phí mượn/ngày', `${Number(data.daily_fee || 0).toLocaleString('vi-VN')} ₫`, 'text-indigo-600 font-bold')}
        {renderDetailRow(Wallet, 'Giá bìa', `${Number(data.price || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(FileText, 'Nhà xuất bản', data.publisher)}
        {renderDetailRow(Calendar, 'Ngày nhập', data.created_at ? new Date(data.created_at).toLocaleDateString('vi-VN') : null)}
      </div>
    </div>
  );

  const renderLogDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 text-2xl font-black mx-auto mb-3">
          <Activity size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800">Chi tiết Log #{data.id}</h3>
        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
          {data.action}
        </span>
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Người thực hiện', data.user?.name || 'Hệ thống')}
        {renderDetailRow(FileText, 'Bảng tác động', data.table_name)}
        {renderDetailRow(Package, 'ID Bản ghi', data.record_id)}
        {renderDetailRow(Calendar, 'Thời gian', new Date(data.created_at).toLocaleString('vi-VN'))}
        
        {data.old_values && Object.keys(data.old_values).length > 0 && (
          <div className="py-3 border-b border-slate-50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Giá trị cũ</div>
            <pre className="text-[10px] bg-slate-100 p-2 rounded-lg overflow-x-auto text-slate-600">
              {JSON.stringify(data.old_values, null, 2)}
            </pre>
          </div>
        )}
        
        {data.new_values && Object.keys(data.new_values).length > 0 && (
          <div className="py-3 border-b border-slate-50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Giá trị mới</div>
            <pre className="text-[10px] bg-indigo-50 p-2 rounded-lg overflow-x-auto text-indigo-900 font-medium">
              {JSON.stringify(data.new_values, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'ebook':
        return renderEbookDetails();
      case 'book':
        return renderBookDetails();
      case 'user':
        return renderUserDetails();
      case 'transaction':
        return renderTransactionDetails();
      case 'borrow':
        return renderBorrowDetails();
      case 'reservation':
        return renderReservationDetails();
      case 'log':
        return renderLogDetails();
      default:
        return <div className="text-center text-slate-500">Không có thông tin chi tiết</div>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'ebook': return 'Chi tiết Ebook';
      case 'book': return 'Chi tiết Sách';
      case 'user': return 'Thông tin người dùng';
      case 'transaction': return 'Chi tiết giao dịch';
      case 'borrow': return 'Chi tiết phiếu mượn';
      case 'reservation': return 'Chi tiết đặt trước';
      case 'log': return 'Chi tiết Nhật ký';
      default: return 'Chi tiết';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="max-w-lg">
      {renderContent()}
    </Modal>
  );
};

export default DetailModal;
