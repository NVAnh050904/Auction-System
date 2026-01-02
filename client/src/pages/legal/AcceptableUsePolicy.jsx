import { Link } from "react-router";

export default function AcceptableUsePolicy() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="p-8 pl-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Chính sách Sử dụng
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Cập nhật lần cuối: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mục đích
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chính sách này nêu rõ các hành vi được phép và bị cấm trên nền tảng
              đấu giá trực tuyến của chúng tôi nhằm đảm bảo môi trường an toàn và
              công bằng cho tất cả người dùng.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Các hành vi được phép
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Mua bán các mặt hàng hợp pháp thông qua hệ thống đấu giá của chúng tôi
              </li>
              <li>Tạo danh sách chính xác với mô tả trung thực</li>
              <li>Liên lạc với người dùng khác để phục vụ giao dịch</li>
              <li>Sử dụng các tính năng của nền tảng theo mục đích</li>
              <li>
                Đưa ra phản hồi và đánh giá dựa trên trải nghiệm thực tế
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mục cấm
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Ma túy, vũ khí hoặc chất bị kiểm soát</li>
              <li>Hàng bị đánh cắp hoặc hàng giả</li>
              <li>Nội dung hoặc dịch vụ người lớn</li>
              <li>Động vật sống hoặc các bộ phận của loài bị đe dọa</li>
              <li>Vật liệu hoặc hóa chất nguy hiểm</li>
              <li>Hàng hóa vi phạm quyền sở hữu trí tuệ</li>
              <li>Tài liệu do chính phủ phát hành hoặc tiền tệ</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hành vi bị cấm
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Cố gắng xâm nhập, làm gián đoạn hoặc phá hoại hệ thống</li>
              <li>Sử dụng công cụ tự động để thao túng đấu giá</li>
              <li>Tạo nhiều tài khoản để né các hạn chế</li>
              <li>Rửa tiền hoặc gian lận</li>
              <li>Thu thập thông tin người dùng cho mục đích không được phép</li>
              <li>Can thiệp vào quyền sử dụng nền tảng của người khác</li>
              <li>Phân tích ngược hoặc sao chép phần mềm của chúng tôi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hướng dẫn nội dung
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Tất cả nội dung phải phù hợp và thân thiện với gia đình</li>
              <li>Hình ảnh phải mô tả chính xác món hàng đang bán</li>
              <li>Mô tả phải trung thực và đầy đủ</li>
              <li>Không quảng cáo gây hiểu lầm hoặc sai sự thật</li>
              <li>Tôn trọng luật bản quyền và nhãn hiệu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Yêu cầu bảo mật
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Bảo mật thông tin đăng nhập của bạn</li>
              <li>Không chia sẻ tài khoản với người khác</li>
              <li>Báo cáo hoạt động đáng ngờ ngay lập tức</li>
              <li>Sử dụng mật khẩu mạnh và khác nhau cho từng dịch vụ</li>
              <li>Kích hoạt xác thực hai yếu tố khi có thể</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thực thi
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi có quyền điều tra các vi phạm chính sách này và áp dụng các biện pháp phù hợp, bao gồm:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Gỡ bỏ nội dung hoặc danh sách</li>
              <li>Tạm ngưng hoặc chấm dứt tài khoản</li>
              <li>Báo cáo hành vi phạm pháp cho cơ quan chức năng</li>
              <li>Thực hiện hành động pháp lý khi cần thiết</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thông tin liên hệ
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nếu bạn có câu hỏi về Chính sách Sử dụng này hoặc cần báo cáo vi phạm, vui lòng liên hệ với chúng tôi qua <Link to={"/contact"} className="text-blue-600">trang liên hệ</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
