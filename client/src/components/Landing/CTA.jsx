import React from "react";
import { Link } from "react-router";

export const CTA = () => {
  return (
    <section className="bg-indigo-800 py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Sẵn sàng bắt đầu hành trình đấu giá của bạn?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Tham gia cộng đồng của chúng tôi ngay hôm nay để khám phá những ưu đãi hấp dẫn hoặc biến món đồ của bạn thành tiền mặt. Bắt đầu thật nhanh chóng và đơn giản.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auction">
            <div className="bg-white cursor-pointer text-indigo-900 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors font-medium text-lg">
              Khám phá đấu giá
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
