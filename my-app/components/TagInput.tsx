import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder?: string;
}

export function TagInput({
    tags,
    setTags,
    placeholder = "Add tags...",
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue("");
        } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="border rounded-md p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            {tags.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                >
                    {tag}
                    <X
                        size={14}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                    />
                </Badge>
            ))}
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-7"
            />
        </div>
    );
}
