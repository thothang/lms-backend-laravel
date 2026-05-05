import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * Error Fallback Component for Public Pages
 */
export const PublicPageError = ({ error, resetError, message = 'Đã có lỗi xảy ra. Vui lòng thử lại.' }) => (
  <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Đã xảy ra lỗi
      </h2>
      <p className="text-slate-600 mb-6">
        {message}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </button>
      </div>
    </div>
  </div>
);

/**
 * Error Fallback Component for Admin/Management Pages
 */
export const ManagementPageError = ({ error, resetError, pageName = 'trang này' }) => (
  <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-rose-100">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">
        Lỗi tải {pageName}
      </h2>
      <p className="text-slate-600 mb-4">
        Không thể tải nội dung. Vui lòng kiểm tra kết nối và thử lại.
      </p>
      {error && (
        <div className="bg-slate-100 rounded-lg p-3 mb-6 text-left">
          <p className="text-xs text-slate-500 font-mono break-all">
            {error.message}
          </p>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>
    </div>
  </div>
);

/**
 * Error Fallback Component for Table/Data Pages
 */
export const TableError = ({ error, onRetry, title = 'Không thể tải dữ liệu' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
      <AlertTriangle className="w-6 h-6 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm mb-6">
      Đã xảy ra lỗi khi tải dữ liệu.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold text-sm shadow-lg"
      >
        <RefreshCw className="w-4 h-4" />
        Tải lại
      </button>
    )}
  </div>
);

/**
 * Minimal Error Fallback - Just a message
 */
export const InlineError = ({ message = 'Đã xảy ra lỗi', onRetry }) => (
  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
    <p className="text-rose-600 text-sm font-medium mb-2">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-rose-600 hover:text-rose-700 text-sm font-bold underline"
      >
        Thử lại
      </button>
    )}
  </div>
);

export default {
  PublicPageError,
  ManagementPageError,
  TableError,
  InlineError
};