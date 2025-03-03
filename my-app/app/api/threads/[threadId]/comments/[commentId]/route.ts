import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];
        const commentId = pathSegments[pathSegments.indexOf("comments") + 1];

        const { content } = await request.json();

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

        const { data: comment, error: commentError } = await supabase
            .from("comments")
            .select("*")
            .eq("id", commentId)
            .eq("thread_id", threadId)
            .single();

        if (commentError || !comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        if (comment.creator_id !== user.id) {
            return NextResponse.json(
                { error: "You can only edit your own comments" },
                { status: 403 }
            );
        }

        const { data: updatedComment, error } = await supabase
            .from("comments")
            .update({
                content,
                updated_at: new Date().toISOString(),
            })
            .eq("id", commentId)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update comment" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment: updatedComment }, { status: 200 });
    } catch (error) {
        console.error("Error updating comment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];
        const commentId = pathSegments[pathSegments.indexOf("comments") + 1];

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

        const { data: comment, error: commentError } = await supabase
            .from("comments")
            .select("*")
            .eq("id", commentId)
            .eq("thread_id", threadId)
            .single();

        if (commentError || !comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        if (comment.creator_id !== user.id) {
            return NextResponse.json(
                { error: "You can only delete your own comments" },
                { status: 403 }
            );
        }

        const { error: repliesError } = await supabase
            .from("comments")
            .delete()
            .eq("parent_id", commentId);

        if (repliesError) {
            return NextResponse.json(
                { error: "Failed to delete replies" },
                { status: 500 }
            );
        }

        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            return NextResponse.json(
                { error: "Failed to delete comment" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
