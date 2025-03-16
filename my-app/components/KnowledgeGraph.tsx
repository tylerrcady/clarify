"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Link from "next/link";

interface Thread {
    id: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    creator_role: string;
}

interface KnowledgeGraphProps {
    courseId: string;
}

export default function KnowledgeGraph({ courseId }: KnowledgeGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedThreads, setSelectedThreads] = useState<Thread[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndRenderGraph = async () => {
            try {
                const response = await fetch(
                    `/api/knowledge-graph?courseId=${courseId}`
                );
                const data = await response.json();

                if (!svgRef.current) return;

                d3.select(svgRef.current).selectAll("*").remove();

                const width = svgRef.current.clientWidth;
                const height = svgRef.current.clientHeight;

                const svg = d3
                    .select(svgRef.current)
                    .attr("width", width)
                    .attr("height", height);

                const simulation = d3
                    .forceSimulation(data.nodes)
                    .force(
                        "link",
                        d3
                            .forceLink(data.links)
                            .id((d: any) => d.id)
                            .distance((d) => 100 * (1 - (d as any).value))
                    )
                    .force("charge", d3.forceManyBody().strength(-100))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .force("x", d3.forceX(width / 2).strength(0.1))
                    .force("y", d3.forceY(height / 2).strength(0.1));

                const links = svg
                    .append("g")
                    .selectAll("line")
                    .data(data.links)
                    .enter()
                    .append("line")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);

                const nodes = svg
                    .append("g")
                    .selectAll("circle")
                    .data(data.nodes)
                    .enter()
                    .append("circle")
                    .attr("r", (d: any) => Math.sqrt(d.size) * 10)
                    .attr("fill", "#3498db")
                    .attr("cursor", "pointer")
                    .on("mouseover", function () {
                        d3.select(this)
                            .attr("fill", "#2980b9")
                            .attr("stroke", "#000")
                            .attr("stroke-width", 2);
                    })
                    .on("mouseout", function () {
                        d3.select(this)
                            .attr("fill", "#3498db")
                            .attr("stroke", "none");
                    })
                    .on("click", (_, d: any) => {
                        setSelectedThreads(d.threads);
                        setIsModalOpen(true);
                    })
                    .call(drag(simulation) as any);

                nodes
                    .append("title")
                    .text(
                        (d: any) =>
                            `${d.threads.length} thread${d.threads.length > 1 ? "s" : ""}:\n${d.threads.map((t: any) => t.title).join("\n")}`
                    );

                simulation.on("tick", () => {
                    links
                        .attr("x1", (d: any) =>
                            Math.max(0, Math.min(width, (d.source as any).x))
                        )
                        .attr("y1", (d: any) =>
                            Math.max(0, Math.min(height, (d.source as any).y))
                        )
                        .attr("x2", (d: any) =>
                            Math.max(0, Math.min(width, (d.target as any).x))
                        )
                        .attr("y2", (d: any) =>
                            Math.max(0, Math.min(height, (d.target as any).y))
                        );

                    nodes
                        .attr("cx", (d: any) =>
                            Math.max(0, Math.min(width, d.x))
                        )
                        .attr("cy", (d: any) =>
                            Math.max(0, Math.min(height, d.y))
                        );
                });

                setIsLoading(false);

                const handleResize = () => {
                    const newWidth = svgRef.current?.clientWidth || 0;
                    const newHeight = svgRef.current?.clientHeight || 0;
                    svg.attr("width", newWidth).attr("height", newHeight);
                    simulation
                        .force(
                            "center",
                            d3.forceCenter(newWidth / 2, newHeight / 2)
                        )
                        .force("x", d3.forceX(newWidth / 2).strength(0.1))
                        .force("y", d3.forceY(newHeight / 2).strength(0.1))
                        .alpha(1)
                        .restart();

                    simulation.on("tick", () => {
                        links
                            .attr("x1", (d: any) =>
                                Math.max(
                                    0,
                                    Math.min(newWidth, (d.source as any).x)
                                )
                            )
                            .attr("y1", (d: any) =>
                                Math.max(
                                    0,
                                    Math.min(newHeight, (d.source as any).y)
                                )
                            )
                            .attr("x2", (d: any) =>
                                Math.max(
                                    0,
                                    Math.min(newWidth, (d.target as any).x)
                                )
                            )
                            .attr("y2", (d: any) =>
                                Math.max(
                                    0,
                                    Math.min(newHeight, (d.target as any).y)
                                )
                            );

                        nodes
                            .attr("cx", (d: any) =>
                                Math.max(0, Math.min(newWidth, d.x))
                            )
                            .attr("cy", (d: any) =>
                                Math.max(0, Math.min(newHeight, d.y))
                            );
                    });
                };

                window.addEventListener("resize", handleResize);

                return () => {
                    window.removeEventListener("resize", handleResize);
                };
            } catch (error) {
                console.error("Error fetching knowledge graph data:", error);
                setIsLoading(false);
            }
        };

        fetchAndRenderGraph();
    }, [courseId]);

    const drag = (simulation: any) => {
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            if (svgRef.current) {
                event.subject.fx = Math.max(
                    0,
                    Math.min(svgRef.current.clientWidth, event.x)
                );
                event.subject.fy = Math.max(
                    0,
                    Math.min(svgRef.current.clientHeight, event.y)
                );
            }
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    };

    return (
        <div className="w-full h-full relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="border-4 border-t-4 border-gray-200 border-t-black rounded-full w-10 h-10 animate-spin"></div>
                </div>
            )}
            <svg
                ref={svgRef}
                className="w-full h-full border border-gray-300 rounded-lg p-1"
            />
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold mb-4">
                                Related Threads
                            </h2>
                            {selectedThreads.map((thread) => (
                                <Link
                                    key={thread.id}
                                    href={`/courses/${courseId}/thread/${thread.id}`}
                                    className="block"
                                >
                                    <div className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-lg font-medium">
                                                {thread.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                                {thread.content}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span>
                                                    {thread.creator_role}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(
                                                        thread.created_at
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {thread.tags &&
                                                thread.tags.length > 0 && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        {thread.tags.map(
                                                            (tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
