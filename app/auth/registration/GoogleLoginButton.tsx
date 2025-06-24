// GoogleLoginButton.jsx

import React, { useState } from 'react';
import { auth, googleProvider } from './firebaseConfig'; // Adjust path
import { signInWithPopup } from 'firebase/auth';

export default function GoogleLoginButton() {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Google user:", result.user);
            // Optional: redirect or show success
        } catch (err) {
            console.error("Google sign-in error:", err);
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
        >
            {loading ? "Signing in..." : "Sign up with Google"}
        </button>
    );
}
