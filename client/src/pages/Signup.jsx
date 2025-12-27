import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || '').trim());
const isStrongPassword = (password) => /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(String(password || ''));

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const name = String(formData.full_name || '').trim();
        const email = String(formData.email || '').trim();

        if (!name) return setError('Full name is required');
        if (!isValidEmail(email)) return setError('Please enter a valid email address');
        if (!isStrongPassword(formData.password)) return setError('Password must be 8+ chars with 1 uppercase and 1 special character');
        if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');

        (async () => {
            try {
                setSubmitting(true);
                await signup({ full_name: name, email, password: formData.password });
                navigate('/dashboard', { replace: true });
            } catch (err) {
                setError(err?.response?.data?.error || 'Signup failed');
            } finally {
                setSubmitting(false);
            }
        })();
    };

    return (
        <div className="flex h-screen font-outfit">
            {/* Left Design Section */}
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-maint-green border-r-4 border-gray-900 p-12">
                <div className="max-w-md space-y-6">
                    <div className="sketch-card bg-white rotate-1">
                        <h1 className="text-6xl font-black italic tracking-tighter mb-4 leading-none">Join MaintSync.</h1>
                        <p className="text-xl font-bold uppercase tracking-wide border-t-4 border-gray-900 pt-4">Streamline your facility operations today</p>
                    </div>
                    <div className="sketch-card bg-maint-blue -rotate-1 text-right">
                        <p className="font-bold text-lg uppercase">Centralized. Transparent. Efficient.</p>
                    </div>
                </div>
            </div>

            {/* Right Signup Section */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white p-8">
                <div className="w-full max-w-sm space-y-8">
                    <div className="sketch-card bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase tracking-tighter underline underline-offset-8 decoration-4 mb-8">Register Portal</h2>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs flex items-center gap-2">
                                    <ShieldCheck size={16} /> {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Name</label>
                                <div className="flex items-center gap-3 border-2 border-gray-900 p-2">
                                    <User size={18} />
                                    <input
                                        type="text"
                                        placeholder="John Carter"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30 text-sm"
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                                <div className="flex items-center gap-3 border-2 border-gray-900 p-2">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        placeholder="j.carter@mycompany.com"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30 text-sm"
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Create Password</label>
                                <div className="flex items-center gap-3 border-2 border-gray-900 p-2">
                                    <Lock size={18} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30 text-sm"
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirm Security Key</label>
                                <div className="flex items-center gap-3 border-2 border-gray-900 p-2">
                                    <ShieldCheck size={18} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30 text-sm"
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} className="w-full sketch-button bg-maint-blue justify-center py-3 mt-4 font-black disabled:opacity-60">
                                CREATE ACCOUNT <UserPlus size={20} className="ml-2" />
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <p className="font-bold text-gray-500 uppercase text-[10px] tracking-widest text-center italic">
                            Already registered? Just log in to your portal below
                        </p>
                        <Link to="/login" className="font-black text-sm underline decoration-2 underline-offset-4 hover:text-maint-blue transition-colors">
                            SIGN IN TO EXISTING ACCOUNT
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
