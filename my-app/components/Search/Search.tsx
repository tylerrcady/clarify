"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SearchResult as SearchResultType } from "./types";
import { SearchResult } from "./SearchResult";

interface SearchProps {
    courseId?: string;
    className?: string;
}

export function SearchComponent({ courseId, className }: SearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResultType[]>([]);
    const [isLoadingC, setIsLoadingC] = useState(false);
    const [isLoadingS, setIsLoadingS] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSemanticSearch, setIsSemanticSearch] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoadingS(true);
        setError(null);
        setIsSearching(true);

        try {
            const params = new URLSearchParams({
                q: query,
                type: isSemanticSearch ? "semantic" : "fulltext",
            });
            if (courseId) params.append("courseId", courseId);

            const response = await fetch(`/api/search?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Search failed");

            setResults(data.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed");
        } finally {
            setIsLoadingS(false);
        }
    };

    const handleClear = () => {
        setIsLoadingC(true);
        setQuery("");
        setResults([]);
        setError(null);
        setIsSearching(false);
        setIsLoadingC(false);
    };

    return (
        <div className={`w-full space-y-4 ${className}`}>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <div className="relative flex-1 mb-1">
                            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search discussions..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSearch()
                                }
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isLoadingS}>
                            {isLoadingS ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Search"
                            )}
                        </Button>
                        <Button
                            onClick={handleClear}
                            disabled={isLoadingC}
                            variant="outline"
                        >
                            Clear
                        </Button>
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                        <Label
                            htmlFor="search-type-toggle"
                            className="text-sm mr-1"
                        >
                            Search Type:
                        </Label>
                        <div className="flex items-center space-x-1 gap-1">
                            <span
                                className={`cursor-pointer ${isSemanticSearch ? "text-primary" : "text-muted-foreground"}`}
                                onClick={() => setIsSemanticSearch(true)}
                            >
                                Semantic
                            </span>
                            <div className="relative mx-1">
                                <input
                                    type="checkbox"
                                    id="search-type-toggle"
                                    className="sr-only"
                                    checked={!isSemanticSearch}
                                    onChange={() => {}}
                                />
                                <div
                                    className="block w-8 h-4 rounded-full cursor-pointer bg-gray-200 dark:bg-gray-700"
                                    onClick={() =>
                                        setIsSemanticSearch(!isSemanticSearch)
                                    }
                                ></div>
                                <div
                                    className={`dot absolute left-0.5 top-0.5 w-3 h-3 rounded-full transition-transform bg-white dark:bg-gray-900 ${
                                        !isSemanticSearch
                                            ? "transform translate-x-4 bg-blue-500 dark:bg-blue-400"
                                            : ""
                                    }`}
                                ></div>
                            </div>
                            <span
                                className={`cursor-pointer ${!isSemanticSearch ? "text-primary" : "text-muted-foreground"}`}
                                onClick={() => setIsSemanticSearch(false)}
                            >
                                Full-text
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {isSearching && (
                <>
                    {isLoadingS ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center">{error}</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((result) => (
                                <SearchResult key={result.id} result={result} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            No results found
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
