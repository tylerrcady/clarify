import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    requestAdminAction,
    approveAdminRequestAction,
    rejectAdminRequestAction,
    createCourseAction,
} from "@/app/actions";
import Link from "next/link";
import { FormMessage } from "@/components/form-message";

interface SearchParams {
    searchParams: Promise<{ success: string; error: string }>;
}

export default async function Settings({ searchParams }: SearchParams) {
    const { success, error } = await searchParams;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    const { data: userAdminRequest } = await supabase
        .from("admin_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    const { data: adminRequests } = await supabase
        .from("admin_requests")
        .select("*")
        .eq("status", "pending");

    const isMainAdmin = user.email === "tylercadyfairport@gmail.com";
    const isAdmin = profile?.is_admin || false;

    return (
        <div className="flex-1 w-full max-w-4xl p-4 space-y-8">
            <div className="flex justify-between border-b py-3">
                <h1 className="text-2xl font-bold">Settings</h1>
                <Link href={"/dashboard"}>
                    <Button variant="outline" className="w-full sm:w-auto">
                        &larr;&nbsp;&nbsp;Back
                    </Button>
                </Link>
            </div>

            {/* Message Display */}
            <FormMessage message={{ success, error }} />

            {/* User Information */}
            <div className="p-6 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                    Account Information
                </h2>
                <div className="space-y-2">
                    <div>
                        <Label>Email</Label>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div>
                        <Label>Account Created</Label>
                        <p className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <Label>Account Status</Label>
                        <p className="text-muted-foreground">
                            {user.email_confirmed_at
                                ? "Verified"
                                : "Unverified"}
                        </p>
                    </div>
                    <div>
                        <Label>Admin Status</Label>
                        <p className="text-muted-foreground">
                            {isMainAdmin
                                ? "Main Admin"
                                : isAdmin
                                  ? "Admin"
                                  : "User"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin Request Section */}
            {!isAdmin && !isMainAdmin && (
                <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">
                        Request Admin Access
                    </h2>
                    <div className="space-y-4">
                        <form action={requestAdminAction}>
                            <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                            />
                            <input
                                type="hidden"
                                name="email"
                                value={user.email}
                            />
                            <Button
                                variant="outline"
                                type="submit"
                                disabled={
                                    userAdminRequest?.status === "pending"
                                }
                            >
                                Request Admin Access
                            </Button>
                        </form>

                        {userAdminRequest && (
                            <div className="flex flex-col gap-2 w-full max-w-md text-sm mt-2">
                                {userAdminRequest.status === "pending" && (
                                    <div className="text-yellow-700 border-l-2 border-yellow-700 px-4">
                                        Your admin request is pending approval
                                    </div>
                                )}
                                {userAdminRequest.status === "approved" && (
                                    <div className="text-green-700 border-l-2 border-green-700 px-4">
                                        Your admin request has been approved
                                    </div>
                                )}
                                {userAdminRequest.status === "rejected" && (
                                    <div className="text-red-700 border-l-2 border-red-700 px-4">
                                        Your admin request was rejected
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Requests Management (only for main admin) */}
            {isMainAdmin && adminRequests && adminRequests?.length > 0 && (
                <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">
                        Pending Admin Requests
                    </h2>
                    <div className="space-y-4">
                        {adminRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex flex-wrap items-center justify-between p-4 border rounded gap-2"
                            >
                                <div className="mr-6">{request.user_email}</div>
                                <div className="space-x-2">
                                    <form
                                        action={approveAdminRequestAction}
                                        className="inline"
                                    >
                                        <input
                                            type="hidden"
                                            name="requestId"
                                            value={request.id}
                                        />
                                        <Button type="submit" variant="default">
                                            Approve
                                        </Button>
                                    </form>
                                    <form
                                        action={rejectAdminRequestAction}
                                        className="inline"
                                    >
                                        <input
                                            type="hidden"
                                            name="requestId"
                                            value={request.id}
                                        />
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                        >
                                            Reject
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Course Creation (only for admins) */}
            {(isAdmin || isMainAdmin) && (
                <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">
                        Create Course
                    </h2>
                    <form action={createCourseAction} className="space-y-4">
                        <div>
                            <Label htmlFor="courseCode">Course Code</Label>
                            <Input
                                id="courseCode"
                                name="courseCode"
                                placeholder="e.g., CS 2200"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="courseName">Course Name</Label>
                            <Input
                                id="courseName"
                                name="courseName"
                                placeholder="e.g., Systems and Networks"
                                required
                            />
                        </div>

                        <Button variant="outline" type="submit">
                            Create Course
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
