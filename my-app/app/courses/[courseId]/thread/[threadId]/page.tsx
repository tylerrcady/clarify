import { createClient } from "@/utils/supabase/server";
import ThreadDiscussion from "./ThreadDiscussion";
import Link from "next/link";

interface Params {
    threadId: string;
}

export default async function ThreadPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const resolvedParams = await params;

    const supabase = await createClient();
    const { data: thread } = await supabase
        .from("threads")
        .select("*")
        .eq("id", resolvedParams.threadId)
        .single();

    if (!thread) {
        return <Link href="/dashboard">Redirecting to dashboard...</Link>;
    }

    return <ThreadDiscussion thread={thread} />;
}
