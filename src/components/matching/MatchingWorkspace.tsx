'use client';

import { useState } from 'react';
import { Loader2, Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import type { Profile, UserTier } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface MatchingWorkspaceProps {
    userId: string;
    tier: UserTier;
    profile: Partial<Profile> | null;
}

function safeStringify(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export function MatchingWorkspace({ userId, tier, profile }: MatchingWorkspaceProps) {
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<string>('');

    async function submitToN8n(selectedFile?: File | null) {
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        setWaitingMessage('Veriler n8n webhook’una gönderiliyor...');

        try {
            const fileToUse = selectedFile ?? cvFile;
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('request_id', crypto.randomUUID());
            formData.append('profile_json', JSON.stringify(profile ?? {}));
            if (note.trim()) {
                formData.append('cv_text', note.trim());
            }
            if (fileToUse) {
                formData.append('cv_pdf', fileToUse, fileToUse.name || 'cv.pdf');
            }

            setWaitingMessage('n8n yanıtı bekleniyor...');
            const response = await fetch('/api/matching/v2', {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            const parsed = (() => {
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            })();

            setRawResponse(safeStringify(parsed));

            if (!response.ok) {
                const error = typeof parsed === 'object' && parsed && 'error' in parsed
                    ? String((parsed as { error?: unknown }).error ?? 'İstek başarısız')
                    : `HTTP ${response.status}`;
                throw new Error(error);
            }

            setSuccessMessage('İstek başarılı. n8n yanıtı alındı.');
            setWaitingMessage(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
            setErrorMessage(message);
            setWaitingMessage(null);
        } finally {
            setIsLoading(false);
        }
    }

    function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setCvFile(file);
        if (file && !isLoading) {
            void submitToN8n(file);
        }
    }

    return (
        <div className="container max-w-container mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Matching</h1>
                    <p className="text-muted-foreground mt-1">PDF veya profil verisini n8n webhook’una gönder ve geleni direkt görüntüle.</p>
                </div>
                <Badge variant="secondary">Tier: {tier}</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Gönderim</CardTitle>
                        <CardDescription>PDF seçince otomatik gönderilir. İstersen not ekleyebilirsin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cv_pdf">CV PDF</Label>
                            <Input id="cv_pdf" type="file" accept="application/pdf" onChange={onFileChange} />
                            <p className="text-xs text-muted-foreground">
                                {cvFile ? `${cvFile.name} (${Math.ceil(cvFile.size / 1024)} KB)` : 'Dosya seçilmedi'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Ek Not (opsiyonel)</Label>
                            <Textarea
                                id="note"
                                rows={5}
                                placeholder="n8n'e eklenecek opsiyonel metin"
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                            />
                        </div>

                        <Button className="w-full" onClick={() => void submitToN8n()} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    n8n&apos;e gönder
                                </>
                            )}
                        </Button>

                        {waitingMessage && (
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                                {waitingMessage}
                            </div>
                        )}

                        {errorMessage && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                <span>{successMessage}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>n8n Yanıtı</CardTitle>
                        <CardDescription>Webhook&apos;tan gelen ham cevap.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!rawResponse ? (
                            <div className="rounded-lg border border-dashed border-border p-8 text-center">
                                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Henüz yanıt yok.</p>
                            </div>
                        ) : (
                            <pre className="rounded-lg border bg-muted/40 p-4 text-xs overflow-auto max-h-[540px] whitespace-pre-wrap break-words">
                                {rawResponse}
                            </pre>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
