// Chuyển chuỗi (kể cả tiếng Việt có dấu) thành slug: "Hướng dẫn Đăng ký" -> "huong-dan-dang-ky"
module.exports = function slugify(input) {
  return String(input)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
