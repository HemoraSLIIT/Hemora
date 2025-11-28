import React, { useState } from 'react';
import axios from 'axios';
import BgImg from "../images/loginwallpaper.png";
import { useNavigate } from 'react-router-dom';

export default function Login() {

    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        userName: '',
        password: ''
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const loginUser = async (e) => {
        e.preventDefault();

        if (!loginData.userName || !loginData.password) {
            setError('Username and Password are required.');
            return;
        }

        try {
            const response = await axios.post("http://localhost:8000/login", loginData);
            const { token } = response.data;

            localStorage.setItem('token', token);

            alert("Login Successful!");
            navigate('/dashboard');
        } catch (error) {
            console.log(error);
            setError(error.response?.data?.message || "Login Unsuccessful!");
            alert("Login Unsuccessful!");
        }
    };


    return (
        <>
            <div className="bg-cover bg-center min-h-screen flex items-center justify-center" style={{backgroundImage: `url(${BgImg})`}}>
                <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-8">
                    <form onSubmit={loginUser} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                name="userName"
                                id="userName"
                                placeholder="Enter username"
                                onChange={handleChange}
                                value={loginData.userName}
                                className="block w-full rounded-md h-10 outline-0 ps-3 mb-5 bg-gray-200" />
                        </div>
                        <div>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                placeholder="Enter password"
                                onChange={handleChange}
                                value={loginData.password}
                                className="block w-full rounded-md h-10 outline-0 ps-3 mb-5 bg-gray-200" />
                        </div>
                        <p className="text-red-500">{error}</p>
                        <button
                            type="submit"
                            className="w-full h-12 font-semibold text-lg px-5 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-600 transition-all">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
