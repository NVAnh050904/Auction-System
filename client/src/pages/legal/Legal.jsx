import { Link } from "react-router";

export default function Legal() {
  const legalPages = [
    {
      title: "Chính sách bảo mật",
      description:
        "Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.",
      to: "/legal/privacy-policy",
    },
    {
      title: "Điều khoản Dịch vụ",
      description:
        "Các điều khoản và điều kiện điều chỉnh việc sử dụng nền tảng của bạn.",
      to: "/legal/terms-of-service",
    },
    {
      title: "Chính sách DMCA",
      description: "Chính sách xử lý các khiếu nại vi phạm bản quyền.",
      to: "/legal/dmca",
    },
    {
      title: "Bộ quy tắc ứng xử",
      description:
        "Hướng dẫn về hành vi tôn trọng và phù hợp trên nền tảng của chúng tôi.",
      to: "/legal/code-of-conduct",
    },
    {
      title: "Chính sách Sử dụng",
      description: "Các quy định về những gì bạn có thể và không thể làm trên nền tảng.",
      to: "/legal/acceptable-use-policy",
    },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="p-8 pl-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tài liệu Pháp lý
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Vui lòng xem các tài liệu pháp lý của chúng tôi để hiểu quyền và
            trách nhiệm khi sử dụng nền tảng đấu giá trực tuyến.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {legalPages.map((page) => (
              <Link
                key={page.to}
                to={page.to}
                className="block p-6 bg-gray-50 rounded-sm shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {page.title}
                </h3>
                <p className="text-gray-600 text-sm">{page.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thắc mắc?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Nếu bạn có câu hỏi về các chính sách pháp lý, vui lòng liên hệ với chúng tôi qua <Link to={"/contact"} className="text-blue-600">trang liên hệ</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
