import React from "react";
import { Link } from "react-router";

export const Hero = () => {
  return (
    <section className="bg-gray-50 pt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Tương lai mới của
            <span className="text-indigo-900 block">Đấu giá trực tuyến</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Tìm món đồ bạn yêu thích, tham gia đấu giá và bán những vật phẩm của bạn cho người khác — tất cả trong một nền tảng đáng tin cậy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <button className="bg-indigo-900 text-white px-8 py-3 rounded-md hover:bg-indigo-800 transition-colors font-medium text-lg">
                Đăng ký ngay
              </button>
            </Link>
            <Link to="/login">
              <button className="bg-white text-indigo-900 border-2 border-indigo-800 px-8 py-3 rounded-md hover:bg-blue-50 transition-colors font-medium text-lg">
                Đăng nhập
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
