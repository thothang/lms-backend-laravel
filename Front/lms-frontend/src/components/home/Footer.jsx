import { Link } from 'react-router-dom';
import { Library, Mail, Phone, MapPin, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 pt-16 pb-8 text-slate-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-2 rounded-lg" aria-hidden="true">
                <Library size={24} />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">
                LMS<span className="text-indigo-400">Library</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 mt-4">
              Hệ thống quản lý thư viện hiện đại, kết nối tri thức đến mọi người. Cung cấp hàng ngàn đầu sách và e-books miễn phí.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" aria-label="Chia sẻ trên mạng xã hội" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-indigo-600"><Share2 size={18} /></a>
            </div>
          </div>

          <nav aria-label="Liên kết nhanh">
            <h3 className="text-white font-semibold text-lg mb-6">Liên kết nhanh</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Về chúng tôi</Link></li>
              <li><Link to="/borrowing-rules" className="text-sm hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Quy định mượn trả sách</Link></li>
              <li><Link to="/catalog" className="text-sm hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Danh mục sách</Link></li>
              <li><a href="#" className="text-sm hover:text-indigo-400 transition-colors inline-block hover:translate-x-1 transform duration-200">Chính sách bảo mật</a></li>
            </ul>
          </nav>

          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-indigo-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-sm">123 Đường Sách, Thành phố Tri Thức, Việt Nam</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-indigo-400 shrink-0" aria-hidden="true" />
                <span className="text-sm">1900 1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-indigo-400 shrink-0" aria-hidden="true" />
                <span className="text-sm">support@lmslibrary.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Tải ứng dụng</h3>
            <p className="text-sm text-slate-400 mb-4">Trải nghiệm trên thiết bị di động tốt hơn cùng App LMSLibrary.</p>
            <div className="flex flex-col gap-3">
              <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 transition-colors" aria-label="Tải ứng dụng trên App Store">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Tải về từ App Store" className="h-6" />
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 transition-colors" aria-label="Tải ứng dụng trên Google Play">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Tải về từ Google Play" className="h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} LMS Library. All rights reserved.
          </p>
          <nav aria-label="Điều khoản và bảo mật">
            <div className="flex gap-4 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
              <span aria-hidden="true">|</span>
              <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
