import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { callCreateAdminUser } from '@/lib/adminApi';

const AdminUserCreator = () => {
    const { toast } = useToast();
    const [email, setEmail] = useState('emaildogago@gmail.com');
    const [password, setPassword] = useState('6Nv0HR@W$$wRCluQ');
    const [serviceKey, setServiceKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateAdmin = async () => {
        if (!serviceKey) {
            toast({
                variant: 'destructive',
                title: 'Chave de serviço necessária',
                description: 'Por favor, insira a chave de serviço do Supabase para continuar.',
            });
            return;
        }

        setLoading(true);
        try {
            const result = await callCreateAdminUser(email, password, serviceKey);
            if (result.error) {
                throw new Error(result.error);
            }
            toast({
                title: 'Administrador criado com sucesso!',
                description: `O usuário ${result.user.email} agora é um administrador.`,
                className: 'bg-green-100 text-green-800'
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao criar administrador',
                description: error.message || 'Ocorreu um erro desconhecido.',
            });
        } finally {
            setLoading(false);
        }
    };

    // This component is for demonstration. In a real app, you would not have this on a public page.
    return (
        <div className="p-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Criar Usuário Administrador</CardTitle>
                    <CardDescription>
                        Use esta ferramenta para criar um novo usuário com privilégios de administrador.
                        Insira sua chave de serviço (service_role_key) para autorizar a operação.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Email do Administrador</Label>
                        <Input id="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admin-password">Senha do Administrador</Label>
                        <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="service-key">Supabase Service Role Key</Label>
                        <Input 
                            id="service-key" 
                            type="password"
                            placeholder="Cole sua chave de serviço aqui"
                            value={serviceKey} 
                            onChange={(e) => setServiceKey(e.targe.value)} 
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCreateAdmin} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Administrador
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AdminUserCreator;