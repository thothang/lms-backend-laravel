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
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Đã duyệt' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Đang chờ' },
      rejected: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Đã từ chối' },
      active: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Đang hoạt động' },
      inactive: { bg: 'bg-slate-50', text: 'text-slate-600', label: 'Không hoạt động' },
      returned: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Đã trả' },
      overdue: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Quá hạn' },
      borrowed: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Đang mượn' },
      success: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Thành công' },
      failed: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Thất bại' },
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

  const renderBorrowDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black mx-auto mb-3">
          <BookOpen size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800">Phiếu mượn #{data.id}</h3>
        {renderStatusBadge(data.status)}
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
        {renderDetailRow(User, 'Người mượn', data.user?.name || data.guest_name)}
        {renderDetailRow(BookOpen, 'Sách mượn', data.book?.title || data.copy?.book?.title)}
        {renderDetailRow(Calendar, 'Ngày mượn', new Date(data.borrow_date).toLocaleDateString('vi-VN'))}
        {renderDetailRow(Calendar, 'Hạn trả', new Date(data.due_date).toLocaleDateString('vi-VN'), new Date(data.due_date) < new Date() && data.status !== 'returned' ? 'text-rose-600' : 'text-slate-600')}
        {data.return_date && renderDetailRow(Calendar, 'Ngày trả', new Date(data.return_date).toLocaleDateString('vi-VN'))}
        {renderDetailRow(Wallet, 'Phí mượn/ngày', `${Number(data.daily_fee_applied || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(Wallet, 'Tiền cọc', `${Number(data.deposit_amount || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(Wallet, 'Đã trả trước', `${Number(data.prepaid_amount || 0).toLocaleString('vi-VN')} ₫`)}
        {data.actual_fee !== null && renderDetailRow(Wallet, 'Phí thực tế', `${Number(data.actual_fee || 0).toLocaleString('vi-VN')} ₫`)}
        {renderDetailRow(CheckCircle, 'Số lần gia hạn', data.renew_count || 0)}
        {data.copy?.barcode && renderDetailRow(IdCard, 'Mã bản copy', data.copy.barcode)}
      </div>
    </div>
  );

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

  const renderContent = () => {
    switch (type) {
      case 'ebook':
        return renderEbookDetails();
      case 'user':
        return renderUserDetails();
      case 'transaction':
        return renderTransactionDetails();
      case 'borrow':
        return renderBorrowDetails();
      case 'reservation':
        return renderReservationDetails();
      default:
        return <div className="text-center text-slate-500">Không có thông tin chi tiết</div>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'ebook': return 'Chi tiết Ebook';
      case 'user': return 'Thông tin người dùng';
      case 'transaction': return 'Chi tiết giao dịch';
      case 'borrow': return 'Chi tiết phiếu mượn';
      case 'reservation': return 'Chi tiết đặt trước';
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
