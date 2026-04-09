import { useMemo, useState } from "react";
import { Upload, X, FileText, Microscope, RotateCcw } from "lucide-react";

export default function ReDiagnoseUploadModal({
  isOpen,
  onClose,
  onSubmit,
  patientId,
}) {
  const [bloodSmearImages, setBloodSmearImages] = useState([]);
  const [cbcReport, setCbcReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => bloodSmearImages.length > 0 && Boolean(cbcReport) && !submitting,
    [bloodSmearImages.length, cbcReport, submitting]
  );

  if (!isOpen) return null;

  const resetState = () => {
    setBloodSmearImages([]);
    setCbcReport(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBloodSmearChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextFiles = files.slice(0, 10).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setBloodSmearImages(nextFiles);
  };

  const handleCbcReportChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCbcReport({
      file,
      name: file.name,
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      bloodSmearImages.forEach((image, index) => {
        formData.append(`bloodSmearImage${index}`, image.file);
      });
      formData.append("cbcReport", cbcReport.file);
      await onSubmit(formData);
      resetState();
    } finally {
      setSubmitting(false);
    }
  };

  const removeBloodSmearImage = (index) => {
    setBloodSmearImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-[1100]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-1 bg-none border-none cursor-pointer text-gray-400 hover:text-gray-700 transition-colors duration-200 rounded hover:scale-110"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#0a0e3f]" />
            <span>Re-Diagnose Patient</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Patient ID: {patientId} - upload a new CBC report and blood smear images.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Microscope className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Blood Smear Images</h3>
            </div>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#0a0e3f] transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> new smear images
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 10 images</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBloodSmearChange}
              />
            </label>

            {bloodSmearImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {bloodSmearImages.map((image, index) => (
                  <div
                    key={`${image.name}-${index}`}
                    className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                  >
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700 truncate">{image.name}</p>
                      <button
                        type="button"
                        onClick={() => removeBloodSmearImage(index)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">CBC Report</h3>
            </div>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#0a0e3f] transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> a new CBC report
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, JPEG</p>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleCbcReportChange}
              />
            </label>

            {cbcReport && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-700 truncate">{cbcReport.name}</p>
                <button
                  type="button"
                  onClick={() => setCbcReport(null)}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-6 py-2 bg-[#0a0e3f] text-white rounded-lg font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
