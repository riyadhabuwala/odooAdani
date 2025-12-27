import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleSignup = (e) => {
        e.preventDefault();
        // Validation: 8 chars, 1 uppercase, 1 special char
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(formData.password)) {
            alert("Password must be min 8 chars, 1 uppercase, 1 special char.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        // In real app, call API
        navigate('/login');
    };

    return (
        <div className="flex h-screen font-sketch">
            <div className="w-1/2 bg-pastel-green flex items-center justify-center p-12 border-r-3 border-black">
                <div className="max-w-md text-center">
                    <h1 className="text-6xl font-bold italic mb-6 tracking-tighter">MaintSync.</h1>
                    <p className="text-xl font-bold leading-relaxed mb-8">
                        Join the modern way of managing maintenance. Clean, fast, and professional.
                    </p>
                    <div className="bg-white border-3 border-black p-4 shadow-sketch inline-block transform rotate-1">
                        <span className="font-bold italic">"For teams who value clarity."</span>
                    </div>
                </div>
            </div>
            <div className="w-1/2 bg-white flex items-center justify-center p-12">
                <div className="w-full max-w-sm">
                    <h2 className="text-3xl font-bold mb-8 underline decoration-pastel-purple decoration-8 underline-offset-4">Create Account</h2>
                    <form className="space-y-4" onSubmit={handleSignup}>
                        <div>
                            <label className="block font-bold mb-1">Username</label>
                            <input
                                type="text"
                                required
                                className="input-sketch w-full"
                                placeholder="riya_adani"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="input-sketch w-full"
                                placeholder="riya@adani.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="input-sketch w-full"
                                placeholder="********"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="input-sketch w-full"
                                placeholder="********"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn-sketch w-full bg-black text-white hover:bg-slate-800 mt-4">
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-8 text-center font-bold">
                        Already have an account? <Link to="/login" className="text-blue-600 underline">Log in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
