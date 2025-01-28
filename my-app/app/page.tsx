import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
    return (
        <main className="flex-1 flex flex-col items-center">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                            Welcome to Clarify
                        </h1>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-300">
                            Revolutionizing educational forums with AI-powered
                            organization and seamless collaboration for academic
                            communities.
                        </p>
                        <div className="space-x-4">
                            <Link href="/sign-up">
                                <Button className="px-8">Get Started</Button>
                            </Link>
                            <Link href="/sign-in">
                                <Button variant="outline" className="px-8">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Key Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold mb-2">
                                Smart Organization
                            </h3>
                            <p className="text-gray-500 dark:text-gray-300">
                                AI-powered thread organization and semantic
                                search capabilities
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold mb-2">
                                AI Summaries
                            </h3>
                            <p className="text-gray-500 dark:text-gray-300">
                                Automatic thread summaries powered by OpenAI for
                                quick comprehension
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                            <h3 className="text-xl font-bold mb-2">
                                Knowledge Graphs
                            </h3>
                            <p className="text-gray-500 dark:text-gray-300">
                                Visual relationship mapping between topics and
                                discussions
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center dark:text-black">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">
                                        Easy Course Setup
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-300">
                                        Instructors can create courses and
                                        import rosters directly from Canvas
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center dark:text-black">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">
                                        Seamless Discussion
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-300">
                                        Students can easily participate in
                                        discussions with automatic organization
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center dark:text-black">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2">
                                        AI-Enhanced Learning
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-300">
                                        Get instant summaries and related
                                        content suggestions
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted p-6 rounded-lg">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-300">
                                Platform Preview Coming Soon
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-primary">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center text-white">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl dark:text-black">
                            Ready to Transform Your Academic Discussions?
                        </h2>
                        <p className="mx-auto max-w-[600px] text-white/80 dark:text-black">
                            Join Clarify today and experience the future of
                            educational forums.
                        </p>
                        <Link href="/sign-up">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="mt-4"
                            >
                                Get Started Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
