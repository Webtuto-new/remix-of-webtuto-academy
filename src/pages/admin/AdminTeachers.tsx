import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, UserPlus, Loader2, Copy, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ThumbnailUpload from "@/components/ThumbnailUpload";

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
};

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loginTeacher, setLoginTeacher] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const [form, setForm] = useState({ name: "", bio: "", qualifications: "", avatar_url: "" });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchTeachers = () => {
    supabase.from("teachers").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setTeachers(data || []));
  };
  useEffect(() => { fetchTeachers(); }, []);

  const handleSave = async () => {
    const payload = { name: form.name, bio: form.bio, qualifications: form.qualifications, avatar_url: form.avatar_url || null };
    let error;
    if (editing) {
      ({ error } = await supabase.from("teachers").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("teachers").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Updated!" : "Created!" }); setOpen(false); setEditing(null); setForm({ name: "", bio: "", qualifications: "", avatar_url: "" }); fetchTeachers(); }
  };

  const handleEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, bio: t.bio || "", qualifications: t.qualifications || "", avatar_url: t.avatar_url || "" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this teacher?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchTeachers(); }
  };

  const handleCreateLogin = async () => {
    if (!loginTeacher || !loginForm.email || !loginForm.password) return;
    setLoginLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-teacher-account", {
        body: {
          email: loginForm.email,
          password: loginForm.password,
          teacher_id: loginTeacher.id,
          full_name: loginTeacher.name,
        },
      });
      if (res.error) throw new Error(res.error.message || "Failed to create account");
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "Teacher login created!", description: `Email: ${loginForm.email}` });
      setCreatedCredentials({ email: loginForm.email, password: loginForm.password, name: loginTeacher.name });
      setLoginOpen(false);
      setLoginTeacher(null);
      setLoginForm({ email: "", password: "" });
      fetchTeachers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const openLoginDialog = (t: any) => {
    setLoginTeacher(t);
    setLoginForm({ email: "", password: generatePassword() });
    setLoginOpen(true);
  };

  const siteUrl = window.location.origin;

  const getCopyMessage = () => {
    if (!createdCredentials) return "";
    return `Hi ${createdCredentials.name}! 👋

Your teacher account has been created on WebTuto Academy.

🔗 Login here: ${siteUrl}/login
📧 Email: ${createdCredentials.email}
🔑 Password: ${createdCredentials.password}

After logging in, click "Teacher Panel" in your dashboard sidebar to access your teacher dashboard where you can manage your classes, sessions, and students.

Please change your password after your first login.`;
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(getCopyMessage());
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gradient">Manage Teachers</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="w-4 h-4" /> Add Teacher</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Teacher</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Bio</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Qualifications</Label><Input value={form.qualifications} onChange={(e) => setForm(f => ({ ...f, qualifications: e.target.value }))} /></div>
              <ThumbnailUpload value={form.avatar_url || null} onChange={(url) => setForm(f => ({ ...f, avatar_url: url || "" }))} title={form.name} folder="teachers" />
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Create Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Login for {loginTeacher?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This will create a user account with tutor permissions. Share the credentials with the teacher.</p>
            <div className="space-y-2"><Label>Email</Label><Input value={loginForm.email} onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder="teacher@example.com" /></div>
            <div className="space-y-2">
              <Label>Auto-Generated Password</Label>
              <div className="flex gap-2">
                <Input value={loginForm.password} onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))} className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => setLoginForm(f => ({ ...f, password: generatePassword() }))} title="Regenerate">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleCreateLogin} className="w-full" disabled={loginLoading || !loginForm.email || !loginForm.password}>
              {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : "Create Login"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Share Dialog */}
      <Dialog open={!!createdCredentials} onOpenChange={(v) => { if (!v) setCreatedCredentials(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Login Created Successfully ✅</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Copy the message below and share it with the teacher via WhatsApp, email, or any messenger.</p>
            <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap font-mono text-foreground border border-border">
              {getCopyMessage()}
            </div>
            <Button onClick={copyMessage} className="w-full gap-2">
              <Copy className="w-4 h-4" /> Copy Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Qualifications</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Login</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-foreground cursor-pointer hover:text-primary" onClick={() => navigate(`/admin/teachers/${t.id}`)}>{t.name}</td>
                    <td className="p-4 text-muted-foreground">{t.qualifications || "—"}</td>
                    <td className="p-4">
                      {t.user_id ? (
                        <Badge variant="default" className="text-xs">Has Login</Badge>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openLoginDialog(t)}>
                          <UserPlus className="w-3 h-3" /> Create Login
                        </Button>
                      )}
                    </td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${t.is_active ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/teachers/${t.id}`)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No teachers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeachers;
