import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';
import { BookOpen, Users, Target, Award, Heart, Globe, Mail, Phone, MapPin } from 'lucide-react';

const AboutPage = () => {
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
        <section className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300 rounded-full blur-3xl"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <BookOpen size={16} />
              <span className="text-sm font-medium">Về chúng tôi</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              LMS<span className="text-indigo-200">Library</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
              Hệ thống quản lý thư viện hiện đại, kết nối tri thức đến mọi người. 
              Chúng tôi tin rằng kiến thức là chìa khóa mở ra mọi cánh cửa.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Sứ mệnh của chúng tôi</h2>
                <p className="text-slate-600 leading-relaxed mb-6">
                  LMSLibrary được thành lập với tầm nhìn phổ cập kiến thức cho mọi người. Chúng tôi cung cấp 
                  nền tảng thư viện số tiện lợi, giúp bạn đọc tiếp cận hàng ngàn đầu sách vật lý và ebook 
                  chất lượng cao một cách dễ dàng, nhanh chóng và tiết kiệm.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Với hệ thống quản lý mượn trả thông minh, ví điện tử tích hợp và kho sách đa dạng, 
                  chúng tôi cam kết mang đến trải nghiệm đọc sách hiện đại và thuận tiện nhất cho cộng đồng.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">10,000+</h3>
                  <p className="text-sm text-slate-500 mt-1">Đầu sách</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">5,000+</h3>
                  <p className="text-sm text-slate-500 mt-1">Thành viên</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">50+</h3>
                  <p className="text-sm text-slate-500 mt-1">Thể loại</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">99%</h3>
                  <p className="text-sm text-slate-500 mt-1">Hài lòng</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Giá trị cốt lõi</h2>
            <p className="text-slate-500 mb-12 max-w-xl mx-auto">Những nguyên tắc định hướng mọi hoạt động của LMSLibrary</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
                  <Target size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Minh bạch</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mọi thông tin về phí mượn, thời hạn, quy định đều được công khai rõ ràng. 
                  Không có phí ẩn hay điều khoản bất ngờ.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-50 to-slate-50 border border-violet-100">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-600/20">
                  <Heart size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Cộng đồng</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Xây dựng cộng đồng đọc sách lành mạnh, nơi mọi người có thể chia sẻ, 
                  đánh giá và giới thiệu sách hay cho nhau.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-100">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/20">
                  <Award size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Chất lượng</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Chọn lọc kỹ càng từng đầu sách, đảm bảo nội dung chính hãng, 
                  bản quyền rõ ràng, chất lượng in ấn tốt nhất.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Liên hệ với chúng tôi</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Địa chỉ</h4>
                    <p className="text-sm text-slate-600">123 Đường Sách, Thành phố Tri Thức, Việt Nam</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Điện thoại</h4>
                    <p className="text-sm text-slate-600">1900 1234</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Email</h4>
                    <p className="text-sm text-slate-600">support@lmslibrary.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.main>

      <Footer />
    </div>
  );
};

export default AboutPage;
