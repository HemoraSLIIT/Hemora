import React, { useState } from 'react';
import axios from 'axios';
import BgImg from "../images/loginwallpaper.png";
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();

    const [registerData, setRegisterData] = useState({
        // profilePicture: '',
        userName: '',
        password: '',
        email: ''
    });

    const [isValid, setIsValid] = useState({
        length: false,
        number: false,
        symbol: false,
    });

    const validatePassword = (pwd) => {
        const lengthValid = pwd.length >= 8;
        const numberValid = /\d/.test(pwd);
        const symbolValid = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        setIsValid({
            length: lengthValid,
            number: numberValid,
            symbol: symbolValid,
        });

        return lengthValid && numberValid && symbolValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRegisterData(prevState => ({
            ...prevState,
            [name]: value,
        }));

        if (name === 'password') {
            validatePassword(value);
        }
    };

    const registerUser = async (e) => {
        e.preventDefault();
        if (!validatePassword(registerData.password)) {
            alert('Password does not meet the requirements.');
            return;
        }

        try {
            await axios.post("http://localhost:8000/register", registerData);
            alert("Successfully Registered!");
            navigate('/login');
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Please try again.");
        }
    };

    return (
        <div className="bg-cover bg-center min-h-screen flex items-center justify-center" style={{ backgroundImage: `url(${BgImg})` }}>
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-8">
                <form onSubmit={registerUser} className="space-y-6">
                    {/* <div>
                        <input
                            type="text"
                            name="profilePicture"
                            placeholder="Enter profile picture URL"
                            onChange={handleChange}
                            className="block w-full rounded-md h-10 outline-0 ps-3 mb-5 bg-gray-200" />
                    </div> */}
                    <div>
                        <input
                            type="text"
                            name="userName"
                            placeholder="Enter username"
                            onChange={handleChange}
                            className="block w-full rounded-md h-10 outline-0 ps-3 mb-5 bg-gray-200" />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            onChange={handleChange}
                            className="block w-full rounded-md h-10 outline-0 ps-3 mb-5 bg-gray-200" />
                    </div>
                    <center>
                        <div className="w-full mt-6 space-y-3 text-sm text-slate-500">
                            <p className={`flex items-center ${isValid.length ? "text-green-600" : "text-red-600"} transition-colors duration-300`}>
                                <span className={`w-5 h-5 mr-3 ${isValid.length ? "text-green-600" : "text-red-600"}`}>{isValid.length ? "✔️" : "❌"}</span>
                                Minimum 8 characters
                            </p>
                            <p className={`flex items-center ${isValid.number ? "text-green-600" : "text-red-600"} transition-colors duration-300`}>
                                <span className={`w-5 h-5 mr-3 ${isValid.number ? "text-green-600" : "text-red-600"}`}>{isValid.number ? "✔️" : "❌"}</span>
                                At least one number
                            </p>
                            <p className={`flex items-center ${isValid.symbol ? "text-green-600" : "text-red-600"} transition-colors duration-300`}>
                                <span className={`w-5 h-5 mr-3 ${isValid.symbol ? "text-green-600" : "text-red-600"}`}>{isValid.symbol ? "✔️" : "❌"}</span>
                                At least one symbol
                            </p>
                        </div>
                    </center>
                    {/* <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email"
                            onChange={handleChange}
                            className="block w-full rounded-md h-10 outline-0 ps-3 mb-5 bg-gray-200" />
                    </div> */}
                    <button
                        type="submit"
                        className="w-full h-12 font-semibold text-lg px-5 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-600 transition-all">
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}
