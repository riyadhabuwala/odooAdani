import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // In real app, call API
        navigate('/dashboard');
    };

    return (
        <div className="flex h-screen font-sketch">
            <div className="w-1/2 bg-pastel-blue flex items-center justify-center p-12 border-r-3 border-black">
                <div className="max-w-md text-center">
                    <h1 className="text-6xl font-bold italic mb-6 tracking-tighter">MaintSync.</h1>
                    <p className="text-xl font-bold leading-relaxed mb-8">
                        Simplify your equipment maintenance with our clean, sketch-like management system.
                    </p>
                    <div className="bg-white border-3 border-black p-4 shadow-sketch inline-block transform -rotate-1">
                        <span className="font-bold italic">"Maintenance made human again."</span>
                    </div>
                </div>
            </div>
            <div className="w-1/2 bg-white flex items-center justify-center p-12">
                <div className="w-full max-w-sm">
                    <h2 className="text-3xl font-bold mb-8 underline decoration-pastel-yellow decoration-8 underline-offset-4">Welcome Back</h2>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block font-bold mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="input-sketch w-full"
                                placeholder="riya@adani.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="input-sketch w-full"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-sketch w-full bg-black text-white hover:bg-slate-800">
                            Sign In
                        </button>
                    </form>
                    <p className="mt-8 text-center font-bold">
                        Don't have an account? <Link to="/signup" className="text-blue-600 underline">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
