import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";
import LoginBgImg from "/assets/loginleftimage3.png";
import Loading from "../components/Loading";
import { authAPI } from "../services/api";
import HemNewLogo from "/assets/loginhemoranew2.svg";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [logindata, setlogindata] = useState({
    username: "",
    password: "",
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setlogindata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const SubmitLogin = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await authAPI.login(logindata.username, logindata.password);

      toast.success("Login Successful!");
      setLoading(false);

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      setLoading(false);
      if (error.response?.data) {
        toast.error(error.response.data.detail || "Invalid credentials!");
      } else {
        toast.error("Login Failed. Check your connection!");
      }
    }
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
        <div className="w-1/2 flex flex-col justify-center px-40">
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

          <form onSubmit={SubmitLogin}>
            {/* USERNAME */}
            <div className="mb-5 text-center">
              <input
                type="text"
                name="username"
                placeholder="Username"
                onChange={handleLoginChange}
                className="w-full h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-5 relative text-center">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleLoginChange}
                className="w-full h-12 px-5 border rounded-4xl outline-none focus:ring-1 focus:ring-[#0a0e3f]"
              />

              {/* <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-gray-600 cursor-pointer"
              >
                {showPassword ? (
                  <VscEyeClosed size={22} />
                ) : (
                  <VscEye size={22} />
                )}
              </button> */}
            </div>

            {/* LOGIN BUTTON */}
            <button className="w-full h-12 bg-[#0a0e3f] text-white rounded-4xl text-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center">
              {loading ? <Loading /> : "Login"}
            </button>

            {/* FORGOT PASSWORD */}
            <p className="text-right text-sm mt-3 text-[#0a0e3f] cursor-pointer mb-25">
              Forgot password ?
            </p>

            {/* SIGN UP LINK */}
            <p className="text-center text-gray-700">
              New user?
              <a href="/" className="text-[#0a0e3f] font-semibold ml-1">
                create a account
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
