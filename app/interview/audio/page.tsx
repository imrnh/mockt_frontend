'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    X,
    Mic,
    Send,
    Square,
    Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import Cookies from 'js-cookie';
import axios from "axios";


const questionAudios = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
];

const answerAudios = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
];


export default function InterviewPage() {
    const INTERVIEW_UUID = Cookies.get('active_interview_session');

    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [retryQuestionNo, setRetryQuestionNo] = useState(-1);
    const [autoPlayNext, setAutoPlayNext] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [message, setMessage] = useState('');
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [showNextButton, setShowNextButton] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({});

    const [questions, setQuestions] = useState<Array<{ id: number, [key: string]: any }>>([]);
    const [jobRole, setJobRole] = useState("");

    interface Answer {
        text: string;
        score?: number;
        feedback?: string;
        timestamp?: string;
    }

    const [answers, setAnswers] = useState<Record<number, Answer>>({});

    useEffect(() => {
        const auth = getAuth(app);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user || !INTERVIEW_UUID) {
                console.log("User not authenticated or missing interview ID");
                return;
            }

            try {
                const idToken = await user.getIdToken();

                const response = await axios.get(`http://127.0.0.1:3010/interview/questions/${INTERVIEW_UUID}`, {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                });

                // Ensure each question has a unique ID
                const questionsWithIds = response.data.questions.map((q: any, index: number) => ({
                    ...q,
                    id: q.id !== undefined ? q.id : index // fallback to index if id is missing
                }));

                setQuestions(questionsWithIds);
                setJobRole(response.data.job_role || "Interview");

            } catch (err) {
                console.error("Failed to load interview data:", err);
            }
        });

        return () => unsubscribe();
    }, [INTERVIEW_UUID]);



    // Track playing states for each question and answer
    const [playingStates, setPlayingStates] = useState({
        questions: {},
        answers: {}
    });

    const videoRef = useRef<HTMLVideoElement>(null);

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const toggleCamera = async () => {
        if (cameraVisible) {
            // Turn off camera
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
            }
            setCameraVisible(false);
        } else {
            // Turn on camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setCameraStream(stream);
                setCameraVisible(true);
            } catch (err) {
                console.error("Failed to access camera", err);
            }
        }
    };

    // And this effect to handle video stream changes:
    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    const audioRefs = useRef({});

    // Load saved answers from localStorage on component mount
    useEffect(() => {
        const savedInterview = localStorage.getItem(`interview_${INTERVIEW_UUID}`);
        if (savedInterview) {
            try {
                const { answers, answeredQuestions, currentQuestionIndex, autoPlayNext, showNextButton } = JSON.parse(savedInterview);
                setAnswers(answers || {});
                setAnsweredQuestions(answeredQuestions || []);
                setCurrentQuestionIndex(currentQuestionIndex || 0);
                setAutoPlayNext(autoPlayNext || false);
                setShowNextButton(showNextButton || false);
            } catch (e) {
                console.error("Failed to parse saved interview data", e);
            }
        }
    }, []);

    // Save answers to localStorage whenever they change
    useEffect(() => {
        const interviewData = {
            answers,
            answeredQuestions,
            currentQuestionIndex,
            autoPlayNext,
            showNextButton
        };
        localStorage.setItem(`interview_${INTERVIEW_UUID}`, JSON.stringify(interviewData));
    }, [answers, answeredQuestions, currentQuestionIndex, autoPlayNext, showNextButton]);

    useEffect(() => {
        // Clean up media recorder on unmount
        return () => {
            if (mediaRecorder) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaRecorder]);

    const getRecordingKey = (questionId) => {
        return `${INTERVIEW_UUID}_answer_${questionId}`;
    };

    const saveRecording = (questionId, audioBlob) => {
        const recordings = JSON.parse(localStorage.getItem('voiceRecordings') || '{}');
        const recordingKey = getRecordingKey(questionId);
        recordings[recordingKey] = URL.createObjectURL(audioBlob);
        localStorage.setItem('voiceRecordings', JSON.stringify(recordings));
    };

    const hasRecording = (questionId) => {
        const recordings = JSON.parse(localStorage.getItem('voiceRecordings') || '{}');
        return !!recordings[getRecordingKey(questionId)];
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                const targetQuestionId = retryQuestionNo !== -1 ? retryQuestionNo : questions[currentQuestionIndex].id;

                saveRecording(targetQuestionId, audioBlob);

                // Update answer state to maintain object structure
                setAnswers(prev => ({
                    ...prev,
                    [targetQuestionId]: {
                        ...prev[targetQuestionId],
                        text: prev[targetQuestionId]?.text ?
                            `${prev[targetQuestionId].text} (Voice recorded)` :
                            '(Voice recorded)'
                    }
                }));
            };

            recorder.start();
            setMediaRecorder(recorder);
            setAudioChunks(chunks);
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // const handleSend = () => {
    //     if (message.trim() === '') return;

    //     const targetQuestionId = retryQuestionNo !== -1 ? retryQuestionNo : questions[currentQuestionIndex].id;

    //     // Save the answer
    //     const newAnswers = {
    //         ...answers,
    //         [targetQuestionId]: message
    //     };
    //     setAnswers(newAnswers);

    //     // Mark question as answered if not a retry
    //     if (retryQuestionNo === -1) {
    //         const newAnsweredQuestions = [...answeredQuestions, targetQuestionId];
    //         setAnsweredQuestions(newAnsweredQuestions);

    //         // Show next button if auto-play is disabled
    //         if (!autoPlayNext && currentQuestionIndex < questions.length - 1) {
    //             setShowNextButton(true);
    //         } else {
    //             // Move to next question if available
    //             if (currentQuestionIndex < questions.length - 1) {
    //                 setCurrentQuestionIndex(currentQuestionIndex + 1);
    //             }
    //         }
    //     } else {
    //         // For retry, just reset the retry state
    //         setRetryQuestionNo(-1);
    //     }

    //     setMessage('');
    // };

    const handleSend = async () => {
        if (message.trim() === '') return;

        const targetQuestionId = retryQuestionNo !== -1 ? retryQuestionNo : questions[currentQuestionIndex].id;
        const currentQuestion = questions.find(q => q.id === targetQuestionId);

        try {
            // Set loading state for this question
            setLoadingFeedback(prev => ({ ...prev, [targetQuestionId]: true }));

            const auth = getAuth(app);
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const idToken = await user.getIdToken();

            // Show answer immediately
            const tempAnswer = {
                text: message,
                score: 0,
                feedback: "Loading feedback...",
                timestamp: new Date().toISOString()
            };

            setAnswers(prev => ({
                ...prev,
                [targetQuestionId]: tempAnswer
            }));

            // Get evaluation from Gemini
            const evalRes = await fetch("http://localhost:3010/interview/evaluate_interview_answer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    answer_text: message,
                    question_text: currentQuestion.question,
                    job_role: jobRole
                })
            });

            const evaluation = await evalRes.json();

            // Update with real feedback
            const finalAnswer = {
                text: message,
                score: evaluation.score,
                feedback: evaluation.feedback,
                timestamp: new Date().toISOString()
            };

            setAnswers(prev => ({
                ...prev,
                [targetQuestionId]: finalAnswer
            }));

            // Clear loading state
            setLoadingFeedback(prev => ({ ...prev, [targetQuestionId]: false }));

            // Rest of your existing logic...
            if (retryQuestionNo === -1) {
                const newAnsweredQuestions = [...answeredQuestions, targetQuestionId];
                setAnsweredQuestions(newAnsweredQuestions);

                if (!autoPlayNext && currentQuestionIndex < questions.length - 1) {
                    setShowNextButton(true);
                } else if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                }
            } else {
                setRetryQuestionNo(-1);
            }

            setMessage('');

        } catch (err) {
            console.error("Error submitting answer:", err);
            setLoadingFeedback(prev => ({ ...prev, [targetQuestionId]: false }));
            alert("Failed to submit answer: " + err.message);
        }
    };

      

    const toggleAudio = (type, id, audioIndex) => {
        const audio = audioRefs.current[`${type}-${id}`];
        if (!audio) return;

        // Stop all other audio first
        Object.keys(audioRefs.current).forEach(key => {
            if (key !== `${type}-${id}` && !audioRefs.current[key].paused) {
                audioRefs.current[key].pause();
                const [otherType, otherId] = key.split('-');
                setPlayingStates(prev => ({
                    ...prev,
                    [otherType]: {
                        ...prev[otherType],
                        [otherId]: false
                    }
                }));
            }
        });

        // Only set source if it hasn't been set yet
        if (!audio.src) {
            audio.src = type === 'questions' ? questionAudios[audioIndex] : answerAudios[audioIndex];
        }

        if (audio.paused) {
            audio.play().then(() => {
                setPlayingStates(prev => ({
                    ...prev,
                    [type]: {
                        ...prev[type],
                        [id]: true
                    }
                }));
            }).catch(err => {
                console.error("Error playing audio:", err);
            });
        } else {
            audio.pause();
            setPlayingStates(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    [id]: false
                }
            }));
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

    const handleNextQuestion = () => {
        setShowNextButton(false);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handleFinish = () => {
        // Clear all interview-related data
        localStorage.removeItem('current_interview_data');
        localStorage.removeItem(`interview_${INTERVIEW_UUID}_answers`);
        Cookies.remove('active_interview_session');
        router.push('/');
      };

    // Determine which questions to show
    const visibleQuestions = questions.filter((q, index) =>
        index <= currentQuestionIndex || answeredQuestions.includes(q.id)
    );

    // Circular progress bar component
    const CircularProgress = ({ score }) => {
        const radius = 20; // Increased from 20
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (score / 100) * circumference;

        return (
            <div className="relative w-14 h-14 flex items-center justify-center"> {/* Increased from w-12 h-12 */}
                <svg className="w-full h-full" viewBox="0 0 50 50">
                    <circle
                        className="text-black-800"
                        strokeWidth="5"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="25"
                        cy="25"
                    />
                    <circle
                        className={`${score > 80 ? 'text-green-500' : score > 60 ? 'text-orange-400' : 'text-red-500'}`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="25"
                        cy="25"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 25 25)"
                    />
                </svg>
                <span className="absolute text-base font-medium text-black"> {/* Ensured text-black */}
                    {score}%
                </span>
            </div>
        );
    };
    return (
        <div className='bg-white'>
            <div className="container mx-auto h-screen flex flex-col bg-white relative">

                {/* Camera View */}
                {cameraVisible && (
                    <div className="absolute top-4 right-4 w-64 h-48 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                        {cameraStream ? (
                            <video
                                autoPlay
                                muted
                                ref={videoRef}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center h-full flex items-center justify-center">
                                <Video className="w-12 h-12 mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Camera Loading...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Scrollable Chat Section */}
                <div className="flex-1 overflow-y-auto space-y-8 py-6 px-[18%]">
                    {visibleQuestions.map((q) => (
                        <div key={q.id} className="space-y-6">
                            {/* Question - Always show */}
                            <div className="space-y-4">
                                <h2 className="font-semibold text-black">Question {q.id}</h2>
                                <div className="flex items-start space-x-4">

                                    {/* Play/Pause Button Container */}
                                    <div className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-black flex items-center justify-center">
                                        <button
                                            onClick={() => toggleAudio('questions', q.id, q.audioIndex)}
                                            className="w-[22px] h-[22px] flex items-center justify-center text-white"
                                        >
                                            {playingStates.questions[q.id] ? (
                                                <Pause className="w-full h-full" strokeWidth={1.5} />
                                            ) : (
                                                <Play className="w-full h-full" strokeWidth={1.5} />
                                            )}
                                        </button>
                                    </div>

                                    <audio
                                        ref={(el) => audioRefs.current[`questions-${q.id}`] = el}
                                        onEnded={() => handleAudioEnded('questions', q.id)}
                                        preload="none"
                                    />
                                    <div className="text-base text-black pt-2">
                                        {q.question}
                                    </div>

                                </div>
                            </div>
                            <br></br>

                            {/* User Answer - Only show if answered */}
                            {answers[q.id] && (
                                <div className="bg-[#FAF9FF] p-6 rounded-lg space-y-4 lg:ml-[20%]">
                                    <div className="flex items-start space-x-4">
                                        {hasRecording(q.id) && (
                                            <>
                                                <div className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-gray-800 flex items-center justify-center">
                                                    <button
                                                        onClick={() => toggleAudio('answers', q.id, q.audioIndex)}
                                                        className="w-[22px] h-[22px] flex items-center justify-center text-white"
                                                    >
                                                        {playingStates.answers[q.id] ? (
                                                            <Pause className="w-full h-full" strokeWidth={1.5} />
                                                        ) : (
                                                            <Play className="w-full h-full" strokeWidth={1.5} />
                                                        )}
                                                    </button>
                                                </div>
                                                <audio
                                                    ref={(el) => audioRefs.current[`answers-${q.id}`] = el}
                                                    onEnded={() => handleAudioEnded('answers', q.id)}
                                                    preload="none"
                                                />
                                            </>
                                        )}
                                        <div className="text-base text-black pt-2">
                                            {typeof answers[q.id] === 'string'
                                                ? answers[q.id].replace(' (Voice recorded)', '')
                                                : answers[q.id].text?.replace(' (Voice recorded)', '')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feedback - Only show if answered */}
                            {answers[q.id] && (
                                <div className="flex items-center space-x-4 pt-4 lg:ml-[10%]">
                                    <CircularProgress score={answers[q.id].score || 0} />
                                    <p className="text-sm text-gray-700 flex-1">
                                        {loadingFeedback[q.id] ? (
                                            <span className="flex items-center">
                                                <span className="animate-pulse">Loading feedback...</span>
                                                <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></span>
                                            </span>
                                        ) : (
                                            answers[q.id].feedback || ''
                                        )}
                                    </p>
                                    {!loadingFeedback[q.id] && (
                                        <button
                                            onClick={() => handleRetryToggle(q.id)}
                                            className={`flex items-center space-x-1 px-3 py-2 rounded-full ${retryQuestionNo === q.id ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-black'}`}
                                        >
                                            {retryQuestionNo === q.id ? (
                                                <X className="w-4 h-4" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4" />
                                            )}
                                            <span className="text-sm">{retryQuestionNo === q.id ? 'Cancel' : 'Retry'}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {/* Next Button - Show after feedback if autoPlayNext is false and not last question */}
                            {showNextButton && q.id === questions[currentQuestionIndex].id && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleNextQuestion}
                                        className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        Next Question
                                    </button>
                                </div>
                            )}
                            <br></br>
                            <br></br>
                        </div>
                    ))}

                    {/* Completion Message - Show after last question */}
                    {currentQuestionIndex >= questions.length && (
                        <div className="text-center py-8 space-y-6">
                            <div className="text-xl font-semibold text-black">
                                Thank you for completion of the interview.
                            </div>
                            <div className="mt-6">
                                <button
                                    onClick={handleFinish}
                                    className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    )}
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
                                rows={4}
                            />

                            {/* Camera button */}
                            <div className="absolute bottom-4 left-3">
                                <button
                                    onClick={toggleCamera}
                                    className={`w-[42px] h-[42px] rounded-full flex items-center justify-center
    ${cameraVisible ? 'bg-red-100' : 'bg-gray-100'}`}
                                >
                                    <Video className={`w-6 h-6 ${cameraVisible ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
                                </button>
                            </div>

                            <div className="absolute bottom-4 right-3 flex gap-2">
                                {/* Mic Button */}
                                <div className="w-[43px] h-[43px] rounded-full bg-gray-100 flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={toggleRecording}
                                        className={`w-[23px] h-[23px] flex items-center justify-center rounded-full 
                                        transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                        active:scale-95 transform-gpu
                                        ${isRecording ? 'text-red-500' : 'text-gray-500'}`}
                                        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                                    >
                                        {isRecording ? (
                                            <Square className="w-full h-full fill-current" />
                                        ) : (
                                            <Mic className="w-full h-full" />
                                        )}
                                    </button>
                                </div>

                                {/* Send Button */}
                                {message.trim() && (
                                    <div className="w-[43px] h-[43px] rounded-full bg-gray-100 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={handleSend}
                                            className="w-[43px] h-[43px] rounded-full bg-black flex items-center justify-center 
                                            transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                                            active:scale-95 transform-gpu
                                            hover:bg-gray-800 focus:outline-none"
                                            aria-label="Send message"
                                        >
                                            <Send className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Retry Label */}
                        {retryQuestionNo !== -1 && (
                            <div className="text-center text-sm font-medium text-gray-600">
                                Retrying for question {retryQuestionNo + 1}
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
            </div>
        </div>
    );
}