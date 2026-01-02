export default function DMCAPolicy() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="p-8 pl-3">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Chính sách DMCA</h1>
          <p className="text-sm text-gray-600 mb-8">
            Cập nhật lần cuối: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Luật bản quyền kỹ thuật số (DMCA)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chúng tôi tôn trọng quyền sở hữu trí tuệ của người khác và mong người dùng cũng làm như vậy. Chúng tôi sẽ phản hồi các thông báo vi phạm bản quyền hợp lệ theo DMCA.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nộp Thông báo DMCA
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nếu bạn cho rằng nội dung trên nền tảng của chúng tôi vi phạm bản quyền của bạn, vui lòng cung cấp cho đại diện được chỉ định các thông tin sau:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Chữ ký vật lý hoặc điện tử của chủ sở hữu bản quyền hoặc đại diện được ủy quyền
              </li>
              <li>
                Xác định tác phẩm bản quyền bị cho là bị xâm phạm
              </li>
              <li>
                Xác định tư liệu bị cho là vi phạm
              </li>
              <li>Thông tin liên hệ của bạn (địa chỉ, số điện thoại, email)</li>
              <li>
                Một tuyên bố rằng bạn tin tưởng một cách thiện chí rằng việc sử dụng không được phép
              </li>
              <li>
                Một tuyên bố rằng thông tin là chính xác và bạn có quyền hành động
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Phản hồi (Counter-Notification)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nếu bạn cho rằng nội dung của mình bị gỡ bỏ do nhầm lẫn, bạn có thể nộp phản hồi chứa:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Chữ ký vật lý hoặc điện tử của bạn</li>
              <li>Xác định tư liệu bị gỡ bỏ và vị trí của nó</li>
              <li>
                Một tuyên bố dưới lời thề rằng việc gỡ bỏ là một sai lầm
              </li>
              <li>Thông tin liên hệ của bạn</li>
              <li>Chấp nhận thẩm quyền của tòa liên bang</li>
            </ul>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Người vi phạm lặp lại
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Chúng tôi sẽ chấm dứt tài khoản của những người dùng tái phạm vi phạm quyền sở hữu trí tuệ.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
