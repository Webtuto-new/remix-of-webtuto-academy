import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Award } from "lucide-react";
import FileOrLinkInput from "@/components/FileOrLinkInput";
import AdminPageHeader from "@/components/premium/AdminPageHeader";

const AdminCertificates = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ user_id: "", class_id: "", title: "", pdf_url: "" });
  const { toast } = useToast();

  const fetchCerts = () => {
    supabase.from("certificates").select("*, profiles(full_name), classes(title)").order("issued_at", { ascending: false })
      .then(({ data }) => setCerts(data || []));
  };

  useEffect(() => {
    fetchCerts();
    supabase.from("profiles").select("id, full_name").order("full_name").then(({ data }) => setProfiles(data || []));
    supabase.from("classes").select("id, title").order("title").then(({ data }) => setClasses(data || []));
  }, []);

  const handleSave = async () => {
    let error;
    if (editing) {
      ({ error } = await supabase.from("certificates").update({
        user_id: form.user_id,
        class_id: form.class_id || null,
        title: form.title,
        pdf_url: form.pdf_url || null,
      }).eq("id", editing.id));
    } else {
      const certNum = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      ({ error } = await supabase.from("certificates").insert({
        user_id: form.user_id,
        class_id: form.class_id || null,
        title: form.title,
        certificate_number: certNum,
        pdf_url: form.pdf_url || null,
      }));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Updated!" : "Certificate issued!" }); setOpen(false); setEditing(null); setForm({ user_id: "", class_id: "", title: "", pdf_url: "" }); fetchCerts(); }
  };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({ user_id: c.user_id, class_id: c.class_id || "", title: c.title, pdf_url: c.pdf_url || "" });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Award}
        eyebrow="Recognition"
        title="Certificates"
        description="Issue and manage course completion certificates for students."
        accent="emerald"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ user_id: "", class_id: "", title: "", pdf_url: "" }); } }}>
            <DialogTrigger asChild><Button variant="premium" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Issue Certificate</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Issue"} Certificate</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.user_id} onChange={(e) => setForm(f => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Select student</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Class (optional)</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.class_id} onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))}>
                  <option value="">None</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Certificate Title</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Certificate of Completion" /></div>
              <FileOrLinkInput
                value={form.pdf_url || null}
                onChange={(url) => setForm(f => ({ ...f, pdf_url: url || "" }))}
                bucket="thumbnails"
                folder="certificates"
                accept=".pdf"
                label="Certificate PDF (optional)"
                linkPlaceholder="https://drive.google.com/... or direct PDF URL"
                uploadHint="Drag & drop certificate PDF"
              />
              <Button onClick={handleSave} variant="premium" className="w-full">{editing ? "Update" : "Issue"}</Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />
      <Card className="glass-strong border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Certificate #</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Class</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Issued</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {certs.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-mono text-xs text-foreground">{c.certificate_number}</td>
                    <td className="p-4 text-foreground">{(c as any).profiles?.full_name || "—"}</td>
                    <td className="p-4 font-medium text-foreground">{c.title}</td>
                    <td className="p-4 text-muted-foreground">{(c as any).classes?.title || "—"}</td>
                    <td className="p-4 text-muted-foreground">{new Date(c.issued_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {c.pdf_url && <a href={c.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline px-2 py-1">PDF</a>}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("certificates").delete().eq("id", c.id); fetchCerts(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {certs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No certificates issued yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCertificates;
