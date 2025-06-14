const Footer = () => {
  return (
    <footer className="bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start">
        {/* Logo and Email */}
        <div className="mb-8 md:mb-0">
          <h1 className="text-2xl font-bold mb-2">
            <span className="mr-2">✦</span>Fantazy.Pro<sup>®</sup>
          </h1>
          <a href="mailto:hello@genfluence.ai" className="text-blue-400 hover:underline">
            hello@fantazy.pro
          </a>
        </div>

        {/* Grouped Support and Legal sections */}
        <div className="flex flex-row gap-20">
          {/* Support */}
          <div className="mb-8 md:mb-0">
            <h3 className="font-semibold mb-2">Support</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Telegram community</a></li>
              <li><a href="#" className="hover:underline">FAQs</a></li>
              <li><a href="#" className="hover:underline">Refund Policy</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-2">Legal</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
              <li><a href="#" className="hover:underline">Content Moderation</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="text-center text-sm text-gray-400 mt-10">
        Copyright © FantazyPro AI 2025 | All rights reserved
      </div>
    </footer>
  );
};

export default Footer;