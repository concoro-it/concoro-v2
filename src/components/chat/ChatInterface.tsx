'use client';

import { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/lib/utils/cn';

interface ChatInterfaceProps {
    className?: string;
    concorsoId?: string; // Optional context for the AI
}

export function ChatInterface({ className, concorsoId }: ChatInterfaceProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
        api: '/api/chat',
        body: {
            concorsoId,
        },
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: "Ciao! Sono Genio, il tuo assistente AI per i concorsi pubblici. Posso aiutarti a trovare bandi adatti a te, spiegarti requisiti complessi o darti suggerimenti su come prepararti. Come posso aiutarti oggi?"
            }
        ]
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Submit form on Enter (without Shift)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                formRef.current?.requestSubmit();
            }
        }
    };

    return (
        <div className={cn("flex flex-col h-[600px] max-h-[80vh] border rounded-xl overflow-hidden bg-white shadow-sm", className)}>
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b bg-muted/40 text-foreground shrink-0">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Genio AI
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        Beta
                    </span>
                </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-8 scroll-smooth">
                {messages.map((message: Message) => (
                    <ChatMessage
                        key={message.id}
                        role={message.role as 'user' | 'assistant'}
                        content={message.content}
                    />
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 w-fit ml-12">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Genio sta scrivendo...
                    </div>
                )}

                {error && (
                    <div className="p-4 mx-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                        Si è verificato un errore di comunicazione con il server. Riprova più tardi.
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t shrink-0">
                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="relative flex items-end gap-2 bg-muted/30 rounded-lg border border-border focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all p-1"
                >
                    <Textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Fai una domanda a Genio..."
                        className="min-h-[50px] max-h-[150px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none py-3 px-3 scrollbar-thin"
                        rows={1}
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-2">
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "h-9 w-9 rounded-md transition-all shrink-0",
                                input.trim() ? "bg-blue-600 text-white shadow-sm" : "bg-muted text-muted-foreground"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            <span className="sr-only">Invia messaggio</span>
                        </Button>
                    </div>
                </form>
                <div className="mt-2 text-center">
                    <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                        Premi <kbd className="font-sans border bg-muted px-1 rounded text-foreground text-[10px]">Invio</kbd> per inviare o <kbd className="font-sans border bg-muted px-1 rounded text-foreground text-[10px]">Maiusc</kbd> + <kbd className="font-sans border bg-muted px-1 rounded text-foreground text-[10px]">Invio</kbd> per andare a capo
                    </p>
                </div>
            </div>
        </div>
    );
}
