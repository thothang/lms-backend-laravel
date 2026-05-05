import React, { useState } from 'react';
import {
  Mail, Send, Search, Users, X, Clock, MessageSquare, CheckCircle, AlertCircle, Inbox
} from 'lucide-react';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import {
  useLibrarianMessages,
  useLibrarianUsers,
  useContactMessages,
  useSendLibrarianMessage,
  useReplyContact,
} from '../../hooks/queries';
import { librarianService } from '../../services/librarianService';

const LibrarianMessages = () => {
  const [activeTab, setActiveTab] = useState('sent');

  // Contact Message Filters
  const [contactStatus, setContactStatus] = useState('all');
  const [contactSearch, setContactSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Compose Form
  const [showCompose, setShowCompose] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Queries
  const { data: messagesData, isLoading: isLoadingMessages } = useLibrarianMessages();
  const { data: usersData, isLoading: isLoadingUsers } = useLibrarianUsers({ limit: 500 });
  const { data: contactStats, refetch: refetchContactStats } = (() => {
    const query = useContactMessages({
      status: contactStatus === 'all' ? undefined : contactStatus,
      search: contactSearch || undefined
    });
    return { data: null, refetch: query.refetch };
  })();
  
  // Separate query for contact messages stats
  const [contactStatsData, setContactStatsData] = useState(null);
  const [contactMessages, setContactMessages] = useState([]);

  // Fetch contact messages and stats when tab is active
  React.useEffect(() => {
    if (activeTab === 'contact') {
      const fetchContactData = async () => {
        try {
          const statsRes = await librarianService.getContactMessageStats();
          setContactStatsData(statsRes);
        } catch (err) {
          handleApiError(err, 'Lỗi tải thống kê thư liên hệ');
        }
      };
      fetchContactData();
    }
  }, [activeTab, contactStatus, contactSearch]);

  // Mutations
  const sendMessageMutation = useSendLibrarianMessage();
  const replyContactMutation = useReplyContact();

  const messages = messagesData?.data || messagesData || [];
  const users = usersData?.data || usersData || [];
  const isLoading = isLoadingMessages || isLoadingUsers;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!receiverId || !title.trim() || !content.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        receiver_id: receiverId,
        title: title,
        content: content
      });
      setShowCompose(false);
      setTitle('');
      setContent('');
      setReceiverId('');
    } catch (err) {
      handleApiError(err, 'Không thể gửi tin nhắn');
    }
  };

  const handleReplyContact = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !replyingTo) return;

    try {
      await replyContactMutation.mutateAsync({
        id: replyingTo.id,
        reply: replyMessage
      });
      setReplyingTo(null);
      setReplyMessage('');
      setContactStatus('answered'); // Refresh to show answered tab
    } catch (err) {
      handleApiError(err, 'Không thể trả lời thư');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Trạm Liên Lạc</h1>
          <p className="text-slate-500 font-medium mt-1">Gửi thông báo và quản lý tin nhắn với người dùng.</p>
        </div>
        {activeTab === 'sent' && (
          <button
            onClick={() => setShowCompose(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <Send size={18} /> Soạn tin nhắn
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sent' 
              ? 'bg-indigo-50 text-indigo-600' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Mail size={18} /> Hộp thư đã gửi
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'contact' 
              ? 'bg-amber-50 text-amber-600' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Inbox size={18} /> Thư liên hệ
          {contactStatsData?.pending_count > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
              {contactStatsData.pending_count}
            </span>
          )}
        </button>
      </div>

      {/* Sent Messages Tab */}
      {activeTab === 'sent' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Mail size={20} className="text-indigo-600" /> Hộp thư đã gửi
            </h3>
          </div>
          
          <div className="divide-y divide-slate-50">
            {isLoading ? (
               <div className="p-12 flex justify-center">
                 <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : messages.length === 0 ? (
               <div className="p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Mail size={32} />
                  </div>
                  <h3 className="font-black text-slate-700 text-lg">Trống trải quá!</h3>
                  <p className="text-slate-400 font-medium">Bạn chưa gửi thông báo nào cho ai từ khi nhận việc.</p>
               </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                       <Mail size={20} />
                     </div>
                     <div className="flex-1">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">{msg.title}</h4>
                          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded w-fit">
                             <Clock size={12} /> {new Date(msg.created_at).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{msg.content}</p>
                        
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100/50">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gửi tới:</span>
                           <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                             {msg.receiver ? msg.receiver.name : `User ID: ${msg.receiver_id}`}
                           </span>
                        </div>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Contact Messages Tab */}
      {activeTab === 'contact' && (
        <ContactMessagesTab
          contactMessages={contactMessages}
          setContactMessages={setContactMessages}
          contactStatus={contactStatus}
          setContactStatus={setContactStatus}
          contactSearch={contactSearch}
          setContactSearch={setContactSearch}
          contactStats={contactStatsData}
          setReplyingTo={setReplyingTo}
        />
      )}

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-indigo-50/50">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Send size={20} className="text-indigo-600" /> Soạn tin nhắn mới
                </h3>
                <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSendMessage} className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Người nhận</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      required
                      value={receiverId}
                      onChange={(e) => setReceiverId(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 outline-none cursor-pointer appearance-none"
                    >
                      <option value="" disabled>-- Chọn người dùng --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Tiêu đề</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thông báo ngắn gọn..."
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Nội dung</label>
                  <textarea
                    required
                    rows="5"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Viết nội dung chi tiết..."
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCompose(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Hủy bỏ</button>
                  <Button type="submit" isLoading={sendMessageMutation.isPending} className="flex items-center gap-2 px-8">
                    Phóng đi <Send size={16}/>
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply to Contact Modal */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-amber-50/50">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Send size={20} className="text-amber-600" /> Trả lời thư liên hệ
                </h3>
                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Original Message */}
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-800">{replyingTo.name || 'Khách'}</span>
                    <span className="text-slate-400 text-sm">&lt;{replyingTo.email}&gt;</span>
                  </div>
                  {replyingTo.subject && (
                    <div className="font-bold text-slate-700 text-sm mb-2">{replyingTo.subject}</div>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed">{replyingTo.message}</p>
                </div>

                <form onSubmit={handleReplyContact}>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Phản hồi của bạn</label>
                    <textarea
                      required
                      rows="6"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Viết phản hồi của bạn..."
                      className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-amber-100 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setReplyingTo(null)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Hủy bỏ</button>
                    <Button type="submit" isLoading={replyContactMutation.isPending} className="flex items-center gap-2 px-8 bg-amber-600 hover:bg-amber-700">
                      Gửi phản hồi <Send size={16}/>
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Separate component for Contact Messages Tab to use hook properly
const ContactMessagesTab = ({ 
  contactMessages, 
  setContactMessages, 
  contactStatus, 
  setContactStatus, 
  contactSearch, 
  setContactSearch, 
  contactStats,
  setReplyingTo 
}) => {
  const { data, isLoading, refetch } = useContactMessages({
    status: contactStatus === 'all' ? undefined : contactStatus,
    search: contactSearch || undefined
  });

  React.useEffect(() => {
    if (data) {
      setContactMessages(data?.data || data || []);
    }
  }, [data, setContactMessages]);

  const messages = data?.data || data || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Inbox size={20} className="text-amber-600" /> Thư liên hệ
        </h3>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <select
            value={contactStatus}
            onChange={(e) => setContactStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa trả lời</option>
            <option value="answered">Đã trả lời</option>
          </select>
        </div>
      </div>
      
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
               <MessageSquare size={32} />
             </div>
             <h3 className="font-black text-slate-700 text-lg">Không có thư nào</h3>
             <p className="text-slate-400 font-medium">Chưa có thư liên hệ nào trong danh mục này.</p>
          </div>
        ) : (
          messages.map((contact) => (
            <div key={contact.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      contact.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {contact.status === 'pending' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{contact.name || 'Khách'}</span>
                        <span className="text-slate-400 text-sm">&lt;{contact.email}&gt;</span>
                      </div>
                      {contact.subject && (
                        <div className="font-bold text-slate-700 text-sm mb-2">{contact.subject}</div>
                      )}
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded w-fit">
                         <Clock size={12} /> {new Date(contact.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  {contact.status === 'pending' && (
                    <button
                      onClick={() => setReplyingTo(contact)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all flex items-center gap-2 shrink-0"
                    >
                      <Send size={16} /> Trả lời
                    </button>
                  )}
                </div>
                
                <div className="pl-13">
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl">
                    {contact.message}
                  </p>
                </div>

                {contact.status === 'answered' && contact.reply_message && (
                  <div className="pl-13">
                    <div className="text-xs font-black uppercase text-emerald-600 tracking-widest mb-2">Phản hồi của bạn:</div>
                    <p className="text-slate-600 text-sm leading-relaxed bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      {contact.reply_message}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Trả lời bởi {contact.replier?.name} • {new Date(contact.replied_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LibrarianMessages;
