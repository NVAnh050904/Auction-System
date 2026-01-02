import { Link } from "react-router";

export const Footer = () => {
  // Use Vite env var VITE_FOOTER_BG to point to your Cloudinary image URL
  const footerBg = import.meta.env.VITE_FOOTER_BG || 'https://res.cloudinary.com/dbxr69tjo/image/upload/v1767382105/pngtree-full-screen-dollar-banknotes-financial-management-industry-background-picture-image_1090064_nvb7gj.png';

  return (
      <footer
        className="py-8 bg-cover bg-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${footerBg})`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white">Auction System</h3>
              <p className="text-yellow-200 text-sm">Your trusted marketplace since 2026</p>
            </div>
            <div className="flex space-x-6">
              <Link
                to="/about"
                className="text-yellow-100 hover:text-white text-sm transition-colors"
              >
                About
              </Link>
              <Link
                to="/legal"
                className="text-yellow-100 hover:text-white text-sm transition-colors"
              >
                Legal
              </Link>
              <Link
                to="/contact"
                className="text-yellow-100 hover:text-white text-sm transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-white/20 mt-6 pt-6 text-center">
            <p className="text-white text-sm">
              © 2026 Online Auction System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
  );
};
