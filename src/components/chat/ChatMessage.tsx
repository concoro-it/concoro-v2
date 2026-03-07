import { cn } from '@/lib/utils/cn';
import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
    const isAssistant = role === 'assistant';

    return (
        <div
            className={cn(
                'flex w-full gap-4 p-4 md:p-6 rounded-xl',
                isAssistant ? 'bg-muted/30' : 'bg-white'
            )}
        >
            <div
                className={cn(
                    'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
                    isAssistant
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent'
                        : 'bg-background border-border text-slate-600'
                )}
            >
                {isAssistant ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="flex-1 space-y-2 overflow-hidden px-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                        {isAssistant ? 'Genio' : 'Tu'}
                    </span>
                </div>
                <div className="prose prose-sm prose-slate max-w-none break-words leading-relaxed dark:prose-invert">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
