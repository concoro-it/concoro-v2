'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, MapPin } from 'lucide-react';

interface ProfileSettingsProps {
    user: any;
    profile: any;
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    // Initial state setup based on the existing profile or defaults
    const [formData, setFormData] = useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        regione_interesse: profile?.regione_interesse || '',
        provincia_interesse: profile?.provincia_interesse || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    regione_interesse: formData.regione_interesse,
                    provincia_interesse: formData.provincia_interesse,
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
                        Aggiorna le tue informazioni personali per ricevere consigli migliori.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Read-only email field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={user.email}
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
                                <User className="w-4 h-4 text-muted-foreground" /> Nome
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
                                <User className="w-4 h-4 text-muted-foreground" /> Cognome
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
                                <MapPin className="w-4 h-4 text-muted-foreground" /> Regione principale
                            </Label>
                            <Select
                                value={formData.regione_interesse}
                                onValueChange={(val) => handleSelectChange('regione_interesse', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona regione" />
                                </SelectTrigger>
                                {/* We will hardcode a few common ones or ideally fetch them. Hardcoded for MVP UI */}
                                <SelectContent>
                                    <SelectItem value="Lombardia">Lombardia</SelectItem>
                                    <SelectItem value="Lazio">Lazio</SelectItem>
                                    <SelectItem value="Campania">Campania</SelectItem>
                                    <SelectItem value="Sicilia">Sicilia</SelectItem>
                                    <SelectItem value="Veneto">Veneto</SelectItem>
                                    <SelectItem value="Emilia-Romagna">Emilia-Romagna</SelectItem>
                                    <SelectItem value="Piemonte">Piemonte</SelectItem>
                                    <SelectItem value="Puglia">Puglia</SelectItem>
                                    <SelectItem value="Toscana">Toscana</SelectItem>
                                    <SelectItem value="Calabria">Calabria</SelectItem>
                                    {/* Add other regions as needed */}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provincia_interesse" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" /> Provincia
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
