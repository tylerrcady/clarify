import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: thread, error: threadError } = await supabase
            .from("threads")
            .select("*")
            .eq("id", threadId)
            .single();

        if (threadError || !thread) {
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404 }
            );
        }

        const { data: comments, error: commentsError } = await supabase
            .from("comments")
            .select("*")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: true });

        if (commentsError) {
            return NextResponse.json(
                { error: "Failed to fetch comments" },
                { status: 500 }
            );
        }

        const { data: existingSummary, error: summaryError } = await supabase
            .from("thread_summaries")
            .select("*")
            .eq("thread_id", threadId)
            .single();

        const summaryIsRecent =
            existingSummary &&
            new Date().getTime() -
                new Date(existingSummary.updated_at).getTime() <
                24 * 60 * 60 * 1000;

        if (
            summaryIsRecent &&
            existingSummary.comment_count === comments.length
        ) {
            return NextResponse.json(
                { summary: existingSummary.content },
                { status: 200 }
            );
        }

        const threadContent = `Title: ${thread.title}\n\nContent: ${thread.content}`;
        const commentsContent = comments
            .map((comment) => `Comment: ${comment.content}`)
            .join("\n\n");
        const fullContent = `${threadContent}\n\n${commentsContent}`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // try to be economical here
            messages: [
                {
                    role: "system",
                    content:
                        "You are an educational assistant that summarizes academic discussions. Focus on key points, questions, and answers. Highlight important concepts and conclusions.",
                },
                {
                    role: "user",
                    content: `Please summarize the following educational thread and its comments. Extract the main question, key insights, and important conclusions:\n\n${fullContent}`,
                },
            ],
            max_tokens: 500,
        });

        const summary = response.choices[0].message.content;

        if (existingSummary) {
            await supabase
                .from("thread_summaries")
                .update({
                    content: summary,
                    updated_at: new Date().toISOString(),
                    comment_count: comments.length,
                })
                .eq("id", existingSummary.id);
        } else {
            await supabase.from("thread_summaries").insert({
                thread_id: threadId,
                content: summary,
                comment_count: comments.length,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({ summary }, { status: 200 });
    } catch (error) {
        console.error("Error generating summary:", error);
        return NextResponse.json(
            { error: "Failed to generate summary" },
            { status: 500 }
        );
    }
}
