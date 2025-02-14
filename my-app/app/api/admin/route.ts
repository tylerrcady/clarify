import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== "tylercadyfairport@gmail.com") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await request.json();

    if (action === "approve") {
        const { data: request } = await supabase
            .from("admin_requests")
            .select("user_id")
            .eq("id", requestId)
            .single();

        if (request) {
            await supabase
                .from("profiles")
                .update({ is_admin: true })
                .eq("id", request.user_id);
        }
    }

    await supabase
        .from("admin_requests")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", requestId);

    return NextResponse.json({ success: true });
}
