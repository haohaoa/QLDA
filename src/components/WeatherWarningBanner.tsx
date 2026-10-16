import React, { useState } from 'react';
import { CloudRain, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, FileClock } from 'lucide-react';

interface WeatherWarningBannerProps {
  currentReportDate: string;
  floodSeasonBanStart?: string;
  permitNumber?: string;
}

export const WeatherWarningBanner: React.FC<WeatherWarningBannerProps> = ({
  currentReportDate,
  floodSeasonBanStart = '2026-10-15',
  permitNumber = 'GP-SGTVT/2026/0894-ĐĐ',
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default to keep UI clean!

  const today = new Date(currentReportDate);
  const banStart = new Date(floodSeasonBanStart);

  const diffTimeBan = banStart.getTime() - today.getTime();
  const daysUntilBan = Math.ceil(diffTimeBan / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-b border-amber-200 text-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-white shrink-0 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-amber-600" />
                CẢNH BÁO MÙA MƯA BÃO:
              </span>
              <span className="text-slate-700">
                Lệnh cấm đào mở đường từ <strong className="text-red-700">{floodSeasonBanStart}</strong>{' '}
                {daysUntilBan > 0 ? (
                  <span className="font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    (Còn {daysUntilBan} ngày thi công phui)
                  </span>
                ) : (
                  <span className="font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                    (ĐANG TRONG ĐỢT CẤM ĐÀO ĐƯỜNG MÙA LŨ)
                  </span>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors text-[11px] flex items-center gap-1 font-medium"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem quy định'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-600">
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Chỉ đạo PCTT & Sở GTVT
              </div>
              <p>
                Khẩn trương hoàn trả thảm nhựa tạm các mương đào, không mở phui mới, đậy nắp hầm ga bằng tấm thép gân chịu lực.
              </p>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <FileClock className="w-3.5 h-3.5 text-blue-600" />
                Giấy phép {permitNumber}
              </div>
              <p>
                Rút toàn bộ máy khoan ngầm HDD lên vị trí gò cao trước 18h hàng ngày để đảm bảo an toàn thiết bị.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
