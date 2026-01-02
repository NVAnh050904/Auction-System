import { Link } from "react-router";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="p-8 pl-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Chính sách Bảo mật
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Cập nhật lần cuối: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Giới thiệu
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chính sách Bảo mật này mô tả cách nền tảng đấu giá trực tuyến của chúng tôi ("chúng tôi") thu thập, sử dụng và bảo vệ thông tin của bạn khi bạn sử dụng dịch vụ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thông tin chúng tôi thu thập
            </h2>

            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Thông tin cá nhân
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Họ tên và thông tin liên hệ</li>
              <li>Địa chỉ email</li>
              <li>Thông tin thanh toán</li>
              <li>Địa chỉ giao hàng</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Thông tin kỹ thuật
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Địa chỉ IP</li>
              <li>Hệ điều hành thiết bị</li>
              <li>Loại thiết bị (di động, máy tính, máy tính bảng)</li>
              <li>Thông tin trình duyệt</li>
              <li>Dữ liệu sử dụng và phân tích</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cách chúng tôi sử dụng thông tin của bạn
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Để cung cấp và duy trì dịch vụ đấu giá</li>
              <li>Để xử lý giao dịch và thanh toán</li>
              <li>Để liên lạc với bạn về tài khoản và giao dịch</li>
              <li>Để ngăn chặn gian lận và đảm bảo an ninh nền tảng</li>
              <li>Để cải thiện dịch vụ và trải nghiệm người dùng</li>
              <li>Để tuân thủ các nghĩa vụ pháp lý</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Lưu giữ dữ liệu
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi lưu giữ thông tin cá nhân của bạn trong thời gian cần thiết để cung cấp dịch vụ. Thông tin kỹ thuật như địa chỉ IP và chi tiết thiết bị được giữ trong 6 tháng cho mục đích bảo mật, sau đó sẽ tự động bị xóa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bảo mật dữ liệu
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập, thay đổi, tiết lộ hoặc hủy hoại trái phép.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quyền của bạn
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Truy cập thông tin cá nhân của bạn</li>
              <li>Sửa thông tin không chính xác</li>
              <li>Yêu cầu xóa thông tin của bạn</li>
              <li>Phản đối việc xử lý thông tin</li>
              <li>Chuyển giao dữ liệu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Liên hệ
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nếu bạn có câu hỏi về Chính sách Bảo mật, vui lòng liên hệ với chúng tôi qua <Link to={"/contact"} className="text-blue-600">trang liên hệ</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
