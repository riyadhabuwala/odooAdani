import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });

    return (
        <div className="flex h-screen font-outfit">
            {/* Left Design Section */}
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-maint-blue border-r-4 border-gray-900 p-12">
                <div className="max-w-md space-y-6">
                    <div className="sketch-card bg-white -rotate-2">
                        <h1 className="text-6xl font-black italic tracking-tighter mb-4 leading-none">MaintSync.</h1>
                        <p className="text-xl font-bold uppercase tracking-wide border-t-4 border-gray-900 pt-4">Maintenance Management for modern Industry</p>
                    </div>
                    <div className="sketch-card bg-maint-yellow rotate-1">
                        <p className="font-bold text-lg">"The best maintenance is the one you predict, not the one you regret."</p>
                    </div>
                </div>
            </div>

            {/* Right Login Section */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white p-8">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-2 lg:hidden">
                        <h1 className="text-4xl font-black italic tracking-tighter">MaintSync.</h1>
                    </div>

                    <div className="sketch-card bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase tracking-tighter underline underline-offset-8 decoration-4 mb-8">User Login</h2>

                        <form className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-gray-500">Corporate Email</label>
                                <div className="flex items-center gap-3 border-4 border-gray-900 p-3">
                                    <Mail size={20} />
                                    <input
                                        type="email"
                                        placeholder="name@adani.com"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-gray-500">Security Key</label>
                                <div className="flex items-center gap-3 border-4 border-gray-900 p-3">
                                    <Key size={20} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30"
                                    />
                                </div>
                            </div>

                            <button className="w-full sketch-button bg-maint-green justify-center py-4 font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                SIGN IN <LogIn size={24} className="ml-2" />
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col items-center gap-4 pt-4">
                        <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">New to the platform?</p>
                        <Link to="/signup" className="sketch-button bg-maint-blue text-sm font-black">
                            CREATE PORTAL ACCOUNT
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
