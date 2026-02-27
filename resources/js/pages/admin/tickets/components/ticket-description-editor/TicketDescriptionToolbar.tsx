import type { Editor } from '@tiptap/react';
import { AtSign, Bold, Italic, List, UserRound, Underline } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { HeadingOption } from './types';

type TicketDescriptionToolbarProps = {
    editor: Editor | null;
    activeHeading: HeadingOption;
    activeInlineState: {
        bold: boolean;
        italic: boolean;
        underline: boolean;
        bulletList: boolean;
    };
    executeCommand: (command: () => void) => void;
};

export function TicketDescriptionToolbar({
    editor,
    activeHeading,
    activeInlineState,
    executeCommand,
}: TicketDescriptionToolbarProps) {
    return (
        <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            <ToolbarButton
                label="Bold"
                icon={<Bold className="size-3.5" />}
                isActive={activeInlineState.bold}
                onClick={() => {
                    executeCommand(() => {
                        editor?.chain().focus().toggleBold().run();
                    });
                }}
            />
            <ToolbarButton
                label="Italic"
                icon={<Italic className="size-3.5" />}
                isActive={activeInlineState.italic}
                onClick={() => {
                    executeCommand(() => {
                        editor?.chain().focus().toggleItalic().run();
                    });
                }}
            />
            <ToolbarButton
                label="Underline"
                icon={<Underline className="size-3.5" />}
                isActive={activeInlineState.underline}
                onClick={() => {
                    executeCommand(() => {
                        editor?.chain().focus().toggleUnderline().run();
                    });
                }}
            />
            <ToolbarButton
                label="Bullet list"
                icon={<List className="size-3.5" />}
                isActive={activeInlineState.bulletList}
                onClick={() => {
                    executeCommand(() => {
                        editor?.chain().focus().toggleBulletList().run();
                    });
                }}
            />

            <Select
                value={activeHeading}
                onValueChange={(value) => {
                    executeCommand(() => {
                        if (editor === null) {
                            return;
                        }

                        if (value === 'p') {
                            editor.chain().focus().setParagraph().run();
                            return;
                        }

                        const level = Number.parseInt(
                            value.replace('h', ''),
                            10,
                        ) as 1 | 2 | 3;

                        editor.chain().focus().toggleHeading({ level }).run();
                    });
                }}
            >
                <SelectTrigger className="h-7 w-[8.625rem] border-zinc-800 bg-zinc-900/70 px-2 text-xs text-zinc-300">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                    <SelectItem value="p">Paragraph</SelectItem>
                    <SelectItem value="h1">Heading 1</SelectItem>
                    <SelectItem value="h2">Heading 2</SelectItem>
                    <SelectItem value="h3">Heading 3</SelectItem>
                </SelectContent>
            </Select>

            <div className="ml-auto inline-flex items-center gap-2 text-[0.6875rem] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                    <AtSign className="size-3" /> Mention admin
                </span>
                <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3" /> /user athlete|coach
                </span>
            </div>
        </div>
    );
}

type ToolbarButtonProps = {
    label: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
};

function ToolbarButton({ label, icon, isActive, onClick }: ToolbarButtonProps) {
    return (
        <Toggle
            variant="outline"
            size="sm"
            className={cn(
                'h-7 w-7 border-zinc-800 bg-zinc-900/60 p-0',
                isActive
                    ? 'border-zinc-600 bg-zinc-700/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
            )}
            onMouseDown={(event) => {
                event.preventDefault();
                onClick();
            }}
            aria-label={label}
            aria-pressed={isActive}
            pressed={isActive}
        >
            {icon}
        </Toggle>
    );
}
