export default function DeleteConfirm({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg min-w-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-gray-50">
          <h2 className="m-0 text-xl font-semibold text-gray-900">
            {title || "Confirm Delete"}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="m-0 text-gray-600 text-base">
            {message || "Are you sure you want to delete this item?"}
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:opacity-90 transition-colors font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:opacity-90 transition-colors font-semibold cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
