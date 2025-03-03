"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
    pendingText?: string;
};

export function CreateButton({
    children,
    pendingText = "Creating...",
    ...props
}: Props) {
    const { pending } = useFormStatus();

    return (
        <Button variant="outline" disabled={pending} {...props}>
            {pending ? pendingText : children}
        </Button>
    );
}
