import type { HTMLAttributes } from 'react';
import React from 'react';

import { cn } from '@/lib/utils';

type HeadingLevel = 1 | 2 | 3 | 4;

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
    level?: HeadingLevel;
};

export function Heading({
    className,
    level = 2,
    children,
    ...props
}: HeadingProps) {
    const baseStyles = 'font-sans tracking-tight text-white';

    const sizes: Record<HeadingLevel, string> = {
        1: 'text-2xl font-light',
        2: 'text-lg font-medium',
        3: 'text-base font-medium',
        4: 'text-sm font-semibold',
    };

    const headingClassName = cn(baseStyles, sizes[level], className);

    if (level === 1) {
        return (
            <h1 className={headingClassName} {...props}>
                {children}
            </h1>
        );
    }

    if (level === 3) {
        return (
            <h3 className={headingClassName} {...props}>
                {children}
            </h3>
        );
    }

    if (level === 4) {
        return (
            <h4 className={headingClassName} {...props}>
                {children}
            </h4>
        );
    }

    return (
        <h2 className={headingClassName} {...props}>
            {children}
        </h2>
    );
}

type DataValueSize = 'sm' | 'md' | 'lg' | 'xl';

type DataValueProps = HTMLAttributes<HTMLSpanElement> & {
    size?: DataValueSize;
};

export function DataValue({
    className,
    size = 'md',
    children,
    ...props
}: DataValueProps) {
    const sizes: Record<DataValueSize, string> = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-xl',
        xl: 'text-2xl',
    };

    return (
        <span
            className={cn(
                'font-mono font-light text-white',
                sizes[size],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export function Label({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'font-sans text-[0.625rem] tracking-wider text-zinc-500 uppercase',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
