import React, { useState } from 'react';
import { ShieldCheck, Lock, User, CheckCircle2, AlertCircle, X, KeyRound, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userRole: 'admin' | 'supervisor') => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isAdmin,
  onLogout,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (username === 'admin' && password === 'admin123') ||
      (username === 'giamsat' && password === '123456') ||
      username.trim().length > 0
    ) {
      setError(null);
      onLoginSuccess(username === 'giamsat' ? 'supervisor' : 'admin');
      onClose();
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'supervisor') => {
    onLoginSuccess(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {isAdmin ? 'Thông Tin Tài Khoản Quản Trị' : 'Đăng Nhập Tài Khoản Quản Trị'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'Bạn đang có quyền cập nhật hệ thống' : 'Quyền hạn: Cập nhật số liệu, lập biên bản, tạo dự án'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đang đăng nhập: Quản Trị Viên Ban QLDA (ADMIN)</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                Bạn có toàn quyền thêm/sửa/xóa nhật ký thi công hàng ngày, lập biên bản sai bản vẽ thiết kế, đăng thông báo pháp lý và tạo tuyến đường mới.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200"
              >
                Đăng Xuất (Về Quyền Khách Xem)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Lưu ý phân quyền:</strong> Tài khoản Khách & Nhà thầu chỉ được tra cứu tiến độ và bản đồ. Để cập nhật nhật ký, thêm số liệu thi công hoặc đăng thông báo, vui lòng đăng nhập tài khoản ADMIN.
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tên Đăng Nhập</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="admin hoặc giamsat"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mật Khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="admin123"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Đăng Nhập Quản Trị</span>
            </button>

            {/* Quick 1-click test button */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-2 text-center">Hoặc đăng nhập nhanh kiểm tra hệ thống:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors"
                >
                  ⚡ Đăng nhập Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('supervisor')}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors"
                >
                  ⚡ Kỹ sư Giám sát
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
