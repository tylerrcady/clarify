import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];

        const supabase = await createClient();

        const { data: votesCount, error: votesError } = await supabase
            .from("thread_votes")
            .select("vote_type")
            .eq("thread_id", threadId);

        if (votesError) {
            return NextResponse.json(
                { error: "Failed to fetch votes" },
                { status: 500 }
            );
        }

        const score = votesCount.reduce(
            (total, vote) => total + vote.vote_type,
            0
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();
        let userVote = null;

        if (user) {
            const { data: userVoteData, error: userVoteError } = await supabase
                .from("thread_votes")
                .select("vote_type")
                .eq("thread_id", threadId)
                .eq("user_id", user.id)
                .single();

            if (!userVoteError && userVoteData) {
                userVote = userVoteData.vote_type;
            }
        }

        return NextResponse.json({ score, userVote }, { status: 200 });
    } catch (error) {
        console.error("Error fetching thread votes:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];

        const { voteType } = await request.json();

        if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
            return NextResponse.json(
                {
                    error: "Invalid vote type. Must be 1, -1, or 0 to remove vote",
                },
                { status: 400 }
            );
        }

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
            .select("id")
            .eq("id", threadId)
            .single();

        if (threadError || !thread) {
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404 }
            );
        }

        const { data: threadCourse } = await supabase
            .from("threads")
            .select("course_id")
            .eq("id", threadId)
            .single();

        const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("courses")
            .eq("email", user.email)
            .single();

        if (
            !enrollment ||
            !threadCourse ||
            !enrollment.courses.some(
                (c: { courseId: string }) =>
                    c.courseId === threadCourse.course_id
            )
        ) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: existingVote, error: voteError } = await supabase
            .from("thread_votes")
            .select("id, vote_type")
            .eq("thread_id", threadId)
            .eq("user_id", user.id)
            .single();

        if (voteType === 0) {
            if (existingVote) {
                const { error: deleteError } = await supabase
                    .from("thread_votes")
                    .delete()
                    .eq("id", existingVote.id);

                if (deleteError) {
                    return NextResponse.json(
                        { error: "Failed to remove vote" },
                        { status: 500 }
                    );
                }
            }
        } else {
            if (existingVote) {
                const { error: updateError } = await supabase
                    .from("thread_votes")
                    .update({ vote_type: voteType })
                    .eq("id", existingVote.id);

                if (updateError) {
                    return NextResponse.json(
                        { error: "Failed to update vote" },
                        { status: 500 }
                    );
                }
            } else {
                const { error: insertError } = await supabase
                    .from("thread_votes")
                    .insert({
                        thread_id: threadId,
                        user_id: user.id,
                        vote_type: voteType,
                    });

                if (insertError) {
                    return NextResponse.json(
                        { error: "Failed to add vote" },
                        { status: 500 }
                    );
                }
            }
        }

        const { data: updatedVotes, error: countError } = await supabase
            .from("thread_votes")
            .select("vote_type")
            .eq("thread_id", threadId);

        if (countError) {
            return NextResponse.json(
                { error: "Failed to fetch updated votes" },
                { status: 500 }
            );
        }

        const score = updatedVotes.reduce(
            (total, vote) => total + vote.vote_type,
            0
        );

        return NextResponse.json(
            {
                score,
                userVote: voteType === 0 ? null : voteType,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error processing thread vote:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
