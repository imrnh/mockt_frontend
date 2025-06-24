"use client";

import React, { useState } from "react";
import { auth, provider } from "@/lib/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import axios from "axios";

export default function SignupPage() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCred = await createUserWithEmailAndPassword(
                auth,
                form.email,
                form.password
            );
            const user = userCred.user;
            await sendToBackend(user, form.firstName, form.lastName);
            alert("Account created!");
        } catch (error) {
            alert(error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await sendToBackend(user);
        } catch (error) {
            alert(error.message);
        }
    };

    const sendToBackend = async (user, firstName = "", lastName = "") => {
        const token = await user.getIdToken();
        await axios.post(
            "http://localhost:3010/auth/register",
            {
                uid: user.uid,
                email: user.email,
                name: user.displayName || `${firstName} ${lastName}`,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                        Get started for free
                    </h2>
                </div>

                <div className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
                    <br />

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
                        <div className="flex gap-2">
                            <input
                                name="firstName"
                                type="text"
                                required
                                placeholder="First name"
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                                name="lastName"
                                type="text"
                                required
                                placeholder="Last name"
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
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
                            Get started
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            <a href="/auth/login" className="text-indigo-600 hover:underline">
                                Do you have an account?
                            </a>
                        </p>
                    </div>
                </div>

                <p className="mt-4 text-xs text-gray-400 text-center">
                    Signing up for a Stellar account means you agree to the{" "}
                    <a href="#" className="underline">
                        Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline">
                        Terms of Service
                    </a>.
                </p>
            </div>
        </div>
    );
}
