import React from 'react';
import { useRankingProfile } from '../../hooks/queries';
import { Award, TrendingUp, TrendingDown, Star, Calendar } from 'lucide-react';

const RankingHistory = () => {
  const { data: rankingData, isLoading, error } = useRankingProfile();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-red-500">
        Đã có lỗi xảy ra khi tải dữ liệu hạng.
      </div>
    );
  }

  const { reward_points = 0, membership_tier = 'bronze', history } = rankingData || {};
  const pointHistory = history?.data || [];

  const getTierDetails = (tier) => {
    switch (tier) {
      case 'bronze': return { name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Star className="text-amber-700" size={24} /> };
      case 'silver': return { name: 'Bạc', color: 'text-slate-500', bg: 'bg-slate-200', icon: <Star className="text-slate-500" size={24} /> };
      case 'gold': return { name: 'Vàng', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Star className="text-yellow-600" size={24} /> };
      case 'platinum': return { name: 'Bạch Kim', color: 'text-cyan-600', bg: 'bg-cyan-100', icon: <Star className="text-cyan-600" size={24} /> };
      default: return { name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Star className="text-amber-700" size={24} /> };
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      'returned_book_on_time': 'Trả sách đúng hạn',
      'returned_book_early': 'Trả sách sớm',
      'returned_book_late': 'Trả sách trễ hạn',
      'lost_book': 'Làm mất sách',
      'purchased_ebook': 'Mua Ebook',
      'bought_ebook': 'Mua Ebook',
      'cancelled_fulfilled_reservation': 'Hủy đặt sách đã sẵn sàng',
      'wrote_review': 'Đánh giá chất lượng',
      'tier_upgrade': 'Thưởng lên hạng',
      'topup': 'Nạp tiền vào ví'
    };
    return labels[reason] || reason;
  };

  const getNextTierInfo = (points) => {
    if (points < 1000) return { nextTier: 'Bạc', targetPoints: 1000, progress: (points / 1000) * 100, remaining: 1000 - points };
    if (points < 5000) return { nextTier: 'Vàng', targetPoints: 5000, progress: (points / 5000) * 100, remaining: 5000 - points };
    if (points < 10000) return { nextTier: 'Bạch Kim', targetPoints: 10000, progress: (points / 10000) * 100, remaining: 10000 - points };
    return { nextTier: null, targetPoints: 10000, progress: 100, remaining: 0 };
  };

  const tierInfo = getTierDetails(membership_tier);
  const nextTierInfo = getNextTierInfo(reward_points);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Award className="text-indigo-600" />
          Xếp hạng thành viên
        </h2>
        
        <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 rounded-xl p-6 border border-slate-100">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${tierInfo.bg} shadow-sm border-4 border-white shrink-0`}>
            {tierInfo.icon}
          </div>
          
          <div className="text-center md:text-left flex-1 w-full">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Hạng hiện tại</h3>
            <div className={`text-3xl font-extrabold ${tierInfo.color} mb-2`}>
              Thành viên {tierInfo.name}
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Bạn đang có <strong className="text-indigo-600 text-lg">{reward_points}</strong> điểm thưởng.
            </p>

            {/* Progress Bar */}
            {nextTierInfo.nextTier ? (
              <div className="w-full lg:w-4/5 mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Tiến trình lên hạng <strong className="text-slate-700">{nextTierInfo.nextTier}</strong></span>
                  <span className="font-medium">{reward_points} / {nextTierInfo.targetPoints}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(nextTierInfo.progress, 100)}%` }}></div>
                </div>
                <p className="text-xs text-slate-500">
                  Cần thêm <strong className="text-indigo-600">{nextTierInfo.remaining}</strong> điểm để thăng hạng.
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-3 py-1.5 rounded-full mt-2 border border-emerald-100">
                🎉 Chúc mừng bạn đã đạt cấp bậc cao nhất!
              </p>
            )}
          </div>
          
          <div className="w-full md:w-auto bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
            <div className="font-semibold text-slate-800 mb-2">Đặc quyền của bạn:</div>
            <ul className="space-y-1 list-disc list-inside">
              {membership_tier === 'bronze' && <li>Tích lũy điểm để lên hạng</li>}
              {membership_tier === 'silver' && <li>Giảm 10% phí mượn sách</li>}
              {membership_tier === 'gold' && <li>Giảm 30% phí đặt cọc, 20% phí mượn</li>}
              {membership_tier === 'platinum' && <li>Giảm 50% phí đặt cọc, 30% phí mượn</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="text-indigo-600" />
          Lịch sử điểm thưởng
        </h2>

        {pointHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Bạn chưa có lịch sử điểm thưởng nào.
          </div>
        ) : (
          <div className="space-y-4">
            {pointHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.points > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {item.points > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{getReasonLabel(item.reason)}</h4>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-lg ${item.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingHistory;
