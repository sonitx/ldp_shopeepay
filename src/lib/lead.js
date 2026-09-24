const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

/** Kiểm tra dữ liệu form đăng ký. Trả về { lead, errors }. */
function validateLead(body = {}) {
  const lead = {
    fullName: clean(body.fullName, 100),
    phone: clean(body.phone, 20),
    address: clean(body.address, 250),
  };
  const errors = {};
  if (lead.fullName.length < 2) errors.fullName = 'Vui lòng nhập họ và tên';
  if (!/^\+?[0-9][0-9 .-]{7,14}$/.test(lead.phone)) errors.phone = 'Số điện thoại không hợp lệ';
  if (lead.address.length < 3) errors.address = 'Vui lòng nhập địa chỉ';
  return { lead, errors };
}

module.exports = { validateLead };
