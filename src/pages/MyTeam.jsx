import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2, Mail } from 'lucide-react';

const MyTeam = () => {
  const { user, logActivity } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar equipe"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTeam();
  }, [user]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setInviteLoading(true);
    try {
      // Check if already invited
      if (members.some(m => m.member_email === newMemberEmail)) {
        toast({ title: "Este e-mail já está na sua equipe.", variant: "warning" });
        return;
      }

      // Add to team_members table (no limit check - unlimited team members)
      const { error } = await supabase
        .from('team_members')
        .insert({
          owner_id: user.id,
          member_email: newMemberEmail,
          role: 'member'
        });

      if (error) throw error;

      await logActivity('INVITE_MEMBER', { email: newMemberEmail });
      
      toast({
        title: "Convite registrado!",
        description: "Peça para o usuário se cadastrar com este e-mail.",
        className: "bg-green-50 text-green-900 border-green-200"
      });
      
      setNewMemberEmail('');
      fetchTeam(); // Refresh list

    } catch (error) {
      console.error("Invite error:", error);
      toast({
        title: "Erro ao convidar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw error;
      
      await logActivity('REMOVE_MEMBER', { member_row_id: memberId });
      
      toast({ title: "Membro removido." });
      fetchTeam();
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Minha Equipe - Penhora.app.br</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Minha Equipe</h1>
          <p className="text-slate-500">Gerencie os membros que têm acesso à sua conta. Sem limites!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Convidar Novo Membro</CardTitle>
            <CardDescription>
              Adicione quantos colaboradores precisar. Não há limite de membros na equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="email">E-mail do colaborador</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                    id="email" 
                    type="email" 
                    placeholder="colaborador@exemplo.com" 
                    value={newMemberEmail}
                    className="pl-9"
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                    />
                </div>
              </div>
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Convidar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum membro convidado ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Convite</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.member_email}</TableCell>
                      <TableCell>
                        {member.member_id ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MyTeam;