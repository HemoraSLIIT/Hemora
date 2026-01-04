import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import ProfileForm from "../components/ProfileForm";
import SideBar from "../components/SideBar"; // added

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwVerified, setPwVerified] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [blockedAfterAttempts, setBlockedAfterAttempts] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwMismatch, setPwMismatch] = useState(false); // added

  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      if (!userData) throw new Error("Unable to fetch user details");

      if (userData.username) {
        sessionStorage.setItem(
          "userInitial",
          userData.username.charAt(0).toUpperCase()
        );
      }

      setUser(userData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      toast.error("Failed to fetch user data");
      setLoading(false);

      if (err.response?.status === 401) {
        authAPI.logout();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, [navigate]);

  const handleUpdateSuccess = async () => {
    await fetchUserData();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // start change password flow
  const handleStartChangePassword = () => {
    setIsChangingPassword(true);
    setPwVerified(false);
    setBlockedAfterAttempts(false);
    setAttemptsLeft(3);
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwMismatch(false); // added
  };

  const handleCancelChangePassword = () => {
    setIsChangingPassword(false);
    setPwVerified(false);
    setBlockedAfterAttempts(false);
    setAttemptsLeft(3);
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwMismatch(false); // added
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((p) => {
      const next = { ...p, [name]: value };
      // live-clear mismatch hint when they match
      if (name === "newPassword" || name === "confirmPassword") {
        setPwMismatch(
          next.newPassword.length > 0 &&
          next.confirmPassword.length > 0 &&
          next.newPassword !== next.confirmPassword
        );
      }
      return next;
    });
  };

  const verifyCurrentPassword = async (currentPassword) => {
    const pwd = currentPassword?.trim();
    if (!pwd) return false;

    // Try a dedicated verify endpoint if available
    if (typeof userAPI.verifyCurrentPassword === "function") {
      try {
        await userAPI.verifyCurrentPassword({ currentPassword: pwd });
        return true;
      } catch {
        // fall through to login fallback
      }
    }

    // Fallback: use authAPI.login with positional args
    if (typeof authAPI.login === "function") {
      // Prefer username
      if (user?.username) {
        try {
          await authAPI.login(user.username, pwd);
          return true;
        } catch {
          // try email as username next
        }
      }
      // Some backends accept email as the username field
      if (user?.email) {
        try {
          await authAPI.login(user.email, pwd);
          return true;
        } catch {
          return false;
        }
      }
    }

    return false;
  };

  const handleVerify = async () => {
    if (!pwForm.currentPassword.trim()) {
      toast.error("Enter current password", { duration: 3000 });
      return;
    }
    if (blockedAfterAttempts) return;

    setPwLoading(true);
    try {
      const ok = await verifyCurrentPassword(pwForm.currentPassword.trim());
      if (ok) {
        setPwVerified(true);
        toast.success("Current password verified!", { duration: 3000 });
      } else {
        const next = attemptsLeft - 1;
        setAttemptsLeft(next);
        if (next <= 0) {
          setBlockedAfterAttempts(true);
          setPwVerified(false);
          toast.error("Too many failed attempts. Please contact admin.", { duration: 5000 });
        } else {
          toast.error(`Incorrect current password. ${next} attempt(s) remaining.`, { duration: 4000 });
        }
      }
    } catch (err) {
      console.error("Password verification error:", err);
      toast.error("Failed to verify password. Please try again.", { duration: 4000 });
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!pwVerified) {
      toast.error("Verify current password first", { duration: 3000 });
      return;
    }
    const newPwd = pwForm.newPassword.trim();
    const confirmPwd = pwForm.confirmPassword.trim();

    if (!newPwd) {
      toast.error("Enter new password", { duration: 3000 });
      return;
    }
    if (!confirmPwd) {
      toast.error("Confirm your new password", { duration: 3000 });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwMismatch(true);
      toast.error("Passwords do not match", { duration: 3000 });
      return;
    }
    
    // Password strength validation
    if (newPwd.length < 8) {
      toast.error("Password must be at least 8 characters long", { duration: 3000 });
      return;
    }
    
    setPwMismatch(false);

    setPwLoading(true);
    try {
      await authAPI.changePassword(pwForm.currentPassword.trim(), newPwd, confirmPwd);
      // Show success toast first, then close the form after a short delay
      toast.success("Password changed successfully!", { duration: 4000 });
      // Delay closing the form so user can see the success message
      setTimeout(() => {
        handleCancelChangePassword();
      }, 500);
    } catch (err) {
      console.error("Password change error:", err);
      // Handle different error formats
      const errorData = err?.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          toast.error(errorData, { duration: 4000 });
        } else if (errorData.detail) {
          toast.error(errorData.detail, { duration: 4000 });
        } else if (errorData.password) {
          // Django password validation errors come as array
          const pwdErrors = Array.isArray(errorData.password) 
            ? errorData.password.join(', ') 
            : errorData.password;
          toast.error(`Password error: ${pwdErrors}`, { duration: 5000 });
        } else {
          // Other field errors
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msg}`;
            })
            .join('\n');
          toast.error(errorMessages || "Failed to change password", { duration: 4000 });
        }
      } else if (err?.message) {
        toast.error(err.message, { duration: 4000 });
      } else {
        toast.error("Failed to change password. Please try again.", { duration: 4000 });
      }
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a0e3f]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-600">Failed to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      <SideBar />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
                <UserRound className="w-12 h-12 text-[#0a0e3f]" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Profile
                  </h1>
                  <p className="text-gray-600">{user.role}</p>
                </div>
              </div>

              {/* Edit + Change Password row */}
              {!isEditing && (
                <div className="mb-8 flex gap-4 justify-start">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleStartChangePassword}
                    className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm bg-[#0a0e3f] text-white hover:opacity-90 focus:outline-none cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              )}

              {/* Inline Change Password section */}
              {isChangingPassword && !isEditing && (
                <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={pwForm.currentPassword}
                        onChange={handlePwChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Enter current password"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {blockedAfterAttempts ? "Attempts exceeded. Contact admin." : `${attemptsLeft} attempt(s) left`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={pwForm.newPassword}
                        onChange={handlePwChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter new password"
                        disabled={!pwVerified || blockedAfterAttempts}
                        required={pwVerified && !blockedAfterAttempts}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={pwForm.confirmPassword}
                        onChange={handlePwChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Confirm new password"
                        disabled={!pwVerified || blockedAfterAttempts}
                        required={pwVerified && !blockedAfterAttempts}
                        aria-invalid={pwMismatch ? "true" : "false"} // added
                      />
                      {pwMismatch && (
                        <p className="text-xs text-red-600 mt-1">
                          Passwords do not match. Enter the same password in both fields.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={pwLoading || blockedAfterAttempts || pwVerified}
                      className={`px-4 py-2 text-sm font-semibold cursor-pointer rounded-lg ${
                        pwLoading || blockedAfterAttempts || pwVerified
                          ? "bg-blue-300 text-blue-700 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {pwVerified ? "Verified" : pwLoading ? "Verifying..." : "Verify"}
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      disabled={pwLoading || !pwVerified || blockedAfterAttempts}
                      className={`px-4 py-2 text-sm font-semibold cursor-pointer rounded-lg ${
                        pwLoading || !pwVerified || blockedAfterAttempts
                          ? "bg-[#0a0e3f]/60 text-white cursor-not-allowed"
                          : "bg-[#0a0e3f] text-white hover:opacity-90"
                      }`}
                    >
                      {pwLoading ? "Updating..." : "Update Password"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelChangePassword}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ProfileForm */}
              <ProfileForm
                isEditing={isEditing}
                initialData={user}
                onSuccess={handleUpdateSuccess}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
