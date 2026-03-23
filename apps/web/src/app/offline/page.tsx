export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          网络连接断开
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          无法连接到服务器，请检查网络连接后重试。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}
