'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const CLOUD_FUNCTION_URL = 'https://us-central1-mockt-interview-preparation.cloudfunctions.net/generateAudio';



export default function AudioGenerator() {
    const [text, setText] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsub();
    }, []);

    const generateAudio = async () => {
        setLoading(true);
        setError('');
        setAudioUrl('');

        try {
            if (!user) throw new Error('User not signed in.');

            const idToken = await user.getIdToken();

            const res = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) throw new Error('Failed to generate audio.');

            const data = await res.json();
            setAudioUrl(data.audioUrl);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Text to Audio Generator</h2>
            <textarea
                className="w-full border p-2 rounded mb-4"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text..."
            />
            <button
                onClick={generateAudio}
                disabled={loading || !text.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
                {loading ? 'Generating...' : 'Generate Audio'}
            </button>

            {audioUrl && (
                <div className="mt-6">
                    <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mp3" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}

            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
  }