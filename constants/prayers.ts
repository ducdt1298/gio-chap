/**
 * Vietnamese Prayer Text Templates (Văn khấn mẫu)
 * Placeholders: {{TÊN_GIA_CHỦ}}, {{ĐỊA_CHỈ}}, {{NGÀY_ÂM_LỊCH}}, {{TÊN_NGƯỜI_QUÁ_CỐ}}
 */

import type { PrayerRow } from '@/lib/db/database';

export const PRAYER_CATEGORIES: Record<string, string> = {
  ram_mung1: 'Rằm & Mùng 1',
  gio: 'Cúng Giỗ',
  tat_nien: 'Tất Niên',
  giao_thua: 'Giao Thừa',
  le_chua: 'Lễ Chùa',
  mung_1_tet: 'Mùng 1 Tết',
  vu_lan: 'Vu Lan',
  custom: 'Tùy chỉnh',
};

export const PRAYER_CATEGORY_ICONS: Record<string, string> = {
  ram_mung1: '🌕',
  gio: '🕯️',
  tat_nien: '🎆',
  giao_thua: '✨',
  le_chua: '🏛️',
  mung_1_tet: '🧧',
  vu_lan: '🪷',
  custom: '📝',
};

export const DEFAULT_PRAYERS: PrayerRow[] = [
  {
    id: 'ram-gia-tien',
    title: 'Văn khấn Rằm hàng tháng',
    category: 'ram_mung1',
    is_custom: 0,
    description: 'Bài khấn ngày Rằm (15 Âm lịch) tại gia tiên',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng Thiên, Hậu Thổ, chư vị Tôn Thần.
Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn Thần.
Con kính lạy Tổ tiên, Hiển khảo, Hiển tỷ, chư vị Hương linh.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, nhân ngày Rằm, tín chủ con thành tâm sắm lễ, hương hoa trà quả, thắp nén tâm hương, kính dâng lên trước án.

Chúng con kính mời ngài Bản cảnh Thành hoàng, Chư vị Đại Vương, ngài Bản xứ Thần linh Thổ địa, ngài Bản gia Táo quân, Ngũ phương, Long Mạch, Tài Thần, chư vị Tôn Thần.

Chúng con kính mời các cụ Tổ khảo, Tổ tỷ, nội ngoại hai bên chư vị Hương linh, cúi xin thương xót con cháu, giáng lâm trước án, chứng giám lòng thành, thụ hưởng lễ vật.

Phù hộ độ trì cho chúng con toàn gia an lạc, mọi việc hanh thông, sức khoẻ dồi dào, làm ăn phát đạt.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'mung1-gia-tien',
    title: 'Văn khấn Mùng 1 hàng tháng',
    category: 'ram_mung1',
    is_custom: 0,
    description: 'Bài khấn ngày Mùng 1 (Sóc) tại gia tiên',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng Thiên, Hậu Thổ, chư vị Tôn Thần.
Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn Thần.
Con kính lạy Tổ tiên, Hiển khảo, Hiển tỷ, chư vị Hương linh.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, nhân ngày Sóc (mùng Một), tín chủ con thành tâm sắm lễ, hương hoa trà quả, thắp nén tâm hương, kính dâng lên trước án.

Chúng con kính mời các cụ Tổ khảo, Tổ tỷ, nội ngoại hai bên chư vị Hương linh. Cúi xin thương xót con cháu, giáng lâm trước án, chứng giám lòng thành, thụ hưởng lễ vật.

Phù hộ độ trì cho toàn gia chúng con an lạc, mọi sự bình an, sức khoẻ dồi dào, công việc hanh thông.

Chúng con lễ bạc tâm thành, cúi xin được phù hộ độ trì.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'gio-gia-tien',
    title: 'Văn khấn Cúng Giỗ',
    category: 'gio',
    is_custom: 0,
    description: 'Bài khấn lễ Giỗ tưởng nhớ người đã khuất',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng Thiên, Hậu Thổ, chư vị Tôn Thần.
Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn Thần.
Con kính lạy Tổ tiên nội ngoại họ...

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, nhân ngày Giỗ của {{TÊN_NGƯỜI_QUÁ_CỐ}}.

Chúng con cùng toàn thể gia quyến thành tâm sắm sửa lễ vật, hương hoa trà quả, thắp nén tâm hương, kính dâng lên trước án.

Chúng con kính mời {{TÊN_NGƯỜI_QUÁ_CỐ}} linh thiêng giáng về linh sàng, chứng giám lòng thành của con cháu, thụ hưởng lễ vật.

Chúng con cũng kính mời các vị Tổ tiên nội ngoại, chư vị Hương linh đồng lai lâm hâm hưởng.

Cúi xin phù hộ độ trì cho con cháu mạnh khoẻ, bình an, gia đạo hưng long, vạn sự tốt lành.

Chúng con lễ bạc tâm thành, cúi xin được phù hộ độ trì.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'gio-tien-thuong',
    title: 'Văn khấn Lễ Tiên Thường (trước ngày Giỗ)',
    category: 'gio',
    is_custom: 0,
    description: 'Bài khấn lễ cáo trước 1 ngày diễn ra lễ Giỗ chính',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy ngài Bản cảnh Thành hoàng, Bản xứ Thổ địa, Bản gia Táo quân.
Con kính lạy chư vị Tổ tiên nội ngoại.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, là ngày Tiên Thường trước ngày Giỗ chính của {{TÊN_NGƯỜI_QUÁ_CỐ}}.

Chúng con thành tâm sắm lễ, cáo yết Tổ tiên, kính mời chư vị Hương linh đồng lai lâm chứng giám.

Ngày mai là ngày lễ Chính Kỵ, chúng con xin kính cáo trước, mong chư vị phù hộ cho buổi lễ được trang nghiêm, viên mãn.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'tat-nien',
    title: 'Văn khấn Tất Niên (30 Tết)',
    category: 'tat_nien',
    is_custom: 0,
    description: 'Bài khấn lễ cúng Tất niên cuối năm',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng Thiên, Hậu Thổ, chư vị Tôn Thần.
Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn Thần.
Con kính lạy các cụ Tổ khảo, Tổ tỷ, chư vị Hương linh.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, nhân lễ Tất Niên năm cũ sắp qua, năm mới sắp đến.

Chúng con thành tâm sắm sửa lễ vật, hương hoa trà quả, mâm cao cỗ đầy, kính dâng lên trước án. Kính cáo các ngài Tôn Thần, kính mời các cụ Tổ tiên về hưởng lễ Tất Niên, chung vui cùng con cháu.

Cầu xin năm mới Bình An, Sức Khoẻ, Phát Tài, Phát Lộc.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'giao-thua',
    title: 'Văn khấn Giao Thừa (ngoài trời)',
    category: 'giao_thua',
    is_custom: 0,
    description: 'Bài khấn lễ Giao thừa ngoài trời đón năm mới',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Kính lạy:
- Đức Đương Niên Hành Khiển Thái Tuế chí đức Tôn Thần.
- Đức Bản cảnh Thành hoàng Chư vị Đại Vương.
- Ngài Bản xứ Thần linh Thổ địa.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Nay là phút Giao Thừa năm cũ, đón mừng năm mới, {{NGÀY_ÂM_LỊCH}}.

Chúng con thành tâm sửa biện hương hoa, lễ vật. Kính cẩn dâng lên trước án, cúi đầu bái thỉnh.

Kính mời Đức Đương Niên Hành Khiển Thái Tuế chí đức Tôn Thần giáng lâm trước án chứng giám lòng thành, thụ hưởng lễ vật.

Cúi xin Tôn Thần ban phước lành, độ cho chúng con toàn gia an lạc, công việc hanh thông.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'mung1-tet',
    title: 'Văn khấn Mùng 1 Tết',
    category: 'mung_1_tet',
    is_custom: 0,
    description: 'Bài khấn sáng Mùng 1 Tết Nguyên Đán',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng Thiên, Hậu Thổ, chư vị Tôn Thần.
Con kính lạy ngài Bản cảnh Thành hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn Thần.
Con kính lạy các cụ Tổ khảo, Tổ tỷ, chư vị Hương linh.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, Tết Nguyên Đán, đầu xuân năm mới.

Chúng con thành tâm sắm sửa hương hoa, lễ vật, kính dâng, mời các cụ Gia tiên nội ngoại, chư vị Hương linh về hưởng lễ ngày Tết, chung vui cùng con cháu ngày đầu xuân.

Kính cầu Tổ tiên phù hộ cho con cháu năm mới an khang thịnh vượng, vạn sự như ý, sức khoẻ dồi dào.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'vu-lan',
    title: 'Văn khấn Lễ Vu Lan (Rằm tháng 7)',
    category: 'vu_lan',
    is_custom: 0,
    description: 'Bài khấn Rằm tháng Bảy — lễ Vu Lan báo hiếu',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Đức Địa Tạng Vương Bồ Tát.
Con kính lạy chư vị Tôn Thần.
Con kính lạy Tổ tiên nội ngoại chư vị Hương linh.

Tín chủ (chúng) con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, nhân tiết Vu Lan, ngày Rằm tháng Bảy.

Chúng con thành tâm sắm sửa lễ vật, hương hoa, oản quả, kính dâng trước án. Kính mời Tổ tiên nội ngoại, chư vị Hương linh giáng về linh sàng thụ hưởng lễ vật.

Chúng con cũng nguyện cầu cho các vong linh cô hồn không nơi nương tựa, không người thờ cúng, được siêu thoát.

Cúi xin phù hộ con cháu bình an, gia đạo hưng long.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    id: 'le-chua-ram',
    title: 'Văn khấn khi đi Lễ Chùa',
    category: 'le_chua',
    is_custom: 0,
    description: 'Bài khấn khi đến chùa lễ Phật dịp Rằm, lễ lớn',
    content_template: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Đức Phật Thích Ca Mâu Ni.
Con kính lạy Đức Phật A Di Đà.
Con kính lạy Đức Quán Thế Âm Bồ Tát.
Con kính lạy Đức Đại Thế Chí Bồ Tát.
Con kính lạy Đức Địa Tạng Vương Bồ Tát.
Con kính lạy Thập Phương Chư vị Bồ Tát.

Đệ tử con là: {{TÊN_GIA_CHỦ}}
Ngụ tại: {{ĐỊA_CHỈ}}

Hôm nay là ngày {{NGÀY_ÂM_LỊCH}}, đệ tử con đến trước Phật đài, thành tâm kính lễ, cầu nguyện.

Đệ tử con nguyện: Phật từ bi phù hộ cho con và gia đình được bình an, sức khoẻ, trí tuệ sáng suốt. Cầu cho thế giới hoà bình, chúng sinh an lạc.

Nam mô A Di Đà Phật! (3 lần)
Nam mô Đại Bi Quán Thế Âm Bồ Tát! (3 lần)`,
  },
];

/**
 * Substitute placeholders in a prayer template with actual values.
 */
export function fillPrayerTemplate(
  template: string,
  data: {
    homeownerName?: string;
    address?: string;
    lunarDateString?: string;
    ancestorName?: string;
  }
): string {
  const fallback = '............';
  let result = template;
  result = result.replace(/\{\{TÊN_GIA_CHỦ\}\}/g, data.homeownerName?.trim() || fallback);
  result = result.replace(/\{\{ĐỊA_CHỈ\}\}/g, data.address?.trim() || fallback);
  result = result.replace(/\{\{NGÀY_ÂM_LỊCH\}\}/g, data.lunarDateString?.trim() || fallback);
  result = result.replace(/\{\{TÊN_NGƯỜI_QUÁ_CỐ\}\}/g, data.ancestorName?.trim() || fallback);
  return result;
}

