"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function InterviewForm() {
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [questionCount, setQuestionCount] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

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

            console.log("Questions created:", data.questions);
            // router.push("/interview-session/" + data.inserted_id);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-white text-black">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl p-6 bg-white rounded-2xl shadow-md space-y-6 text-black"
            >
                <h2 className="text-2xl font-semibold">Create Interview Session</h2>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Job Title
                    </label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 text-black"
                        style={{
                            borderRadius: "6px",
                            outline: "none",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "violet")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")} // Tailwind gray-300
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Job Description
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        required
                        rows={4}
                        className="w-full border border-gray-300 p-2 text-black resize-none overflow-y-auto"
                        style={{
                            borderRadius: "6px",
                            outline: "none",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "violet")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Number of Questions
                    </label>
                    <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 bg-white text-black"
                        style={{
                            borderRadius: "6px",
                            outline: "none",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "violet")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
                    >
                        <option value="">Number of questions</option>
                        {Array.from({ length: 10 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Interview Difficulty
                    </label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2 bg-white text-black"
                        style={{
                            borderRadius: "6px",
                            outline: "none",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "violet")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
                    >
                        <option value="">Select difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="managerial">Managerial</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 transition"
                    style={{ borderRadius: "6px" }}
                >
                    {loading ? "Creating..." : "Create Interview Session"}
                </button>
            </form>
        </div>
    );
}
