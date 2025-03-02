"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
    itemId: string;
    itemType: "thread" | "comment";
    threadId?: string;
}

export function VoteButtons({ itemId, itemType, threadId }: VoteButtonsProps) {
    const [score, setScore] = useState(0);
    const [userVote, setUserVote] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchVotes = async () => {
        try {
            const url =
                itemType === "thread"
                    ? `/api/threads/${itemId}/votes`
                    : `/api/threads/${threadId}/comments/${itemId}/votes`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setScore(data.score);
                setUserVote(data.userVote);
            }
        } catch (error) {
            console.error(`Error fetching ${itemType} votes:`, error);
        }
    };

    useEffect(() => {
        fetchVotes();
    }, [itemId, itemType, threadId]);

    const handleVote = async (voteType: number) => {
        setIsLoading(true);
        try {
            const newVoteType = userVote === voteType ? 0 : voteType;

            const url =
                itemType === "thread"
                    ? `/api/threads/${itemId}/votes`
                    : `/api/threads/${threadId}/comments/${itemId}/votes`;

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voteType: newVoteType }),
            });

            if (response.ok) {
                const data = await response.json();
                setScore(data.score);
                setUserVote(data.userVote);
            } else {
                const error = await response.json();
                console.error(`Error voting on ${itemType}:`, error);
            }
        } catch (error) {
            console.error(`Error voting on ${itemType}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-row items-center space-x-1 mt-2">
            <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6", userVote === 1 && "text-green-500")}
                onClick={() => handleVote(1)}
                disabled={isLoading}
            >
                <ArrowUp className="h-3 w-3" />
            </Button>

            <span className="text-xs font-medium">{score}</span>

            <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6", userVote === -1 && "text-red-500")}
                onClick={() => handleVote(-1)}
                disabled={isLoading}
            >
                <ArrowDown className="h-3 w-3" />
            </Button>
        </div>
    );
}
