import React, { useState } from 'react';
import { Bell, Check, Clock, X, MessageSquare, AlertCircle, Book, Calendar, CreditCard, User } from 'lucide-react';
import { useNotifications, useMarkNotificationRead } from '../hooks/queries';
import { handleApiError } from '../utils/toastHelper';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPanel = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { data: notificationsData, isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const notifications = notificationsData?.data || notificationsData || [];

  const handleMouseEnter = (notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
      case 'contact_message':
        return <MessageSquare size={20} className="text-indigo-600" />;
      case 'borrow':
      case 'return':
        return <Book size={20} className="text-emerald-600" />;
      case 'reservation':
        return <Calendar size={20} className="text-amber-600" />;
      case 'payment':
        return <CreditCard size={20} className="text-rose-600" />;
      case 'system':
        return <AlertCircle size={20} className="text-slate-600" />;
      default:
        return <Bell size={20} className="text-indigo-600" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'message':
        return 'Tin nhắn';
      case 'contact_message':
        return 'Thư liên hệ';
      case 'borrow':
        return 'Mượn sách';
      case 'return':
        return 'Trả sách';
      case 'reservation':
        return 'Đặt trước';
      case 'payment':
        return 'Thanh toán';
      case 'system':
        return 'Hệ thống';
      default:
        return 'Thông báo';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Bell size={24} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800">Thông báo</h1>
                <p className="text-slate-500 text-sm">
                  {notifications.filter(n => !n.is_read).length} thông báo chưa đọc
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-medium transition-all"
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Bell size={32} />
              </div>
              <h3 className="font-black text-slate-700 text-lg">Không có thông báo</h3>
              <p className="text-slate-400 font-medium">Bạn chưa có thông báo nào.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onMouseEnter={() => handleMouseEnter(notification)}
                onClick={() => setSelectedNotification(notification)}
                className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                  !notification.is_read
                    ? 'border-l-4 border-l-indigo-500 border-slate-200'
                    : 'border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !notification.is_read ? 'bg-indigo-50' : 'bg-slate-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-bold text-slate-800 ${!notification.is_read ? 'text-base' : 'text-sm'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded shrink-0">
                        <Clock size={10} /> {new Date(notification.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2">{notification.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      {!notification.is_read && (
                        <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Chưa đọc
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{selectedNotification.title}</h3>
                    <p className="text-slate-500 text-sm">{getNotificationTypeLabel(selectedNotification.type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-slate-50 p-4 rounded-xl mb-4">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNotification.content}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{new Date(selectedNotification.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                  {selectedNotification.is_read && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check size={14} />
                      <span>Đã đọc</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
