import React, { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("You are not logged in.");
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.id;

            const fetchData = async () => {
                try {
                    const response = await axios.post(`http://localhost:8000/user/${userId}`);
                    setUser(response.data.user);
                } catch (err) {
                    setError("Failed to fetch data.");
                }
            };

            fetchData();
        } catch (err) {
            setError("Failed to decode token.");
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-red-500 text-lg font-semibold">{error}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-500 text-lg font-semibold">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-950 to-purple-900">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Welcome, {user.userName}</h1>
                <div className="flex justify-center mb-4">
                    {user.profilePicture && (
                        <img src={user.profilePicture} alt="Profile" className="h-24 w-24 rounded-full border-4 border-blue-500" />
                    )}
                </div>
                <p className="text-gray-700 text-lg text-center mb-6">Email: {user.email}</p>
                <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
