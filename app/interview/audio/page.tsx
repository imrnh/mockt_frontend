'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

const audioURL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const dummyQuestions = [
    {
        id: 1,
        question: "In a fast-scaling SaaS company approaching Series C, how would you balance the need for rapid product development with the long-term architectural integrity and technical debt management?",
        feedback: "While your answer is clear, it is not complete. As a CTO, you should also consider culture of the company...",
        score: 71
    },
    {
        id: 2,
        question: "Give an example of a challenging project you completed. What were the obstacles, and how did you overcome them?",
        feedback: "Good example, but try to quantify the impact more clearly...",
        score: 85
    },
    {
        id: 3,
        question: "How would you handle a situation where the engineering team disagrees with the product team's priorities?",
        feedback: "You need to show more leadership in aligning teams...",
        score: 68
    },
    {
        id: 4,
        question: "Describe your approach to building and maintaining a high-performing engineering culture.",
        feedback: "Consider discussing psychological safety and continuous learning...",
        score: 79
    },
    {
        id: 5,
        question: "What metrics do you track to measure engineering productivity, and why?",
        feedback: "Good start, but include more business outcome metrics...",
        score: 82
    }
];

export default function InterviewPage() {
    const [questions, setQuestions] = useState(dummyQuestions);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [retryQuestionNo, setRetryQuestionNo] = useState(-1);
    const [autoPlayNext, setAutoPlayNext] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [message, setMessage] = useState('');
    const [answers, setAnswers] = useState({});
    const [answeredQuestions, setAnsweredQuestions] = useState([]);

    // Track playing states for each question and answer
    const [playingStates, setPlayingStates] = useState({
        questions: {},
        answers: {}
    });

    const audioRefs = useRef({});

    const handleSend = () => {
        if (message.trim() === '') return;

        const targetQuestionId = retryQuestionNo !== -1 ? retryQuestionNo : questions[currentQuestionIndex].id;

        // Save the answer
        const newAnswers = {
            ...answers,
            [targetQuestionId]: message
        };
        setAnswers(newAnswers);

        // Mark question as answered if not a retry
        if (retryQuestionNo === -1) {
            setAnsweredQuestions([...answeredQuestions, targetQuestionId]);

            // Move to next question if available
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
        } else {
            // For retry, just reset the retry state
            setRetryQuestionNo(-1);
        }

        setMessage('');
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        console.log(isRecording ? 'Stopped recording' : 'Started recording');
    };

    const toggleAudio = (type, id) => {
        const audio = audioRefs.current[`${type}-${id}`];
        if (!audio) return;

        // Stop all other audio first
        Object.keys(audioRefs.current).forEach(key => {
            if (key !== `${type}-${id}` && !audioRefs.current[key].paused) {
                audioRefs.current[key].pause();
            }
        });

        // Update playing states
        setPlayingStates(prev => {
            const newStates = { ...prev };
            // Reset all other playing states
            Object.keys(newStates[type]).forEach(k => {
                if (k !== id.toString()) newStates[type][k] = false;
            });
            // Toggle current state
            newStates[type][id] = !newStates[type][id];
            return newStates;
        });

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    };

    const handleAudioEnded = (type, id) => {
        setPlayingStates(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [id]: false
            }
        }));
    };

    const handleRetryToggle = (questionNo) => {
        if (retryQuestionNo === questionNo) {
            setRetryQuestionNo(-1);
        } else {
            setRetryQuestionNo(questionNo);
            // Set the message to the existing answer if available
            setMessage(answers[questionNo] || '');
        }
    };

    // Determine which questions to show
    const visibleQuestions = questions.filter((q, index) =>
        index <= currentQuestionIndex || answeredQuestions.includes(q.id)
    );

    return (
        <div className='bg-white'>
            <div className="container mx-auto h-screen flex flex-col bg-white">
                {/* Scrollable Chat Section */}
                <div className="flex-1 overflow-y-auto space-y-6 py-6 px-4">
                    {visibleQuestions.map((q) => (
                        <div key={q.id} className="space-y-4">
                            {/* Question - Always show */}
                            <div className="space-y-2">
                                <h2 className="font-semibold text-black">Question {q.id}</h2>
                                <div className="flex items-start space-x-4">
                                    <button
                                        onClick={() => toggleAudio('questions', q.id)}
                                        className="flex-shrink-0 w-[55px] h-[55px]"
                                    >
                                        <Image
                                            src={playingStates.questions[q.id] ? "/assets/icons/pause.png" : "/assets/icons/play-button.png"}
                                            alt={playingStates.questions[q.id] ? "Pause" : "Play"}
                                            width={55}
                                            height={55}
                                            className="w-full h-full"
                                        />
                                    </button>
                                    <audio
                                        ref={(el) => audioRefs.current[`questions-${q.id}`] = el}
                                        src={audioURL}
                                        onEnded={() => handleAudioEnded('questions', q.id)}
                                    />
                                    <div className="text-sm text-gray-700 pt-2">
                                        {q.question}
                                    </div>
                                </div>
                            </div>

                            {/* User Answer - Only show if answered */}
                            {answers[q.id] && (
                                <div className="bg-[#FAF9FF] p-4 rounded space-y-2">
                                    <div className="flex items-start space-x-4">
                                        <button
                                            onClick={() => toggleAudio('answers', q.id)}
                                            className="flex-shrink-0 w-[55px] h-[55px]"
                                        >
                                            <Image
                                                src={playingStates.answers[q.id] ? "/assets/icons/pause.png" : "/assets/icons/play-button.png"}
                                                alt={playingStates.answers[q.id] ? "Pause" : "Play"}
                                                width={55}
                                                height={55}
                                                className="w-full h-full"
                                            />
                                        </button>
                                        <audio
                                            ref={(el) => audioRefs.current[`answers-${q.id}`] = el}
                                            src={audioURL}
                                            onEnded={() => handleAudioEnded('answers', q.id)}
                                        />
                                        <div className="text-sm text-gray-700 pt-2">
                                            {answers[q.id]}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feedback - Only show if answered */}
                            {answers[q.id] && (
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${q.score > 80 ? 'bg-green-500' : q.score > 60 ? 'bg-orange-400' : 'bg-red-500'}`}
                                            style={{ width: `${q.score}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-700 flex-1">
                                        {q.feedback}
                                    </p>
                                    <button
                                        onClick={() => handleRetryToggle(q.id)}
                                        className={`flex items-center space-x-1 px-2 py-1 rounded ${retryQuestionNo === q.id ? 'text-red-500' : 'text-black'}`}
                                    >
                                        <Image
                                            src={retryQuestionNo === q.id ? "/assets/icons/close.png" : "/assets/icons/reload.png"}
                                            alt="Retry Icon"
                                            width={16}
                                            height={16}
                                        />
                                        <span>{retryQuestionNo === q.id ? 'Cancel Retry' : 'Retry'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Fixed Bottom Answer Box - Only show if not all questions answered */}
                {currentQuestionIndex < questions.length && (
                    <div className="mx-auto w-full max-w-[700px] px-4 py-4 select-none">
                        <div className="relative">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={
                                    retryQuestionNo !== -1
                                        ? `Revise your answer for question ${retryQuestionNo}...`
                                        : `Write your answer for question ${questions[currentQuestionIndex].id}...`
                                }
                                className="w-full border-0 rounded-[20px] bg-[#EBEBEB] text-[#181818] p-4 pr-24 resize-none 
                                focus:outline-none focus:ring-0 focus:border-transparent
                                transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                active:scale-[0.99]"
                                rows={3}
                            />

                            <div className="absolute bottom-4 right-3 flex gap-2">
                                {/* Mic Button */}
                                <button
                                    type="button"
                                    onClick={toggleRecording}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center 
                                    transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                    active:scale-95 transform-gpu
                                    ${isRecording ? 'bg-gray-500' : 'bg-transparent border border-gray-400'}`}
                                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                                >
                                    {isRecording ? (
                                        <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                            <line x1="12" y1="19" x2="12" y2="23" />
                                            <line x1="8" y1="23" x2="16" y2="23" />
                                        </svg>
                                    )}
                                </button>

                                {/* Send Button */}
                                {message.trim() && (
                                    <button
                                        type="button"
                                        onClick={handleSend}
                                        className="w-10 h-10 rounded-full bg-black flex items-center justify-center 
                                        transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                        active:scale-95 transform-gpu
                                        hover:bg-gray-800 focus:outline-none"
                                        aria-label="Send message"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Retry Label */}
                        {retryQuestionNo !== -1 && (
                            <div className="text-center text-sm font-medium text-gray-600">
                                Retrying for question {retryQuestionNo}
                            </div>
                        )}
                        {retryQuestionNo == -1 && (
                            <div className="text-center text-sm font-medium text-gray-600">
                                &nbsp;
                            </div>
                        )}
                        <label className="flex items-center space-x-2 text-sm" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                            <input
                                type="checkbox"
                                checked={autoPlayNext}
                                onChange={(e) => setAutoPlayNext(e.target.checked)}
                            />
                            <span style={{ color: "black" }}>Play Next Question Automatically</span>
                        </label>
                    </div>
                )}

                {/* Completion Message */}
                {currentQuestionIndex >= questions.length && (
                    <div className="mx-auto w-full max-w-[700px] px-4 py-8 text-center">
                        <h3 className="text-xl font-semibold text-black mb-2">Interview Completed</h3>
                        <p className="text-gray-700">Thank you for completing all the questions!</p>
                    </div>
                )}
            </div>
        </div>
    );
}