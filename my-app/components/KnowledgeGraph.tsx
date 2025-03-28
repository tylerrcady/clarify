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
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
        null
    );
    const [selectedThreads, setSelectedThreads] = useState<Thread[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [graphType, setGraphType] = useState<"force" | "bubble">("force");
    const [graphData, setGraphData] = useState<any>(null);

    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            const currentTransform = d3.zoomTransform(svgRef.current);
            const newScale = currentTransform.k * 1.2;
            d3.select(svgRef.current)
                .transition()
                .call(zoomRef.current.scaleTo, newScale);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            const currentTransform = d3.zoomTransform(svgRef.current);
            const newScale = currentTransform.k / 1.2;
            d3.select(svgRef.current)
                .transition()
                .call(zoomRef.current.scaleTo, Math.max(0.1, newScale));
        }
    };

    const handleResetZoom = () => {
        if (svgRef.current && zoomRef.current) {
            const svgElement = svgRef.current;
            const width = svgElement.clientWidth;
            const height = svgElement.clientHeight;

            d3.select(svgElement)
                .transition()
                .call(
                    zoomRef.current.transform,
                    d3.zoomIdentity.translate(0, 0).scale(1)
                );

            if (graphType === "force") {
                const simulation = d3
                    .forceSimulation()
                    .force("center", d3.forceCenter(width / 2, height / 2));
                simulation.alpha(1).restart();
            }
        }
    };

    const toggleGraphType = () => {
        setGraphType(graphType === "force" ? "bubble" : "force");
    };

    const renderForceDirectedGraph = (data: any) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const nodeCount = data.nodes.length;
        // const linkCount = data.links.length;

        const estimatedWidth = Math.max(width, nodeCount * 5);
        const estimatedHeight = Math.max(height, nodeCount * 5);

        const padding = 20;

        const svg = d3
            .select(svgRef.current)
            .attr(
                "viewBox",
                `${-padding} ${-padding} ${estimatedWidth + 2 * padding} ${
                    estimatedHeight + 2 * padding
                }`
            )
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g");

        const simulation = d3
            .forceSimulation(data.nodes)
            .force(
                "link",
                d3
                    .forceLink(data.links)
                    .id((d: any) => d.id)
                    .distance((d) => 100 * (1 - (d as any).value))
            )
            .force("charge", d3.forceManyBody().strength(-200))
            .force(
                "center",
                d3.forceCenter(estimatedWidth / 2, estimatedHeight / 2)
            )
            .force("x", d3.forceX(estimatedWidth / 2).strength(0.3))
            .force("y", d3.forceY(estimatedHeight / 2).strength(0.3));

        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);
        zoomRef.current = zoom;

        const links = g
            .append("g")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);

        const nodes = g
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
                d3.select(this).attr("fill", "#3498db").attr("stroke", "none");
            })
            .on("click", (event, d: any) => {
                setSelectedThreads(d.threads);
                setIsModalOpen(true);
                event.stopPropagation();
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
                .attr("x1", (d: any) => (d.source as any).x)
                .attr("y1", (d: any) => (d.source as any).y)
                .attr("x2", (d: any) => (d.target as any).x)
                .attr("y2", (d: any) => (d.target as any).y);

            nodes.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
        });
    };

    const renderBubbleChart = (data: any) => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const svg = d3
            .select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g");

        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);
        zoomRef.current = zoom;

        const bubbleData = {
            children: data.nodes.map((node: any) => ({
                ...node,
                value: node.size * 100, // scale up for better visibility
            })),
        };

        const pack = d3.pack().size([width, height]).padding(3); // pack for layout

        const root = d3
            .hierarchy<{ children: any }>(bubbleData as { children: any })
            .sum((d: any) => d.value)
            .sort((a: any, b: any) => b.value - a.value);

        const bubbleNodes = pack(root as d3.HierarchyNode<unknown>).leaves();

        const color = d3
            .scaleLinear<string>()
            .domain([0, d3.max(bubbleNodes, (d: any) => d.value) || 100])
            .range(["#a8d8ea", "#3498db"]);

        const bubbles = g
            .selectAll("circle")
            .data(bubbleNodes)
            .enter()
            .append("g")
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

        bubbles
            .append("circle")
            .attr("r", (d: any) => d.r)
            .attr("fill", (d: any) => color(d.value))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("cursor", "pointer")
            .on("mouseover", function () {
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
            })
            .on("click", (event, d: any) => {
                setSelectedThreads(d.data.threads);
                setIsModalOpen(true);
                event.stopPropagation();
            });

        bubbles
            .append("title")
            .text(
                (d: any) =>
                    `${d.data.threads.length} thread${d.data.threads.length > 1 ? "s" : ""}:\n${d.data.threads.map((t: any) => t.title).join("\n")}`
            );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `/api/knowledge-graph?courseId=${courseId}`
                );
                const data = await response.json();
                setGraphData(data);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching knowledge graph data:", error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    useEffect(() => {
        if (!graphData) return;

        const handleResize = () => {
            if (graphType === "force") {
                renderForceDirectedGraph(graphData);
            } else {
                renderBubbleChart(graphData);
            }
        };

        if (graphType === "force") {
            renderForceDirectedGraph(graphData);
        } else {
            renderBubbleChart(graphData);
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [graphData, graphType]);

    const drag = (simulation: any) => {
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
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
            {/* Zoom controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                <button
                    onClick={handleZoomIn}
                    className="p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Zoom Out"
                >
                    -
                </button>
                <button
                    onClick={handleResetZoom}
                    className="p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Reset Zoom"
                >
                    reset
                </button>
                <button
                    onClick={toggleGraphType}
                    className="p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Toggle Graph Type"
                >
                    {graphType === "force" ? "bubble" : "force"}
                </button>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
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
