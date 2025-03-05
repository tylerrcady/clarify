import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/utils/search";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.nextUrl);
        const pathSegments = url.pathname.split("/");
        const threadId = pathSegments[pathSegments.indexOf("threads") + 1];

        const supabase = await createClient();

        const { data: comments, error } = await supabase.rpc(
            "get_comments_with_anonymous_names_and_replies",
            {
                thread_id_param: threadId,
            }
        );

        if (error) {
            console.error("Error fetching comments:", error);
            return NextResponse.json(
                { error: "Failed to fetch comments" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comments }, { status: 200 });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function getRandomName(usedNames: string[]): string {
    const adjectives = [
        "Quick",
        "Lazy",
        "Sleepy",
        "Noisy",
        "Hungry",
        "Brave",
        "Calm",
        "Eager",
        "Fancy",
        "Glamorous",
        "Jolly",
        "Kind",
        "Lively",
        "Mighty",
        "Nice",
        "Proud",
        "Silly",
        "Witty",
        "Zealous",
        "Bright",
        "Clever",
        "Daring",
        "Energetic",
        "Fierce",
        "Gentle",
        "Happy",
        "Inventive",
        "Joyful",
        "Keen",
        "Lucky",
        "Mysterious",
        "Noble",
        "Optimistic",
        "Playful",
        "Quiet",
        "Radiant",
        "Strong",
        "Thoughtful",
        "Unique",
        "Vibrant",
        "Wise",
        "Youthful",
        "Zany",
    ];
    const animals = [
        "Fox",
        "Dog",
        "Cat",
        "Mouse",
        "Bear",
        "Lion",
        "Tiger",
        "Wolf",
        "Eagle",
        "Hawk",
        "Shark",
        "Whale",
        "Dolphin",
        "Panda",
        "Koala",
        "Leopard",
        "Cheetah",
        "Giraffe",
        "Elephant",
        "Zebra",
        "Kangaroo",
        "Otter",
        "Raccoon",
        "Squirrel",
        "Rabbit",
        "Frog",
        "Turtle",
        "Lizard",
        "Snake",
        "Owl",
        "Falcon",
        "Parrot",
        "Penguin",
        "Seal",
        "Walrus",
        "Buffalo",
        "Bison",
        "Moose",
        "Deer",
        "Antelope",
        "Goat",
        "Sheep",
        "Cow",
        "Horse",
        "Donkey",
        "Camel",
        "Hippo",
        "Rhino",
        "Bat",
        "Beaver",
        "Chimpanzee",
        "Gorilla",
        "Orangutan",
        "Baboon",
        "Lemur",
        "Meerkat",
        "Mongoose",
        "Porcupine",
        "Hedgehog",
        "Armadillo",
        "Sloth",
        "Anteater",
        "Aardvark",
    ];

    let name;
    do {
        const adjective =
            adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        name = `${adjective}${animal}`;
    } while (usedNames.includes(name));

    return name;
}

export async function POST(request: NextRequest) {
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

        const { content, parentId } = await request.json();

        const { data: thread } = await supabase
            .from("threads")
            .select("course_id")
            .eq("id", threadId)
            .single();

        const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("courses")
            .eq("email", user.email)
            .single();

        if (!enrollment) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!thread) {
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404 }
            );
        }

        const courseEnrollment = enrollment.courses.find(
            (c: { courseId: string }) => c.courseId === thread.course_id
        );

        if (!courseEnrollment) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (parentId) {
            const { data: parentComment, error: parentError } = await supabase
                .from("comments")
                .select("id")
                .eq("id", parentId)
                .eq("thread_id", threadId)
                .single();

            if (parentError || !parentComment) {
                return NextResponse.json(
                    { error: "Parent comment not found" },
                    { status: 404 }
                );
            }
        }

        const { data: existingName } = await supabase
            .from("thread_anonymous_names")
            .select("anonymous_name")
            .eq("thread_id", threadId)
            .eq("user_id", user.id)
            .single();

        if (!existingName) {
            const { data: usedNames } = await supabase
                .from("thread_anonymous_names")
                .select("anonymous_name")
                .eq("thread_id", threadId);

            const newName = getRandomName(
                (usedNames ?? []).map((n) => n.anonymous_name)
            );

            await supabase.from("thread_anonymous_names").insert({
                thread_id: threadId,
                user_id: user.id,
                anonymous_name: newName,
            });
        }

        const embedding = await generateEmbedding(content);

        const { data: comment, error } = await supabase
            .from("comments")
            .insert({
                thread_id: threadId,
                content,
                creator_id: user.id,
                creator_role: courseEnrollment.role,
                parent_id: parentId || null,
                embedding,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to create comment" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
