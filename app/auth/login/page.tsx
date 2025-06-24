"use client";

import React, { useState } from "react";
import { auth, provider } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import axios from "axios";

export default function LoginPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const sendToBackend = async (user: any) => {
        const token = await user.getIdToken();
        await axios.post(
            "http://localhost:3010/auth/register",
            {
                uid: user.uid,
                email: user.email,
                name: user.displayName || "", // no first/last name in login form
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCred = await signInWithEmailAndPassword(
                auth,
                form.email,
                form.password
            );
            const user = userCred.user;
            await sendToBackend(user);
            alert("Logged in!");
            // You can redirect or do other stuff here
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await sendToBackend(user);
            alert("Logged in with Google!");
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-center text-2xl font-bold text-gray-900" style={{ fontSize: '30px' }}>
                        Welcome back
                    </h2>
                </div>

                <div className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="h-5 w-5 mr-2"
                        />
                        Sign in with Google
                    </button>

                    <div className="flex items-center justify-center">
                        <span className="text-gray-400 text-sm">or</span>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="Enter your email"
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="Enter your password"
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                        >
                            Log in
                        </button>
                    </form>

                    <div className="flex justify-between text-sm text-gray-600 pt-2">
                        <a href="/auth/registration" className="hover:underline">Don't have an account?</a>
                        <a href="#" className="hover:underline">Forgot Password?</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
