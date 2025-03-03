import { useState, useEffect } from "react";

interface ThreadSummaryProps {
    threadId: string;
}

export default function ThreadSummary({ threadId }: ThreadSummaryProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/threads/${threadId}/summarize`);

            if (!response.ok) {
                throw new Error("Failed to fetch summary");
            }

            const data = await response.json();
            setSummary(data.summary);
        } catch (err) {
            setError("Failed to generate summary. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [threadId]);

    return (
        <div className="flex items-start my-3 border border-gray-300 dark:border-gray-600 rounded p-4">
            <div className="flex-1 ml-2">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                        AI Summary
                    </h2>
                </div>
                {loading ? (
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                ) : error ? (
                    <div>
                        <p className="text-red-500 dark:text-red-400">
                            {error}
                        </p>
                        <button
                            className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
                            onClick={fetchSummary}
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <p className="text-base text-gray-900 dark:text-gray-100">
                        {summary}
                    </p>
                )}
            </div>
        </div>
    );
}
