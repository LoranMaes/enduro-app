import {
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type SessionHeaderProps = {
    title: string;
    description: string;
};

export function SessionHeader({ title, description }: SessionHeaderProps) {
    return (
        <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="font-sans text-base font-medium text-white">
                {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
                {description}
            </DialogDescription>
        </DialogHeader>
    );
}
