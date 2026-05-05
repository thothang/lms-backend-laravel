import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';
import { BookOpen, Clock, AlertTriangle, CheckCircle, XCircle, DollarSign, CalendarDays, ShieldCheck, Info } from 'lucide-react';

const BorrowingRulesPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1"
      >
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-56 h-56 bg-violet-400 rounded-full blur-3xl"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <ShieldCheck size={16} />
              <span className="text-sm font-medium">Quy định thư viện</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Quy Định Mượn Trả Sách
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Vui lòng đọc kỹ các quy định dưới đây trước khi sử dụng dịch vụ mượn sách tại LMSLibrary.
            </p>
          </div>
        </section>

        {/* Rules Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            {/* Section 1: Điều kiện mượn sách */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
                <CheckCircle className="text-indigo-100" size={24} />
                <h2 className="text-lg font-bold text-white">1. Điều kiện mượn sách</h2>
              </div>
              <div className="p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-indigo-600 rounded-full shrink-0"></span>
                    <span className="text-slate-600">Người mượn phải đăng ký tài khoản và xác minh email thành công trên hệ thống LMSLibrary.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-indigo-600 rounded-full shrink-0"></span>
                    <span className="text-slate-600">Tài khoản phải có đủ số dư trong ví nội bộ để đặt cọc cho cuốn sách muốn mượn.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-indigo-600 rounded-full shrink-0"></span>
                    <span className="text-slate-600">Mỗi thành viên được mượn tối đa <strong className="text-slate-800">5 cuốn sách</strong> cùng lúc.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2: Thời hạn mượn */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-violet-600 px-6 py-4 flex items-center gap-3">
                <Clock className="text-violet-100" size={24} />
                <h2 className="text-lg font-bold text-white">2. Thời hạn mượn sách</h2>
              </div>
              <div className="p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-violet-600 rounded-full shrink-0"></span>
                    <span className="text-slate-600">Thời hạn mượn mặc định: <strong className="text-slate-800">14 ngày</strong> kể từ ngày xác nhận mượn.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-violet-600 rounded-full shrink-0"></span>
                    <span className="text-slate-600">Bạn đọc có thể <strong className="text-slate-800">gia hạn 1 lần</strong> (thêm 7 ngày) nếu sách chưa được đặt trước bởi người khác.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-violet-600 rounded-full shrink-0"></span>
                    <span className="text-slate-600">Sau khi hết hạn, hệ thống sẽ tự động tính phí phạt quá hạn.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3: Phí & Tiền cọc */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
                <DollarSign className="text-emerald-100" size={24} />
                <h2 className="text-lg font-bold text-white">3. Phí mượn & Tiền cọc</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-bold text-slate-800">Hạng mục</th>
                        <th className="text-left py-3 px-4 font-bold text-slate-800">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium">Phí mượn</td>
                        <td className="py-3 px-4">Tính theo <strong>ngày</strong>, hiển thị trên trang chi tiết sách (ví dụ: 2.000 ₫/ngày).</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium">Tiền cọc</td>
                        <td className="py-3 px-4">Trừ trước từ ví nội bộ, sẽ <strong>hoàn lại</strong> khi trả sách đúng hạn và sách còn nguyên vẹn.</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium">Phí quá hạn</td>
                        <td className="py-3 px-4">Tính theo ngày quá hạn, trừ trực tiếp vào tiền cọc.</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Mua E-Book</td>
                        <td className="py-3 px-4">Thanh toán 1 lần qua ví nội bộ. Sở hữu vĩnh viễn & đọc không giới hạn.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 4: Quy trình trả sách */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
                <CalendarDays className="text-amber-100" size={24} />
                <h2 className="text-lg font-bold text-white">4. Quy trình trả sách</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-100">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Xác nhận trả</h4>
                    <p className="text-xs text-slate-500">Vào trang Cá nhân → Lịch sử mượn → Chọn "Trả sách".</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-100">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Kiểm tra tình trạng</h4>
                    <p className="text-xs text-slate-500">Hệ thống kiểm tra phí mượn, phí quá hạn (nếu có) và tính toán hoàn cọc.</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-100">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Hoàn tất</h4>
                    <p className="text-xs text-slate-500">Tiền cọc được hoàn vào ví (sau khi trừ phí), sách trở lại trạng thái sẵn sàng.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Vi phạm */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
                <XCircle className="text-rose-100" size={24} />
                <h2 className="text-lg font-bold text-white">5. Xử lý vi phạm</h2>
              </div>
              <div className="p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                    <span className="text-slate-600"><strong className="text-slate-800">Trả sách quá hạn:</strong> Bị trừ phí phạt vào tiền cọc. Nếu phí phạt vượt quá số tiền cọc, tài khoản sẽ bị nợ.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                    <span className="text-slate-600"><strong className="text-slate-800">Làm hư hỏng sách:</strong> Phải bồi thường theo giá bìa của cuốn sách.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                    <span className="text-slate-600"><strong className="text-slate-800">Làm mất sách:</strong> Phải bồi thường 100% giá bìa và không được hoàn cọc.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                    <span className="text-slate-600"><strong className="text-slate-800">Tài khoản nợ quá hạn:</strong> Bị tạm khóa chức năng mượn sách cho đến khi thanh toán hết khoản nợ.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Note */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex items-start gap-4">
              <Info className="text-indigo-600 mt-0.5 shrink-0" size={22} />
              <div>
                <h3 className="font-bold text-indigo-800 mb-1">Lưu ý quan trọng</h3>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Các quy định trên có thể được cập nhật theo thời gian. Vui lòng kiểm tra lại định kỳ. 
                  Nếu có bất kỳ thắc mắc nào, hãy liên hệ đội ngũ hỗ trợ qua email 
                  <strong> support@lmslibrary.com</strong> hoặc hotline <strong>1900 1234</strong>.
                </p>
              </div>
            </div>

          </div>
        </section>
      </motion.main>

      <Footer />
    </div>
  );
};

export default BorrowingRulesPage;
