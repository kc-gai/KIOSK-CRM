import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "destructive"
    size?: "default" | "sm" | "xs" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants = {
            default: "btn btn-primary",
            outline: "btn btn-outline-secondary",
            ghost: "btn btn-ghost-secondary",
            destructive: "btn btn-danger",
        }
        const sizes = {
            default: "",
            sm: "btn-sm",
            xs: "btn-sm",
            lg: "btn-lg",
        }

        return (
            <button
                className={cn(
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
