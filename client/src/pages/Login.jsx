import React from 'react';
import { LogIn, Mail, Key } from 'lucide-react';

const Login = () => {
    return (
        <div className="flex h-screen bg-maint-blue font-outfit items-center justify-center">
            <div className="sketch-card bg-white w-full max-w-sm">
                <h2 className="text-2xl font-black uppercase mb-8 underline decoration-4 underline-offset-8">User Login</h2>
                <form className="space-y-6">
                    <div className="border-4 border-gray-900 p-3 flex items-center gap-3"><Mail /><input type="email" placeholder="Email" className="outline-none w-full" /></div>
                    <div className="border-4 border-gray-900 p-3 flex items-center gap-3"><Key /><input type="password" placeholder="Password" className="outline-none w-full" /></div>
                    <button className="sketch-button bg-maint-green w-full py-4 font-black">SIGN IN <LogIn className="inline ml-2" /></button>
                </form>
            </div>
        </div>
    );
};
export default Login;
