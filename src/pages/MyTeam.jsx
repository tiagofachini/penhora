import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { logActivity } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Loader2, UserPlus, Trash2, Mail, Shield, Clock, Check, RefreshCw, Settings2, Users,
} from 'lucide-react';

/* ─────────── Constants ─────────── */

const MODULES = [
  { key: 'processes', label: 'Penhoras' },
  { key: 'people',    label: 'Pessoas' },
  { key: 'calendar',  label: 'Agenda' },
];

const ACTIONS = [
  { key: 'view',   label: 'Visualizar' },
  { key: 'edit',   label: 'Editar' },
  { key: 'delete', label: 'Excluir' },
];

const DEFAULT_PERMISSIONS = {
  processes: { view: true,  edit: true,  delete: false },
  people:    { view: true,  edit: false, delete: false },
  calendar:  { view: true,  edit: true,  delete: false },
};

const ADMIN_PERMISSIONS = {
  processes: { view: true, edit: true, delete: true },
  people:    { view: true, edit: true, delete: true },
  calendar:  { view: true, edit: true, delete: true },
};

/* ─────────── PermissionMatrix ─────────── */

const PermissionMatrix = ({ permissions, onChange, disabled }) => {
  const toggle = (mod, action) => {
    if (disabled) return;
    const current = permissions[mod]?.[action] ?? false;
    if (action === 'view' && current) {
      // Turning view off → also disable edit + delete
      onChange({ ...permissions, [mod]: { view: false, edit: false, delete: false } });
    } else if (action !== 'view' && !permissions[mod]?.view && !current) {
      // Enabling edit/delete without view → enable view too
      onChange({ ...permissions, [mod]: { ...permissions[mod], view: true, [action]: true } });
    } else {
      onChange({ ...permissions, [mod]: { ...permissions[mod], [action]: !current } });
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold text-slate-700 w-32">Módulo</TableHead>
            {ACTIONS.map(a => (
              <TableHead key={a.key} className="text-center font-semibold text-slate-700">{a.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {MODULES.map(mod => (
            <TableRow key={mod.key}>
              <TableCell className="font-medium text-slate-800">{mod.label}</TableCell>
              {ACTIONS.map(action => (
                <TableCell key={action.key} className="text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={!!(permissions[mod.key]?.[action.key])}
                      onCheckedChange={() => toggle(mod.key, action.key)}
                      disabled={disabled}
                    />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/* ─────────── InviteDialog ─────────── */

const InviteDialog = ({ open, onOpenChange, onInvited }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setEmail(''); setRole('member'); setPermissions(DEFAULT_PERMISSIONS); }
  }, [open]);

  const handleRoleChange = (val) => {
    setRole(val);
    if (val === 'admin') setPermissions(ADMIN_PERMISSIONS);
    else setPermissions(DEFAULT_PERMISSIONS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: { member_email: email.trim(), role, permissions },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const desc = data.existingUser
        ? 'Usuário já possui conta e foi adicionado à equipe imediatamente.'
        : data.emailSent
          ? 'Um e-mail de convite foi enviado ao colaborador.'
          : 'Convite registrado. O colaborador deve se cadastrar com este e-mail.';

      toast({ title: 'Membro adicionado!', description: desc });
      logActivity(supabase, 'INVITE_MEMBER', { email: email.trim(), role });
      onInvited();
      onOpenChange(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao convidar', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div>
            <Label htmlFor="invite_email">E-mail do colaborador</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="invite_email" type="email" className="pl-9"
                placeholder="colaborador@exemplo.com"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="invite_role">Perfil de acesso</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger id="invite_role" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {role === 'admin' && (
              <p className="text-xs text-amber-600 mt-1.5">
                Administradores têm acesso total e podem gerenciar usuários da equipe.
              </p>
            )}
          </div>

          {role !== 'admin' && (
            <div>
              <Label className="mb-2 block">Permissões por módulo</Label>
              <PermissionMatrix permissions={permissions} onChange={setPermissions} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <UserPlus className="mr-2 h-4 w-4" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────── EditPermissionsDialog ─────────── */

const EditPermissionsDialog = ({ open, onOpenChange, member, onSaved }) => {
  const { toast } = useToast();
  const [role, setRole] = useState('member');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role || 'member');
      setPermissions(member.permissions || DEFAULT_PERMISSIONS);
    }
  }, [member]);

  const handleRoleChange = (val) => {
    setRole(val);
    if (val === 'admin') setPermissions(ADMIN_PERMISSIONS);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role, permissions })
        .eq('id', member.id);
      if (error) throw error;
      logActivity(supabase, 'UPDATE_MEMBER_PERMISSIONS', { member_email: member.member_email, role });
      toast({ title: 'Permissões atualizadas.' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">Editar acesso — {member?.member_email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          <div>
            <Label htmlFor="edit_role">Perfil de acesso</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger id="edit_role" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {role === 'admin' && (
              <p className="text-xs text-amber-600 mt-1.5">
                Administradores têm acesso total e podem gerenciar usuários da equipe.
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Permissões por módulo</Label>
            <PermissionMatrix
              permissions={permissions}
              onChange={setPermissions}
              disabled={role === 'admin'}
            />
            {role === 'admin' && (
              <p className="text-xs text-slate-400 mt-1.5">
                Administradores têm todas as permissões habilitadas automaticamente.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────── MyTeam (main page) ─────────── */

const MyTeam = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTeam = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao carregar equipe.' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleResendInvite = async (member) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: { member_email: member.member_email, resend: true },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: 'Convite reenviado.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao reenviar', description: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      logActivity(supabase, 'REMOVE_MEMBER', { member_email: deleteTarget.member_email });
      toast({ title: 'Membro removido.' });
      fetchTeam();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: err.message });
    } finally {
      setDeleteTarget(null);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const fmtDateTime = (d) => d
    ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <>
      <Helmet><title>Equipe - Penhora.app.br</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Equipe</h1>
            <p className="text-slate-500">Gerencie membros e seus níveis de acesso à conta.</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Membro
          </Button>
        </div>

        {/* Members table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin h-6 w-6 text-slate-400" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">Nenhum membro adicionado ainda.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Adicione colaboradores para compartilhar o acesso à conta.
                </p>
                <Button onClick={() => setInviteOpen(true)} variant="outline" className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar Membro
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último acesso</TableHead>
                      <TableHead>Convidado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.member_email}</TableCell>
                        <TableCell>
                          {m.role === 'admin' ? (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
                              <Shield className="h-3 w-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-600">Membro</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {m.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                              <Check className="h-3 w-3" /> Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1">
                              <Clock className="h-3 w-3" /> Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{fmtDateTime(m.last_login_at)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{fmtDate(m.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {m.status === 'pending' && (
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                title="Reenviar convite"
                                onClick={() => handleResendInvite(m)}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-800"
                              title="Editar permissões"
                              onClick={() => setEditTarget(m)}
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              title="Remover membro"
                              onClick={() => setDeleteTarget(m)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={fetchTeam} />

      {editTarget && (
        <EditPermissionsDialog
          open={!!editTarget}
          onOpenChange={open => { if (!open) setEditTarget(null); }}
          member={editTarget}
          onSaved={fetchTeam}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.member_email}</strong> perderá o acesso imediatamente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyTeam;
