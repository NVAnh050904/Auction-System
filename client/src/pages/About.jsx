import { Link } from "react-router";
import { useSelector } from "react-redux";

export const About = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-sm shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Giới thiệu đề tài
          </h1>

          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
            <p className="text-lg">
              Trong bối cảnh Internet ngày càng phát triển, các ứng dụng mạng đóng vai trò quan trọng trong nhiều lĩnh vực, đặc biệt là thương mại điện tử. Đề tài Hệ thống Đấu giá Trực tuyến được xây dựng nhằm áp dụng các kiến thức của môn Lập trình mạng vào việc phát triển một ứng dụng cho phép nhiều người dùng kết nối, trao đổi dữ liệu và tham gia đấu giá thông qua môi trường mạng.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Mục tiêu của đề tài
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Áp dụng kiến thức lập trình mạng để xây dựng hệ thống theo mô
                  hình client – server
                </li>
                <li>
                  Hiểu và triển khai cơ chế giao tiếp, trao đổi dữ liệu giữa các
                  thành phần trong hệ thống
                </li>
                <li>
                  Nghiên cứu cách xử lý nhiều người dùng truy cập và tương tác
                  đồng thời
                </li>
                <li>
                  Xây dựng một ứng dụng mạng có tính thực tiễn và khả năng mở
                  rộng
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Phạm vi và đối tượng nghiên cứu
              </h2>
              <p>
                Đối tượng nghiên cứu của đề tài là các kỹ thuật và mô hình lập
                trình mạng được áp dụng trong hệ thống đấu giá trực tuyến.
                Phạm vi đề tài tập trung vào việc xây dựng một ứng dụng hoạt động
                trên nền tảng web, cho phép người dùng đăng ký, đăng nhập, gửi
                và nhận dữ liệu đấu giá theo thời gian thực.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Các chức năng chính của hệ thống
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Đăng ký, đăng nhập và xác thực người dùng</li>
                <li>Quản lý thông tin tài khoản người dùng</li>
                <li>Đăng bán và quản lý sản phẩm đấu giá</li>
                <li>Tham gia đấu giá và cập nhật giá theo thời gian thực</li>
                <li>
                  Giao diện thân thiện, tương thích với nhiều thiết bị khác nhau
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ý nghĩa của đề tài
              </h2>
              <p>
                Đề tài giúp sinh viên củng cố kiến thức lý thuyết và thực hành
                môn Lập trình mạng, đồng thời làm quen với quy trình phân tích,
                thiết kế và xây dựng một ứng dụng mạng hoàn chỉnh. Đây cũng là
                nền tảng để tiếp cận các hệ thống thực tế trong lĩnh vực thương
                mại điện tử và ứng dụng mạng.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-center">
                Nếu bạn cần thêm thông tin hoặc hỗ trợ, vui lòng{" "}
                <Link
                  to="/contact"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  liên hệ với chúng tôi
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
