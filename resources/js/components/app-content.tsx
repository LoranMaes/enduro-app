import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type Props = React.ComponentProps<'main'> & {
    variant?: 'header' | 'sidebar';
};

export function AppContent({ variant = 'header', children, ...props }: Props) {
    const { className, ...mainProps } = props;

    if (variant === 'sidebar') {
        return (
            <SidebarInset
                className={cn('h-svh overflow-hidden', className)}
                {...mainProps}
            >
                {children}
            </SidebarInset>
        );
    }

    return (
        <main
            className={cn(
                'mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl',
                className,
            )}
            {...mainProps}
        >
            {children}
        </main>
    );
}
