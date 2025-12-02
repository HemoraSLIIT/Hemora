import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authenticated
        if (!authAPI.isAuthenticated()) {
            navigate('/login');
            return;
        }

        // Fetch current user data
        const fetchUserData = async () => {
            try {
                const userData = await userAPI.getCurrentUser();
                setUser(userData);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch user data:', err);
                setError("Failed to fetch user data.");
                setLoading(false);
                
                // If unauthorized, redirect to login
                if (err.response?.status === 401) {
                    authAPI.logout();
                    navigate('/login');
                }
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        authAPI.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-500 text-lg font-semibold">Loading...</p>
            </div>
        );
    }

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
        <div className="flex items-center justify-center min-h-screen bg-linear-to-r from-blue-950 to-purple-900">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                    Welcome, {user.full_name || user.username}
                </h1>
                <div className="space-y-3 text-gray-700">
                    <p className="text-lg"><strong>Username:</strong> {user.username}</p>
                    <p className="text-lg"><strong>Email:</strong> {user.email}</p>
                    <p className="text-lg"><strong>Role:</strong> {user.role}</p>
                    {user.specialization && (
                        <p className="text-lg"><strong>Specialization:</strong> {user.specialization}</p>
                    )}
                    {user.hospital_affiliation && (
                        <p className="text-lg"><strong>Hospital:</strong> {user.hospital_affiliation}</p>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full mt-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
