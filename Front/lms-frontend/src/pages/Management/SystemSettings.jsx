import React, { useState, useEffect } from 'react';
import {
  Settings, Save, RefreshCw, DollarSign,
  BookOpen, Clock, Percent, Wallet,
  AlertCircle, CheckCircle, Info, Shield
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../hooks/queries';
import { handleApiError } from '../../utils/toastHelper';
import { motion } from 'framer-motion';

const SETTING_GROUPS = [
  {
    title: 'Phí & tiền cọc',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    fields: [
      { key: 'default_daily_fee', label: 'Phí mượn sách / ngày', suffix: '₫', type: 'number', desc: 'Số tiền tính phí cho mỗi ngày mượn sách' },
      { key: 'deposit_percent', label: 'Phần trăm tiền cọc', suffix: '%', type: 'number', desc: 'Phần trăm giá trị sách thu làm tiền cọc' },
      { key: 'max_deposit_amount', label: 'Tiền cọc tối đa', suffix: '₫', type: 'number', desc: 'Mức trần tiền cọc áp dụng cho mỗi lần mượn' },
    ]
  },
  {
    title: 'Quy định mượn trả',
    icon: BookOpen,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    fields: [
      { key: 'max_borrow_per_user', label: 'Số sách tối đa / người', suffix: 'cuốn', type: 'number', desc: 'Giới hạn số sách được mượn đồng thời' },
      { key: 'max_renew_count', label: 'Số lần gia hạn tối đa', suffix: 'lần', type: 'number', desc: 'Mỗi phiếu mượn được gia hạn tối đa bao nhiêu lần' },
      { key: 'overdue_penalty_multiplier', label: 'Hệ số phạt quá hạn', suffix: 'x', type: 'number', step: '0.1', desc: 'Nhân với phí mượn ngày khi sách quá hạn trả' },
      { key: 'reservation_fee_percent', label: 'Phí đặt trước', suffix: '%', type: 'number', desc: 'Phần trăm phí áp dụng khi đặt trước sách' },
    ]
  },
  {
    title: 'Ebook & tài chính tác giả',
    icon: Wallet,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    fields: [
      { key: 'ebook_author_revenue_percent', label: 'Doanh thu tác giả', suffix: '%', type: 'number', desc: 'Tỷ lệ chia doanh thu cho tác giả ebook' },
      { key: 'min_withdrawal_amount', label: 'Rút tiền tối thiểu', suffix: '₫', type: 'number', desc: 'Số tiền tối thiểu cho phép rút' },
      { key: 'author_withdrawal_threshold_percent', label: 'Ngưỡng rút tiền', suffix: '%', type: 'number', desc: 'Ngưỡng phần trăm tổng thu nhập để được phép rút' },
    ]
  },
];

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});

  const { data, isLoading, error } = useSettings();

  useEffect(() => {
    if (data) {
      const settingsData = data?.data || data || {};
      setSettings({ ...settingsData });
      setOriginalSettings({ ...settingsData });
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      handleApiError(error, 'Không thể tải cấu hình hệ thống.');
    }
  }, [error]);


  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings({
    onSuccess: () => {
      setOriginalSettings({ ...settings });
    },
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const hasChanges = () => {
    return Object.keys(originalSettings).some(key => String(settings[key]) !== String(originalSettings[key]));
  };

  const handleSave = () => {
    const payload = {};
    for (const key of Object.keys(settings)) {
      payload[key] = Number(settings[key]);
    }
    updateSettings(payload);
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cấu hình hệ thống</h1>
          <p className="text-slate-500 font-medium mt-1">Thiết lập các tham số vận hành cho toàn bộ thư viện.</p>
        </div>
        <div className="flex gap-3">
          {hasChanges() && (
            <button
              onClick={handleReset}
              className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2"
            >
              <RefreshCw size={18} /> Hoàn tác
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges() || isSaving}
            className={`flex items-center gap-2 py-3 px-8 rounded-2xl font-bold transition-all ${
              hasChanges()
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Đang lưu...' : 'Lưu tất cả'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {hasChanges() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            Bạn có thay đổi chưa được lưu. Nhấn <strong>Lưu tất cả</strong> để áp dụng thay đổi hoặc <strong>Hoàn tác</strong> để khôi phục giá trị cũ.
          </p>
        </motion.div>
      )}

      {/* Settings Groups */}
      {SETTING_GROUPS.map((group, groupIdx) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIdx * 0.1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Group Header */}
          <div className="p-6 border-b border-slate-50 flex items-center gap-3">
            <div className={`${group.bg} ${group.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
              <group.icon size={20} />
            </div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{group.title}</h3>
          </div>

          {/* Fields */}
          <div className="divide-y divide-slate-50">
            {group.fields.map((field) => {
              const value = settings[field.key];
              const originalValue = originalSettings[field.key];
              const isChanged = String(value) !== String(originalValue);

              return (
                <div key={field.key} className={`p-6 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${isChanged ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{field.label}</span>
                      {isChanged && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                          Đã sửa
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{field.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative">
                      <input
                        type={field.type}
                        step={field.step || '1'}
                        value={value ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className={`w-40 px-4 py-3 text-right bg-slate-50 border rounded-2xl text-sm font-bold transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 ${
                          isChanged ? 'border-indigo-200 bg-white' : 'border-slate-100'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest w-8">{field.suffix}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Footer Info */}
      <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
        <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Các thay đổi cấu hình sẽ được ghi nhận trong Nhật ký hệ thống (Audit Log) và có hiệu lực ngay lập tức trên toàn bộ hệ thống.
          Hãy cân nhắc kỹ trước khi thay đổi các tham số tài chính.
        </p>
      </div>
    </div>
  );
};

export default SystemSettings;
