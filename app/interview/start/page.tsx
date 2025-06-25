"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewForm() {
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [questionCount, setQuestionCount] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const auth = getAuth(app);
            const user = auth.currentUser;

            if (!user) {
                alert("Please log in first.");
                setLoading(false);
                return;
            }

            const idToken = await user.getIdToken();

            const res = await fetch("http://localhost:3010/interview/create_interview_session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    job_role: jobTitle,
                    job_description: jobDescription,
                    interview_difficulty: difficulty,
                    question_count: parseInt(questionCount),
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || "Something went wrong");

            localStorage.setItem('current_interview_data', JSON.stringify(data));
            document.cookie = `active_interview_session=${data.inserted_id}; path=/; max-age=${60 * 60 * 24}`;

            router.push("/interview/audio");
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isMounted && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-black"
                >
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring", damping: 10 }}
                        className="w-full max-w-xl p-8 bg-white rounded-2xl shadow-lg space-y-6 backdrop-blur-sm bg-opacity-90"
                    >
                        <motion.h2
                            className="text-3xl font-bold text-gray-800"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            Create Interview Session
                        </motion.h2>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                                Job Title
                            </label>
                            <motion.input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                required
                                className="w-full border border-gray-200 p-3 text-black transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                style={{
                                    borderRadius: "8px",
                                    outline: "none",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                }}
                                whileFocus={{
                                    scale: 1.01,
                                    boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.3)"
                                }}
                                whileHover={{
                                    borderColor: "#a78bfa"
                                }}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                                Job Description
                            </label>
                            <motion.textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                required
                                rows={5}
                                className="w-full border border-gray-200 p-3 text-black transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                style={{
                                    borderRadius: "8px",
                                    outline: "none",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                }}
                                whileFocus={{
                                    scale: 1.01,
                                    boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.3)"
                                }}
                                whileHover={{
                                    borderColor: "#a78bfa"
                                }}
                            />
                        </motion.div>

                        <div className="grid grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-600">
                                    Number of Questions
                                </label>
                                <motion.select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 p-3 bg-white text-black transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    style={{
                                        borderRadius: "8px",
                                        outline: "none",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                    }}
                                    whileFocus={{
                                        scale: 1.01,
                                        boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.3)"
                                    }}
                                    whileHover={{
                                        borderColor: "#a78bfa"
                                    }}
                                >
                                    <option value="">Select number</option>
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </option>
                                    ))}
                                </motion.select>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-600">
                                    Interview Difficulty
                                </label>
                                <motion.select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 p-3 bg-white text-black transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    style={{
                                        borderRadius: "8px",
                                        outline: "none",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                    }}
                                    whileFocus={{
                                        scale: 1.01,
                                        boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.3)"
                                    }}
                                    whileHover={{
                                        borderColor: "#a78bfa"
                                    }}
                                >
                                    <option value="">Select difficulty</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="managerial">Managerial</option>
                                </motion.select>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                whileHover={{
                                    scale: 1.01,
                                    boxShadow: "0 5px 15px rgba(124, 58, 237, 0.4)"
                                }}
                                whileTap={{
                                    scale: 0.99
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                        />
                                        Creating Session...
                                    </span>
                                ) : (
                                    "Create Interview Session"
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}