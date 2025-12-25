import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";
import LoginBgImg from "/assets/registerleftimage.png";
import Loading from "../components/Loading";
import { authAPI } from "../services/api";
import HemNewLogo from "/assets/loginhemoranew2.svg";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [SignupData, setSignupData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    role: "RESEARCHER",
  });
  const [passwordMatch, setPasswordMatch] = useState(false);

  const handleLoginChange = (l) => {
    const { name, value } = l.target;
    setSignupData((SignupData) => {
      const updatedData = { ...SignupData, [name]: value };

      if (name === "password_confirm" || name === "password") {
        setPasswordMatch(updatedData.password === updatedData.password_confirm);
      }

      return updatedData;
    });
  };

  const SubmitRegistation = async (e) => {
    e.preventDefault();

    setLoading(true);

    if (!passwordMatch) {
      setLoading(false);
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await authAPI.register(SignupData);

      toast.success("Your account created successfully!");
      setLoading(false);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setLoading(false);
      if (error.response?.data && typeof error.response.data === "object") {
        const errors = error.response.data;
        const errorValues = Object.values(errors);
        if (errorValues.length > 0) {
          const firstError = errorValues[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          toast.error("Registration Failed. Please try again.");
        }
      } else {
        toast.error("Registration Failed. Please try again.");
      }
      console.error(error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0e3f] flex justify-center items-center">
      <Toaster />

      <div className="bg-white w-full min-h-screen flex overflow-hidden">
        {/* LEFT IMAGE */}
        <div className="w-1/2">
          <img
            src={LoginBgImg}
            alt="lab"
            className="h-screen w-full object-cover"
          />
        </div>

        {/* RIGHT FORM */}
        <div className="w-1/2 flex flex-col justify-center px-40 overflow-y-auto">
          <div className="text-center mb-6">
            <div className="mx-auto w-fit mb-6">
              <img
                src={HemNewLogo}
                alt="Logo"
                width={200}
                height={200}
                className=""
              />
            </div>
            <h2 className="text-3xl font-bold text-[#0a0e3f] mb-3">
              Welcome to Hemo Diagnosis
            </h2>
          </div>

          <form onSubmit={SubmitRegistation}>
            {/* USERNAME */}
            <div className="mb-5">
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Username"
                onChange={handleLoginChange}
                required
                className="w-full h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />
            </div>

            {/* EMAIL */}
            <div className="mb-5">
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                onChange={handleLoginChange}
                required
                className="w-full h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />
            </div>

            {/* FIRST NAME & LAST NAME */}
            <div className="mb-5 flex gap-3">
              <input
                type="text"
                name="first_name"
                id="first_name"
                placeholder="First Name"
                onChange={handleLoginChange}
                className="w-1/2 h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />
              <input
                type="text"
                name="last_name"
                id="last_name"
                placeholder="Last Name"
                onChange={handleLoginChange}
                className="w-1/2 h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-5 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Password"
                onChange={handleLoginChange}
                required
                className="w-full h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />
              {/* <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-3 text-gray-600 cursor-pointer"
              >
                {showPassword ? (
                  <VscEyeClosed size={22} />
                ) : (
                  <VscEye size={22} />
                )}
              </button> */}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="mb-5 relative">
              <input
                type="password"
                name="password_confirm"
                id="password_confirm"
                placeholder="Confirm Password"
                onChange={handleLoginChange}
                required
                className={`w-full h-12 px-5 border rounded-4xl outline-none focus:ring-1 ${
                  passwordMatch
                    ? "border-green-500 focus:ring-green-500"
                    : "border-gray-300 focus:ring-[#0a0e3f]"
                }`}
              />
              {passwordMatch && (
                <p className="text-green-500 text-sm mt-1">Passwords match!</p>
              )}
            </div>

            {/* SIGN UP BUTTON */}
            <button className="w-full h-12 bg-[#0a0e3f] text-white rounded-4xl text-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center">
              {loading ? <Loading /> : "Sign Up"}
            </button>

            {/* LOGIN LINK */}
            <p className="text-center text-gray-700 mt-6">
              Already have an account?
              <a href="/login" className="text-[#0a0e3f] font-semibold ml-1">
                Log In
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}