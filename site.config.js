/**
 * Cấu hình toàn bộ website. Skill `new-website` sẽ chỉnh file này.
 *
 * Thông tin bí mật (Telegram bot token, chat id, database URL...) KHÔNG đặt ở đây —
 * dùng biến môi trường (.env khi chạy local, Netlify > Site settings > Environment variables khi deploy).
 */
module.exports = {
  // URL chính thức của website (không có dấu / ở cuối). Dùng cho canonical, sitemap, Open Graph.
  siteUrl: process.env.SITE_URL || 'https://sppay.netlify.app',

  name: 'Ví ShopeePay',
  tagline: 'Chạm ứng dụng ShopeePay, mở lối sống tài chính số',
  description:
    'Tải ví điện tử ShopeePay nhận kho voucher 1 triệu đồng: quét mọi QR, nạp điện thoại, thanh toán hoá đơn, mua trước trả sau với SPayLater.',
  lang: 'vi',
  locale: 'vi_VN',
  author: 'Ví ShopeePay',
  logo: '/favicon.svg',
  ogImage: '/images/og-default.png',
  social: {
    facebook: '',
    youtube: '',
    zalo: '',
  },

  nav: [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tính năng', href: '/#tinh-nang' },
    { label: 'Ưu đãi', href: '/#uu-dai' },
    { label: 'Blog', href: '/blog' },
  ],

  // Nút "Tải ứng dụng" — xuất hiện ở nhiều vị trí, mở link trong tab mới.
  // Mỗi lần khách nhấn, server gửi thông báo về Telegram (nếu đã cấu hình TELEGRAM_BOT_TOKEN/CHAT_ID).
  appDownload: {
    label: 'Tải ứng dụng',
    url: 'https://pay.u.shopee.vn/Y5U5ks3',
  },

  // Google Analytics 4 — Measurement ID dạng "G-XXXXXXXXXX". Để trống = tắt.
  analytics: {
    gaMeasurementId: 'G-6CD9WKZ9PQ',
  },

  // Google Search Console — giá trị `content` của thẻ <meta name="google-site-verification">. Để trống = tắt.
  seo: {
    googleSiteVerification: '',
  },

  features: {
    // Form để khách hàng để lại thông tin (họ tên, SĐT, địa chỉ) → gửi về Telegram.
    leadForm: false,
  },

  blog: {
    title: 'Blog',
    description: 'Hướng dẫn sử dụng, mẹo săn voucher và tin ưu đãi mới nhất của ví điện tử ShopeePay.',
    postsPerPage: 10,
  },

  landing: {
    hero: {
      eyebrow: '🎁 Bạn mới nhận ngay kho voucher 1 triệu đồng',
      title: 'Chạm ứng dụng ShopeePay, mở lối sống tài chính số',
      subtitle:
        'Thanh toán chi tiêu thiết yếu tiện lợi với mua trước trả sau linh hoạt, quét mọi QR không giới hạn, thanh toán dịch vụ và đối tác dễ dàng.',
      secondaryCta: { label: 'Xem tính năng', href: '#tinh-nang' },
      image: '/images/hero.svg',
      highlights: ['Miễn phí tải & đăng ký', 'Liên kết 30+ ngân hàng', 'Được NHNN cấp phép'],
    },
    features: [
      { icon: '🎁', title: 'Kho voucher 1 triệu đồng', text: 'Tặng bạn mới khi tải ứng dụng lần đầu: voucher đa dịch vụ từ nạp điện thoại đến thanh toán đối tác.' },
      { icon: '📷', title: 'Thanh toán mọi QR', text: 'Quét mọi QR từ các ví điện tử, ngân hàng và đối tác nhanh chóng, tiện lợi.' },
      { icon: '🛍️', title: 'Vô vàn dịch vụ & đối tác', text: 'Nạp điện thoại, thanh toán hoá đơn, mua sắm trên Shopee và thanh toán ở cửa hàng, siêu thị.' },
      { icon: '💳', title: 'Mua trước trả sau SPayLater', text: 'Linh hoạt quản lý tài chính và tận hưởng cuộc sống trọn vẹn hơn mỗi ngày.' },
    ],
    // Khối ưu đãi (id="uu-dai")
    promos: [
      { value: '100.000Đ', title: 'Ưu đãi bạn mới', text: 'Ưu đãi nạp điện thoại, hoá đơn và đối tác đến 100.000Đ cho bạn mới tải ShopeePay.' },
      { value: '15.000 xu', title: 'Hoàn tiền VietQR', text: 'Hoàn đến 15.000 xu khi quét VietQR để chuyển tiền và thanh toán.' },
      { value: '200.000 xu', title: 'Nhiệm vụ kiếm xu', text: 'Điểm danh mỗi ngày, thực hiện giao dịch để săn đến 200.000 Shopee xu.' },
      { value: 'Giờ vàng', title: 'Khuyến mãi hằng tháng', text: 'Loạt ưu đãi và flash sale giờ vàng khi nạp điện thoại, thanh toán dịch vụ và mua sắm.' },
    ],
    steps: [
      { title: 'Tải ứng dụng', text: 'Nhấn nút "Tải ứng dụng" để cài ShopeePay miễn phí trên điện thoại.' },
      { title: 'Đăng ký & liên kết ngân hàng', text: 'Đăng ký bằng số điện thoại, xác thực và liên kết một trong hơn 30 ngân hàng.' },
      { title: 'Nhận voucher & thanh toán', text: 'Nhận kho voucher 1 triệu đồng và bắt đầu quét QR, nạp điện thoại, trả hoá đơn.' },
    ],
    cta: {
      title: 'Nhận kho voucher 1 triệu đồng ngay hôm nay',
      subtitle: 'Chỉ vài bước đăng ký là bạn có thể quét mọi QR, nạp điện thoại và thanh toán hoá đơn với ưu đãi dành riêng cho bạn mới.',
    },
    faq: [
      { q: 'Tải và đăng ký ShopeePay có mất phí không?', a: 'Không. Ứng dụng ShopeePay miễn phí tải và đăng ký, bạn còn được tặng kho voucher 1 triệu đồng khi là người dùng mới.' },
      { q: 'ShopeePay có an toàn không?', a: 'ShopeePay do Công ty Cổ phần ShopeePay vận hành, được Ngân hàng Nhà nước cấp giấy phép số 92/GP-NHNN ngày 15/12/2025.' },
      { q: 'Tôi có thể nạp tiền vào ví bằng cách nào?', a: 'Bạn liên kết ví với tài khoản của hơn 30 ngân hàng lớn tại Việt Nam để nạp tiền, rút tiền và thanh toán.' },
      { q: 'ShopeePay quét được những mã QR nào?', a: 'Bạn có thể quét mọi mã QR từ các ví điện tử, ngân hàng (VietQR) và đối tác, kể cả để chuyển tiền.' },
      { q: 'SPayLater là gì?', a: 'SPayLater là tính năng mua trước trả sau trong ShopeePay, giúp bạn linh hoạt chi tiêu và thanh toán sau.' },
      { q: 'Cần hỗ trợ thì liên hệ ở đâu?', a: 'Tổng đài ShopeePay: 1900 6906 (09:00 – 17:00, trừ thứ 7, chủ nhật và ngày lễ).' },
    ],
  },

  lead: {
    title: 'Đăng ký nhận tư vấn miễn phí',
    subtitle: 'Để lại thông tin, chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.',
    submitLabel: 'Gửi thông tin',
    successMessage: 'Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm.',
    errorMessage: 'Có lỗi xảy ra, vui lòng thử lại hoặc gọi trực tiếp cho chúng tôi.',
  },
};
