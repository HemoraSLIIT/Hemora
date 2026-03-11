import { useEffect, useState } from "react";
import {
  X,
  User,
  Droplet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  UserRoundCheck,
  Pencil,
  CalendarFold,
  BookCheck,
  Mars,
  FileText,
  Microscope,
  ExternalLink,
} from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const fallbackApiBaseUrl = `http://${window.location.hostname || "localhost"}:8000/api`;
const apiBaseUrl = /^https?:\/\//i.test(configuredApiBaseUrl)
  ? configuredApiBaseUrl.replace(/\/+$/, "")
  : fallbackApiBaseUrl;
const MEDIA_BASE = apiBaseUrl.replace(/\/api$/, "");

function resolveMediaUrl(fileUrl) {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  try {
    return new URL(fileUrl, `${MEDIA_BASE}/`).toString();
  } catch {
    return null;
  }
}

function isPdfFile(fileUrl) {
  if (!fileUrl) return false;

  try {
    return new URL(fileUrl).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return fileUrl.toLowerCase().endsWith(".pdf");
  }
}

export default function ViewPatient({ isOpen, onClose, patient }) {
  const [activeTab, setActiveTab] = useState("details");
  const [lightboxImg, setLightboxImg] = useState(null);
  const [cbcPreviewImage, setCbcPreviewImage] = useState(null);
  const [cbcPreviewLoading, setCbcPreviewLoading] = useState(false);
  const [cbcPreviewError, setCbcPreviewError] = useState(false);
  const bloodSmearImages = patient?.bloodSmearImages || [];
  const cbcReportUrl = resolveMediaUrl(patient?.cbcReport);
  const isPdf = isPdfFile(cbcReportUrl);

  const getStatusColor = (status) => {
    switch (status) {
      case "Diagnosed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "details", label: "Patient Details", icon: UserRoundCheck },
    { id: "cbc", label: "CBC Report", icon: FileText },
    { id: "smear", label: "Blood Smear", icon: Microscope },
  ];

  useEffect(() => {
    let cancelled = false;

    if (!isOpen || !isPdf || !cbcReportUrl) {
      setCbcPreviewImage(null);
      setCbcPreviewLoading(false);
      setCbcPreviewError(false);
      return undefined;
    }

    const renderPdfSnapshot = async () => {
      try {
        setCbcPreviewLoading(true);
        setCbcPreviewError(false);
        setCbcPreviewImage(null);

        const response = await fetch(cbcReportUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const pdfData = await response.arrayBuffer();
        const pdf = await getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas context unavailable");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        if (cancelled) {
          return;
        }

        setCbcPreviewImage(canvas.toDataURL("image/png"));
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to render CBC PDF preview:", error);
          setCbcPreviewError(true);
        }
      } finally {
        if (!cancelled) {
          setCbcPreviewLoading(false);
        }
      }
    };

    renderPdfSnapshot();

    return () => {
      cancelled = true;
    };
  }, [cbcReportUrl, isOpen, isPdf]);

  if (!isOpen || !patient) return null;

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 mb-2">
            <UserRoundCheck className="text-gray-900 w-6 h-6" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Patient Details
            </h2>
          </div>
          <button
            className="absolute top-4 right-4 p-1 bg-none border-none cursor-pointer text-gray-400 hover:text-gray-700 transition-colors duration-200 rounded hover:scale-110"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#0a0e3f] text-[#0a0e3f]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#0a0e3f] rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white font-bold">
                    {(patient.name?.[0] || "P").toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {patient.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}
                  >
                    {patient.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Patient ID: <strong>{patient.id}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Date Added: <strong>{patient.dateAdded}</strong></span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard icon={Pencil} label="First Name" value={patient.firstName} />
                <InfoCard icon={Pencil} label="Last Name" value={patient.lastName} />
                <InfoCard icon={BookCheck} label="Age" value={patient.age ? `${patient.age} years` : null} />
                <InfoCard icon={Mars} label="Gender" value={patient.gender} />
                <InfoCard icon={CalendarFold} label="Date of Birth" value={patient.dateOfBirth} />
                <InfoCard icon={Droplet} label="Blood Group" value={patient.bloodGroup} />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard icon={Phone} label="Phone Number" value={patient.phone} />
                <InfoCard icon={Mail} label="Email" value={patient.email} />
                <div className="col-span-2">
                  <InfoCard icon={MapPin} label="Address" value={patient.address} />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard icon={AlertCircle} label="Emergency Contact Name" value={patient.emergencyContact} />
                <InfoCard icon={Phone} label="Emergency Phone" value={patient.emergencyPhone} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "cbc" && (
          <div>
            {cbcReportUrl ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">CBC Report</h4>
                  <a
                    href={cbcReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[#0a0e3f] hover:underline font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </a>
                </div>
                {isPdf ? (
                  <div className="w-full min-h-[60vh] rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center justify-center">
                    {cbcPreviewLoading ? (
                      <p className="text-sm text-gray-500">Loading PDF snapshot...</p>
                    ) : cbcPreviewImage ? (
                      <img
                        src={cbcPreviewImage}
                        alt="CBC Report preview"
                        className="w-full max-h-[60vh] object-contain rounded-lg cursor-pointer"
                        onClick={() => setLightboxImg(cbcPreviewImage)}
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {cbcPreviewError
                            ? "Could not generate a PDF snapshot for this report."
                            : "No PDF preview available."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={cbcReportUrl}
                    alt="CBC Report"
                    className="w-full max-h-[60vh] object-contain rounded-lg border border-gray-200 cursor-pointer"
                    onClick={() => setLightboxImg(cbcReportUrl)}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No CBC report uploaded for this patient.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "smear" && (
          <div>
            {bloodSmearImages.length > 0 ? (
              <>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Blood Smear Images ({bloodSmearImages.length})
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {bloodSmearImages.map((img) => {
                    const imgUrl = resolveMediaUrl(img.image);
                    return (
                      <div
                        key={img.id}
                        className="cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition"
                        onClick={() => setLightboxImg(imgUrl)}
                      >
                        <img
                          src={imgUrl}
                          alt={`Blood smear ${img.id}`}
                          className="w-full h-40 object-cover"
                        />
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500">
                          {img.uploadedAt
                            ? new Date(img.uploadedAt).toLocaleDateString()
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Microscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No blood smear images uploaded for this patient.</p>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition duration-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1100]"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 cursor-pointer"
            onClick={() => setLightboxImg(null)}
          >
            <X size={32} />
          </button>
          <img
            src={lightboxImg}
            alt="Blood smear enlarged"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-sm font-medium text-gray-900 mt-1">
        {value || "N/A"}
      </p>
    </div>
  );
}
