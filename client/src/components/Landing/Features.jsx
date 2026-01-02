import React from 'react'
import { FaClock, FaGavel, FaShieldAlt } from 'react-icons/fa'

export const Features = () => {
  return (
    <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vì sao chọn nền tảng của chúng tôi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp môi trường đấu giá an toàn, thân thiện và dễ sử dụng cho mọi nhu cầu của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGavel className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Đấu giá dễ dàng
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Đặt giá tự tin với giao diện trực quan, dễ sử dụng. Theo dõi lượt đấu giá của bạn và nhận cập nhật trạng thái phiên đấu giá theo thời gian thực.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Giao dịch an toàn
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Mọi giao dịch của bạn được bảo vệ bằng các tiêu chuẩn bảo mật hàng đầu trong ngành. Mua bán hoàn toàn yên tâm.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-2xl text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Đấu giá 24/7
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Không bỏ lỡ bất kỳ cơ hội nào. Nền tảng của chúng tôi hoạt động liên tục 24/7, cho phép bạn đấu giá và bán hàng bất cứ khi nào thuận tiện.
              </p>
            </div>
          </div>
        </div>
      </section>
  )
}
