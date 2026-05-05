import { BookOpen, MonitorPlay, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <BookOpen className="w-8 h-8 text-blue-600" />,
    title: "Thư viện Đồ sộ",
    description: "Hàng ngàn đầu sách và E-books đa dạng thể loại, được cập nhật liên tục.",
    color: "bg-blue-100"
  },
  {
    icon: <MonitorPlay className="w-8 h-8 text-indigo-600" />,
    title: "E-Books Trực Tuyến",
    description: "Đọc sách mọi lúc mọi nơi ngay trên thiết bị của bạn với chất lượng cao.",
    color: "bg-indigo-100"
  },
  {
    icon: <Zap className="w-8 h-8 text-amber-600" />,
    title: "Mượn Trả Tiện Lợi",
    description: "Hệ thống quản lý thông minh giúp quá trình mượn và trả sách nhanh chóng.",
    color: "bg-amber-100"
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
    title: "Cam Kết Chất Lượng",
    description: "Tất cả sách và tài liệu đều được kiểm duyệt kỹ lưỡng để đảm bảo trải nghiệm tốt nhất.",
    color: "bg-emerald-100"
  }
];

const FeatureHighlight = () => {
  return (
    <section className="py-16 bg-white shrink-0 shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-800 mb-4"
          >
            Tại sao chọn hệ thống của chúng tôi?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto"
          >
            Hệ thống quản lý thư viện hiện đại với các tính năng vượt trội, mang đến trải nghiệm tuyệt vời cho bạn đọc.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlight;
