import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-lg mb-8">This page could not be found.</p>
            <Link href="/">
                <Button>Go back home</Button>
            </Link>
        </div>
    );
}
