import { createElement, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const paths: Record<string, string> = {
    calendar: "M6 2v3M18 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    check: "m5 12 4 4L19 6",
    chevron: "m9 18 6-6-6-6",
    close: "M18 6 6 18M6 6l12 12",
    download: "M12 3v12m0 0 5-5m-5 5-5-5M5 21h14",
    moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z",
    plus: "M12 5v14M5 12h14",
    search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4",
    sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42m11.32 0 1.42 1.42M4.92 4.92l1.42 1.42M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
    trash: "M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3",
};

export function Icon({ name }: { name: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
        <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    icon?: string;
    label?: string;
};

export function Button({ variant = "secondary", icon, label, children, className = "", ...props }: ButtonProps) {
    return createElement(
        "button",
        {
            type: "button",
            className: `button button-${variant} ${className}`,
            "aria-label": label,
            ...props,
        },
        <>
        {icon && <Icon name={icon} />}
        {children && <span>{children}</span>}
        </>,
    );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    leadingIcon?: string;
};

export function Field({ label, leadingIcon, className = "", ...props }: FieldProps) {
    return (
        <label className={`field ${className}`}>
        {label && <span className="field-label">{label}</span>}
        <span className="field-control">
        {leadingIcon && <Icon name={leadingIcon} />}
        {createElement("input", { ...props })}
        </span>
        </label>
    );
}

export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
    return (
        <label className="field">
        <span className="field-label">{label}</span>
        {createElement("textarea", { ...props })}
        </label>
    );
}
