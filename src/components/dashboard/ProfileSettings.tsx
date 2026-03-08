'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Mail, MapPin, User } from 'lucide-react';
import type { Profile, ProfileFormValues } from '@/types/profile';
import { mapFormValuesToProfileUpdate, mapProfileToFormValues } from '@/types/profile';

interface ProfileSettingsProps {
    user: {
        id: string;
        email?: string | null;
    };
    profile: Profile | null;
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ProfileFormValues>(() => mapProfileToFormValues(profile));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggleChange = (name: 'remote_preferito' | 'notification_email', checked: boolean) => {
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updatePayload = mapFormValuesToProfileUpdate(formData);
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...updatePayload,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profilo aggiornato con successo');
            router.refresh(); // Refresh the page to reflect updated server data
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Si è verificato un errore durante l\'aggiornamento');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-border shadow-sm">
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle className="text-xl">Impostazioni Profilo</CardTitle>
                    <CardDescription>
                        Aggiorna il tuo profilo per migliorare raccomandazioni e matching.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={user.email ?? ''}
                            disabled
                            className="bg-muted text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                            L'email è associata al tuo account Google e non può essere modificata qui.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                Nome
                            </Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Il tuo nome"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name" className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                Cognome
                            </Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Il tuo cognome"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="regione_interesse" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                Regione principale
                            </Label>
                            <Input
                                id="regione_interesse"
                                name="regione_interesse"
                                value={formData.regione_interesse}
                                onChange={handleChange}
                                placeholder="Es. Lombardia"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provincia_interesse" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                Provincia
                            </Label>
                            <Input
                                id="provincia_interesse"
                                name="provincia_interesse"
                                value={formData.provincia_interesse}
                                onChange={handleChange}
                                placeholder="Es. Milano, Roma, Napoli"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profilo_professionale" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            Profilo professionale
                        </Label>
                        <Textarea
                            id="profilo_professionale"
                            name="profilo_professionale"
                            value={formData.profilo_professionale}
                            onChange={handleTextareaChange}
                            placeholder="Descrivi in breve il tuo profilo, ruolo attuale e obiettivi."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="titolo_studio">Titolo di studio</Label>
                            <Input
                                id="titolo_studio"
                                name="titolo_studio"
                                value={formData.titolo_studio}
                                onChange={handleChange}
                                placeholder="Es. Laurea Magistrale"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="anni_esperienza">Anni di esperienza</Label>
                            <Input
                                id="anni_esperienza"
                                name="anni_esperienza"
                                type="number"
                                min={0}
                                value={formData.anni_esperienza}
                                onChange={handleChange}
                                placeholder="Es. 3"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="settori_interesse">Settori di interesse</Label>
                            <Input
                                id="settori_interesse"
                                name="settori_interesse"
                                value={formData.settori_interesse}
                                onChange={handleChange}
                                placeholder="Es. Amministrativo, Sanitario, IT"
                            />
                            <p className="text-xs text-muted-foreground">
                                Separa i settori con una virgola.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sede_preferita">Sede preferita</Label>
                            <Input
                                id="sede_preferita"
                                name="sede_preferita"
                                value={formData.sede_preferita}
                                onChange={handleChange}
                                placeholder="Es. Milano o remoto"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 rounded-md border p-3">
                            <Checkbox
                                id="remote_preferito"
                                checked={formData.remote_preferito}
                                onCheckedChange={(checked) => handleToggleChange('remote_preferito', checked === true)}
                            />
                            <Label htmlFor="remote_preferito" className="cursor-pointer">
                                Preferisco posizioni remote
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-3">
                            <Checkbox
                                id="notification_email"
                                checked={formData.notification_email}
                                onCheckedChange={(checked) => handleToggleChange('notification_email', checked === true)}
                            />
                            <Label htmlFor="notification_email" className="cursor-pointer">
                                Notifiche email attive
                            </Label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
