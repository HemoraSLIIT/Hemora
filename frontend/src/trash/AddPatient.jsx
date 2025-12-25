import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  X,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Image,
  Activity,
  ChevronRight,
  ChevronLeft,
  Home,
  Bell,
  Users,
  Settings,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import HemNewLogo from "/assets/hemnewlogo3.svg";

export default function AddPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);

  const [patientData, setPatientData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    currentMedications: "",
    symptoms: "",
    referringDoctor: "",
    suspectedDisease: "",
  });

  const [bloodSmearImages, setBloodSmearImages] = useState([]);
  const [cbcReport, setCbcReport] = useState(null);
  const [cbcData, setCbcData] = useState({
    wbc: "",
    rbc: "",
    hemoglobin: "",
    hematocrit: "",
    mcv: "",
    mch: "",
    mchc: "",
    platelets: "",
    neutrophils: "",
    lymphocytes: "",
    monocytes: "",
    eosinophils: "",
    basophils: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "dateOfBirth" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      setPatientData((prev) => ({
        ...prev,
        age: age.toString(),
      }));
    }
  };

  const handleCbcDataChange = (e) => {
    const { name, value } = e.target;
    setCbcData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStage1 = () => {
    if (
      !patientData.firstName ||
      !patientData.lastName ||
      !patientData.dateOfBirth ||
      !patientData.gender
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const validateStage2 = () => {
    if (bloodSmearImages.length === 0) {
      toast.error("Please upload at least one blood smear image");
      return false;
    }
    return true;
  };

  const validateStage3 = () => {
    if (!cbcReport) {
      toast.error("Please upload a CBC Report");
      return false;
    }
    return true;
  };

  const handleNextStage = () => {
    if (currentStage === 1 && validateStage1()) {
      setCurrentStage(2);
    } else if (currentStage === 2 && validateStage2()) {
      setCurrentStage(3);
    }
  };

  const handlePreviousStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleBloodSmearUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      if (!isImage) {
        toast.error(`${file.name} is not an image file`);
      }
      if (!isUnder5MB) {
        toast.error(`${file.name} is larger than 5MB`);
      }
      return isImage && isUnder5MB;
    });

    if (bloodSmearImages.length + validFiles.length > 10) {
      toast.error("Maximum 10 blood smear images allowed");
      return;
    }

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setBloodSmearImages((prev) => [...prev, ...newImages]);
  };

  const handleCbcReportUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    const isUnder10MB = file.size <= 10 * 1024 * 1024;

    if (!isPdf && !isImage) {
      toast.error("CBC Report must be a PDF or image file");
      return;
    }

    if (!isUnder10MB) {
      toast.error("File size must be under 10MB");
      return;
    }

    setCbcReport({
      file,
      name: file.name,
      preview: isImage ? URL.createObjectURL(file) : null,
    });
  };

  const removeBloodSmearImage = (index) => {
    setBloodSmearImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeCbcReport = () => {
    setCbcReport(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStage !== 3 || !validateStage3()) {
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();

      Object.keys(patientData).forEach((key) => {
        formData.append(key, patientData[key]);
      });

      Object.keys(cbcData).forEach((key) => {
        if (cbcData[key]) {
          formData.append(`cbc_${key}`, cbcData[key]);
        }
      });

      bloodSmearImages.forEach((image, index) => {
        formData.append(`bloodSmearImage${index}`, image.file);
      });

      if (cbcReport) {
        formData.append("cbcReport", cbcReport.file);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Patient added successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error adding patient:", error);
      toast.error("Failed to add patient. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className="w-22 bg-[#0a0e3f] flex flex-col items-center py-6 space-y-0 rounded-tr-4xl rounded-br-4xl">
        <div className="">
          {/* <div className="bg-white text-blue-900 px-2 py-1 rounded">HEMO</div> */}
          {/* <div> */}
          <img
            src={HemNewLogo}
            alt="Logo"
            width={60}
            height={60}
            className=""
          />
          {/* </div> */}
        </div>
        <div className="flex flex-col items-center justify-center flex-1 space-y-8">
          <Home
            className="text-white w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/dashboard")}
          />
          <Bell className="text-white w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
          <Users
            className="text-white w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/patients")}
          />
          <Calendar className="text-white w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
          <Settings className="text-white w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* <button 
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button> */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Add New Patient
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStage} of 3 - Enter patient information
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-4">
                            <div className="relative">
                                <img
                                    src="https://ui-avatars.com/api/?name=User&background=0a0e3f&color=fff"
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full cursor-pointer"
                                />
                            </div>
                        </div> */}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6 mx-12">
              {[1, 2, 3].map((step, index) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                        step <= currentStage
                          ? "bg-[#0a0e3f] text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-colors rounded ${
                        step < currentStage ? "bg-[#0a0e3f]" : "bg-gray-300"
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-60 text-sm font-medium text-center">
              <span
                className={`${
                  currentStage === 1
                    ? "font-bold text-[#0a0e3f]"
                    : "text-gray-600"
                }`}
              >
                Personal Info
              </span>
              <span
                className={`${
                  currentStage === 2
                    ? "font-bold text-[#0a0e3f]"
                    : "text-gray-600"
                }`}
              >
                Blood Smear Images
              </span>
              <span
                className={`${
                  currentStage === 3
                    ? "font-bold text-[#0a0e3f]"
                    : "text-gray-600"
                }`}
              >
                CBC Report
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-5xl mx-auto px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stage 1: Personal Information */}
            {currentStage === 1 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <User className="w-5 h-5 text-[#0a0e3f]" />
                  <h2 className="text-xl font-bold text-gray-800">
                    Personal Information
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={patientData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={patientData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={patientData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={patientData.age}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Auto-calculated"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={patientData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={patientData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={patientData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="+ 94 71 756 2052"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={patientData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="patient@example.com"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={patientData.address}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={patientData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="Enter emergency contact"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={patientData.emergencyPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                      placeholder="+ 94 71 756 2052"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stage 2: Blood Smear Images */}
            {currentStage === 2 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <Image className="w-5 h-5 text-[#0a0e3f]" />
                  <h2 className="text-xl font-bold text-gray-800">
                    Peripheral Blood Smear Images{" "}
                    <span className="text-red-500">*</span>
                  </h2>
                </div>

                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0a0e3f] hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, JPEG (MAX. 5MB per image, up to 10 images)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleBloodSmearUpload}
                    />
                  </label>
                </div>

                {bloodSmearImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-4">
                    {bloodSmearImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview}
                          alt={`Blood smear ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeBloodSmearImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Total images: {bloodSmearImages.length}/10
                </p>
              </div>
            )}

            {/* Stage 3: CBC Report & Data */}
            {currentStage === 3 && (
              <>
                {/* CBC Data Entry */}
                {/* <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                                    <div className="flex items-center space-x-2 mb-6">
                                        <FileText className="w-5 h-5 text-[#0a0e3f]" />
                                        <h2 className="text-xl font-bold text-gray-800">Complete Blood Count (CBC) Data</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">WBC (×10³/μL)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="wbc"
                                                value={cbcData.wbc}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="4.5 - 11.0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">RBC (×10⁶/μL)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="rbc"
                                                value={cbcData.rbc}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="4.5 - 5.5"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Hemoglobin (g/dL)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="hemoglobin"
                                                value={cbcData.hemoglobin}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="13.5 - 17.5"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Hematocrit (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="hematocrit"
                                                value={cbcData.hematocrit}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="38.8 - 50.0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">MCV (fL)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="mcv"
                                                value={cbcData.mcv}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="80 - 100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">MCH (pg)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="mch"
                                                value={cbcData.mch}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="27 - 33"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">MCHC (g/dL)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="mchc"
                                                value={cbcData.mchc}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="32 - 36"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Platelets (×10³/μL)</label>
                                            <input
                                                type="number"
                                                step="1"
                                                name="platelets"
                                                value={cbcData.platelets}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="150 - 400"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Neutrophils (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="neutrophils"
                                                value={cbcData.neutrophils}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="40 - 70"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Lymphocytes (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="lymphocytes"
                                                value={cbcData.lymphocytes}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="20 - 40"
                                            />
                                        </div>

                                        // ...existing code...
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Monocytes (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="monocytes"
                                                value={cbcData.monocytes}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="2 - 8"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Eosinophils (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="eosinophils"
                                                value={cbcData.eosinophils}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="1 - 4"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Basophils (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="basophils"
                                                value={cbcData.basophils}
                                                onChange={handleCbcDataChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="0 - 1"
                                            />
                                        </div>
                                    </div>
                                </div> */}

                {/* CBC Report Upload */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mt-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Upload className="w-5 h-5 text-[#0a0e3f]" />
                    <h2 className="text-xl font-bold text-gray-800">
                      CBC Report <span className="text-red-500">*</span>
                    </h2>
                  </div>

                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0a0e3f] hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF or image files (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,image/*"
                        onChange={handleCbcReportUpload}
                      />
                    </label>
                  </div>

                  {cbcReport && (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {cbcReport.preview ? (
                          <img
                            src={cbcReport.preview}
                            alt="CBC Report"
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <FileText className="w-12 h-12 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">
                          {cbcReport.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCbcReport}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Medical History Section */}
                {/* <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mt-6">
                                    <div className="flex items-center space-x-2 mb-6">
                                        <Activity className="w-5 h-5 text-[#0a0e3f]" />
                                        <h2 className="text-xl font-bold text-gray-800">Clinical Information</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Medical History</label>
                                            <textarea
                                                name="medicalHistory"
                                                value={patientData.medicalHistory}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="Enter relevant medical history"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Medications</label>
                                            <textarea
                                                name="currentMedications"
                                                value={patientData.currentMedications}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="List current medications"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Symptoms</label>
                                            <textarea
                                                name="symptoms"
                                                value={patientData.symptoms}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="Describe current symptoms"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Referring Doctor</label>
                                            <input
                                                type="text"
                                                name="referringDoctor"
                                                value={patientData.referringDoctor}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="Enter doctor's name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Suspected Disease</label>
                                            <input
                                                type="text"
                                                name="suspectedDisease"
                                                value={patientData.suspectedDisease}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                                                placeholder="Enter suspected diagnosis"
                                            />
                                        </div>
                                    </div>
                                </div> */}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={handlePreviousStage}
                disabled={currentStage === 1}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              {currentStage < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNextStage();
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-green-800 text-white rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Patient</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
