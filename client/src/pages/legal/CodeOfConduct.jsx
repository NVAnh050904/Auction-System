export default function CodeOfConduct() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="p-8 pl-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Bộ Quy tắc Ứng xử
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Cập nhật lần cuối: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cam kết của chúng tôi
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi cam kết tạo ra một môi trường chào đón, an toàn và bình đẳng
              cho tất cả người dùng nền tảng đấu giá, bất kể nền tảng, danh tính hay kinh nghiệm.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hành vi mong đợi
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Tôn trọng và lịch sự với mọi người dùng</li>
              <li>Giao tiếp chuyên nghiệp trong mọi tương tác</li>
              <li>Mô tả chính xác các mặt hàng khi đăng bán</li>
              <li>Thực hiện cam kết của bạn với tư cách người mua và người bán</li>
              <li>Tôn trọng quyền riêng tư và thông tin cá nhân của người khác</li>
              <li>Tuân thủ tất cả quy định và hướng dẫn của nền tảng</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hành vi không chấp nhận được
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Quấy rối, đe dọa hoặc phân biệt đối xử</li>
              <li>Lời lẽ thù ghét hoặc xúc phạm</li>
              <li>Hành vi gian lận hoặc lừa đảo</li>
              <li>Spam hoặc nội dung quảng cáo không mong muốn</li>
              <li>Chia sẻ thông tin cá nhân mà không có sự đồng ý</li>
              <li>Cố gắng thao túng kết quả đấu giá</li>
              <li>Tạo tài khoản giả hoặc giả mạo người khác</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Báo cáo vi phạm
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nếu bạn chứng kiến hoặc trải nghiệm hành vi vi phạm bộ quy tắc này, vui lòng báo cáo ngay qua hệ thống báo cáo hoặc liên hệ tới support@yourauction.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hệ quả
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vi phạm bộ quy tắc có thể dẫn đến:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Cảnh cáo hoặc tạm đình chỉ</li>
              <li>Gỡ bỏ nội dung hoặc danh sách</li>
              <li>Chấm dứt tài khoản vĩnh viễn</li>
              <li>Hành động pháp lý nếu cần</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quy trình kháng cáo
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nếu bạn cho rằng mình bị xử lý không công bằng, bạn có thể kháng cáo quyết định bằng cách liên hệ qua trang liên hệ và cung cấp chi tiết vụ việc.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
