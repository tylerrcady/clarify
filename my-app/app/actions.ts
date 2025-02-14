"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    if (!email || !password) {
        return encodedRedirect(
            "error",
            "/sign-up",
            "Email and password are required"
        );
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error(error.code + " " + error.message);
        return encodedRedirect("error", "/sign-up", error.message);
    } else {
        return encodedRedirect(
            "success",
            "/sign-up",
            "Thanks for signing up! Please check your email for a verification link."
        );
    }
};

export const signInAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return encodedRedirect("error", "/sign-in", error.message);
    }

    return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    const callbackUrl = formData.get("callbackUrl")?.toString();

    if (!email) {
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Email is required"
        );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
        console.error(error.message);
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Could not reset password"
        );
    }

    if (callbackUrl) {
        return redirect(callbackUrl);
    }

    return encodedRedirect(
        "success",
        "/forgot-password",
        "Check your email for a link to reset your password."
    );
};

export const resetPasswordAction = async (formData: FormData) => {
    const supabase = await createClient();

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password and confirm password are required"
        );
    }

    if (password !== confirmPassword) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Passwords do not match"
        );
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password update failed"
        );
    }

    encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/sign-in");
};

export const requestAdminAction = async (formData: FormData) => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return encodedRedirect("error", "/settings", "Not authenticated");
    }

    const { error } = await supabase.from("admin_requests").insert({
        user_id: user.id,
        user_email: user.email,
        status: "pending",
    });

    if (error) {
        return encodedRedirect(
            "error",
            "/settings",
            "Failed to submit admin request"
        );
    }
    return encodedRedirect("success", "/settings", "Admin request submitted");
};

export const approveAdminRequestAction = async (formData: FormData) => {
    const supabase = await createClient();
    const requestId = formData.get("requestId")?.toString();

    // First get the request details
    const { data: request, error: requestError } = await supabase
        .from("admin_requests")
        .select("user_id")
        .eq("id", requestId)
        .single();

    if (requestError || !request) {
        return encodedRedirect("error", "/settings", "Request not found");
    }

    // Update user profile to admin
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", request.user_id);

    if (profileError) {
        return encodedRedirect(
            "error",
            "/settings",
            "Failed to update admin status"
        );
    }

    // Update request status
    const { error: requestUpdateError } = await supabase
        .from("admin_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

    if (requestUpdateError) {
        return encodedRedirect(
            "error",
            "/settings",
            "Failed to update request status"
        );
    }

    return encodedRedirect("success", "/settings", "Admin request approved");
};

export const rejectAdminRequestAction = async (formData: FormData) => {
    const supabase = await createClient();
    const requestId = formData.get("requestId")?.toString();

    const { error } = await supabase
        .from("admin_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

    if (error) {
        return encodedRedirect(
            "error",
            "/settings",
            "Failed to reject request"
        );
    }
    return encodedRedirect("success", "/settings", "Admin request rejected");
};

export const createCourseAction = async (formData: FormData) => {
    const supabase = await createClient();
    const courseCode = formData.get("courseCode")?.toString();
    const courseName = formData.get("courseName")?.toString();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return encodedRedirect("error", "/settings", "Not authenticated");
    }

    // Create the course
    const { data: course, error } = await supabase
        .from("courses")
        .insert({
            code: courseCode,
            name: courseName,
            creator_id: user.id,
        })
        .select()
        .single();

    if (error) {
        return encodedRedirect("error", "/settings", "Failed to create course");
    }

    // Add creator to course_enrollments
    const { error: enrollmentError } = await supabase
        .from("course_enrollments")
        .insert({
            email: user.email,
            course_id: course.id,
            role: "Creator",
        });

    if (enrollmentError) {
        return encodedRedirect(
            "error",
            "/settings",
            "Failed to set course creator"
        );
    }

    return encodedRedirect(
        "success",
        "/protected",
        "Course created successfully"
    );
};
