import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, UserPlus, BookOpen, Clock, Pencil, Eye, ArrowLeft, CheckCircle2, XCircle, Ban, ShieldCheck } from "lucide-react";
import { format, addDays } from "date-fns";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import EmptyState from "@/components/premium/EmptyState";
import AdminPageHeader from "@/components/premium/AdminPageHeader";
import { Users } from "lucide-react";

const AdminStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const { toast } = useToast();

  // Create student
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: "", email: "", password: "", phone: "", address: "" });
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string; full_name: string; admission_number: string } | null>(null);

  // Edit student
  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", address: "", avatar_url: "" });

  // View student profile/progress
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [studentCertificates, setStudentCertificates] = useState<any[]>([]);

  // Enroll student
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState<any>(null);
  const [enrollType, setEnrollType] = useState<"class" | "recording">("class");
  const [enrollItemId, setEnrollItemId] = useState("");
  const [enrollDays, setEnrollDays] = useState("30");

  // Search
  const [search, setSearch] = useState("");

  const fetchStudents = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setStudents(data || []);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("id, title, is_active").order("title");
    setClasses(data || []);
  };

  const fetchRecordings = async () => {
    const { data } = await supabase.from("recordings").select("id, title, is_active").order("title");
    setRecordings(data || []);
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchRecordings();
  }, []);

  // Filtered students
  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.admission_number || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q);
  });

  // Create student account
  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-student", { body: createForm });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCreatedInfo({ email: createForm.email, password: createForm.password, full_name: createForm.full_name, admission_number: data.admission_number });
      fetchStudents();
      toast({ title: "Student account created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    if (!createdInfo) return;
    const msg = `Welcome to WebTuto Academy! 🎓\n\nHere are your login details:\n📧 Email: ${createdInfo.email}\n🔑 Password: ${createdInfo.password}\n🆔 Admission #: ${createdInfo.admission_number}\n👤 Name: ${createdInfo.full_name}\n\n🔗 Login at: ${window.location.origin}/login\n\nPlease change your password after first login.`;
    navigator.clipboard.writeText(msg);
    toast({ title: "Credentials copied to clipboard!" });
  };

  const resetCreateForm = () => {
    setCreateForm({ full_name: "", email: "", password: "", phone: "", address: "" });
    setCreatedInfo(null);
  };

  const generatePassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setCreateForm(f => ({ ...f, password: pass }));
  };

  // Edit student
  const openEdit = (s: any) => {
    setEditStudent(s);
    setEditForm({ full_name: s.full_name || "", phone: s.phone || "", address: s.address || "", avatar_url: s.avatar_url || "" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editStudent) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      phone: editForm.phone || null,
      address: editForm.address || null,
      avatar_url: editForm.avatar_url || null,
    }).eq("id", editStudent.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Student updated!" });
      setEditOpen(false);
      fetchStudents();
      // Update view if viewing same student
      if (viewStudent?.id === editStudent.id) {
        setViewStudent({ ...viewStudent, ...editForm });
      }
    }
  };

  // View student progress
  const openStudentView = async (student: any) => {
    setViewStudent(student);
    // Fetch all progress data in parallel
    const [enrollRes, payRes, attendRes, certRes] = await Promise.all([
      supabase.from("enrollments").select("*, classes(title, class_type), recordings(title)").eq("user_id", student.id).order("enrolled_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", student.id).order("created_at", { ascending: false }),
      supabase.from("attendance").select("*, class_sessions(title, session_date, classes(title))").eq("user_id", student.id).order("joined_at", { ascending: false }),
      supabase.from("certificates").select("*, classes(title)").eq("user_id", student.id).order("issued_at", { ascending: false }),
    ]);
    setStudentEnrollments(enrollRes.data || []);
    setStudentPayments(payRes.data || []);
    setStudentAttendance(attendRes.data || []);
    setStudentCertificates(certRes.data || []);
  };

  // Enroll
  const openEnroll = (student: any) => {
    setEnrollStudent(student);
    setEnrollItemId("");
    setEnrollDays("30");
    setEnrollType("class");
    setEnrollOpen(true);
  };

  const handleEnroll = async () => {
    if (!enrollStudent || !enrollItemId) {
      toast({ title: "Select an item to enroll", variant: "destructive" });
      return;
    }
    const expiresAt = addDays(new Date(), parseInt(enrollDays) || 30).toISOString();
    const payload: any = { user_id: enrollStudent.id, status: "active", expires_at: expiresAt };
    if (enrollType === "class") payload.class_id = enrollItemId;
    else payload.recording_id = enrollItemId;
    const { error } = await supabase.from("enrollments").insert(payload);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Student enrolled!" });
      setEnrollOpen(false);
      if (viewStudent?.id === enrollStudent.id) openStudentView(enrollStudent);
    }
  };

  const extendExpiry = async (enrollmentId: string, days: number) => {
    const enrollment = studentEnrollments.find(e => e.id === enrollmentId);
    const baseDate = enrollment?.expires_at ? new Date(enrollment.expires_at) : new Date();
    const newExpiry = addDays(baseDate, days).toISOString();
    const { error } = await supabase.from("enrollments").update({ expires_at: newExpiry, status: "active" }).eq("id", enrollmentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Extended by ${days} days` });
      if (viewStudent) openStudentView(viewStudent);
    }
  };

  const expireEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase.from("enrollments").update({ status: "expired" }).eq("id", enrollmentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Enrollment expired" });
      if (viewStudent) openStudentView(viewStudent);
    }
  };

  // Ban/Unban
  const toggleBan = async (student: any) => {
    const action = student.is_banned ? "unban" : "ban";
    try {
      const { data, error } = await supabase.functions.invoke("ban-user", {
        body: { user_id: student.id, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: action === "ban" ? "Student banned" : "Student unbanned" });
      fetchStudents();
      if (viewStudent?.id === student.id) setViewStudent({ ...student, is_banned: !student.is_banned });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ======================== STUDENT DETAIL VIEW ========================
  if (viewStudent) {
    const activeEnrollments = studentEnrollments.filter(e => e.status === "active" && (!e.expires_at || new Date(e.expires_at) > new Date()));
    const expiredEnrollments = studentEnrollments.filter(e => e.status === "expired" || (e.expires_at && new Date(e.expires_at) <= new Date()));
    const totalPaid = studentPayments.filter(p => p.payment_status === "completed").reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewStudent(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-gradient">{viewStudent.full_name}</h1>
            <p className="text-sm text-muted-foreground">{viewStudent.email} · {viewStudent.admission_number}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(viewStudent)}>
            <Pencil className="w-3 h-3" /> Edit
          </Button>
          <Button size="sm" className="gap-1" onClick={() => openEnroll(viewStudent)}>
            <BookOpen className="w-3 h-3" /> Enroll
          </Button>
          <Button
            variant={viewStudent.is_banned ? "outline" : "destructive"}
            size="sm"
            className="gap-1"
            onClick={() => toggleBan(viewStudent)}
          >
            {viewStudent.is_banned ? <><ShieldCheck className="w-3 h-3" /> Unban</> : <><Ban className="w-3 h-3" /> Ban</>}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{activeEnrollments.length}</p>
            <p className="text-xs text-muted-foreground">Active Enrollments</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{studentAttendance.length}</p>
            <p className="text-xs text-muted-foreground">Sessions Attended</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{studentCertificates.length}</p>
            <p className="text-xs text-muted-foreground">Certificates</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gradient">LKR {totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </CardContent></Card>
        </div>

        {/* Student Details */}
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-foreground">Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-muted-foreground">
              <p>Phone: <span className="text-foreground">{viewStudent.phone || "—"}</span></p>
              <p>Address: <span className="text-foreground">{viewStudent.address || "—"}</span></p>
              <p>Joined: <span className="text-foreground">{format(new Date(viewStudent.created_at), "PPP")}</span></p>
              <p>Admission #: <span className="text-foreground font-mono">{viewStudent.admission_number || "—"}</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Enrollments ({studentEnrollments.length})</h3>
            {studentEnrollments.length === 0 && <p className="text-sm text-muted-foreground">No enrollments.</p>}
            {studentEnrollments.map((e) => {
              const isExpired = e.status === "expired" || (e.expires_at && new Date(e.expires_at) <= new Date());
              const itemName = e.classes?.title || e.recordings?.title || "Unknown";
              return (
                <div key={e.id} className={`rounded-lg border p-3 space-y-2 ${isExpired ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    {isExpired ? <XCircle className="w-4 h-4 text-destructive shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.class_id ? e.classes?.class_type || "Class" : "Recording"} · {isExpired ? "Expired" : "Active"}
                        {e.expires_at && ` · Expires: ${format(new Date(e.expires_at), "PP")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => extendExpiry(e.id, 7)}>+7d</Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => extendExpiry(e.id, 30)}>+30d</Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => extendExpiry(e.id, 90)}>+90d</Button>
                    {!isExpired && (
                      <Button size="sm" variant="destructive" className="text-xs h-7 ml-auto" onClick={() => expireEnrollment(e.id)}>Expire</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Attendance ({studentAttendance.length})</h3>
            {studentAttendance.length === 0 && <p className="text-sm text-muted-foreground">No attendance records.</p>}
            <div className="space-y-1">
              {studentAttendance.slice(0, 20).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="text-foreground">{a.class_sessions?.title || "Session"}</span>
                    <span className="text-muted-foreground ml-2 text-xs">({a.class_sessions?.classes?.title})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.class_sessions?.session_date ? format(new Date(a.class_sessions.session_date), "PP") : "—"}</span>
                </div>
              ))}
              {studentAttendance.length > 20 && <p className="text-xs text-muted-foreground text-center pt-2">+ {studentAttendance.length - 20} more</p>}
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Payments ({studentPayments.length})</h3>
            {studentPayments.length === 0 && <p className="text-sm text-muted-foreground">No payments.</p>}
            <div className="space-y-1">
              {studentPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="text-foreground">LKR {p.amount?.toLocaleString()}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${p.payment_status === "completed" ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}`}>{p.payment_status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(p.created_at), "PP")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certificates */}
        {studentCertificates.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Certificates ({studentCertificates.length})</h3>
              <div className="space-y-1">
                {studentCertificates.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <div>
                      <span className="text-foreground">{c.title}</span>
                      <span className="text-muted-foreground ml-2 text-xs">#{c.certificate_number}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.issued_at), "PP")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ======================== LIST VIEW ========================
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        eyebrow="Member directory"
        title="Students"
        description="Search, create, and manage student accounts."
        accent="primary"
        actions={
          <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button variant="premium" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Create Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Student Account</DialogTitle></DialogHeader>
            {!createdInfo ? (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Full Name</Label><Input value={createForm.full_name} onChange={(e) => setCreateForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Doe" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="student@example.com" /></div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="min 6 characters" />
                    <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="shrink-0 text-xs">Generate</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Phone</Label><Input value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={createForm.address} onChange={(e) => setCreateForm(f => ({ ...f, address: e.target.value }))} /></div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full gap-2">
                  <UserPlus className="w-4 h-4" /> {creating ? "Creating..." : "Create Account"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Account Created Successfully! ✅</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>👤 Name: <span className="text-foreground">{createdInfo.full_name}</span></p>
                    <p>📧 Email: <span className="text-foreground">{createdInfo.email}</span></p>
                    <p>🔑 Password: <span className="text-foreground font-mono">{createdInfo.password}</span></p>
                    <p>🆔 Admission #: <span className="text-foreground">{createdInfo.admission_number}</span></p>
                  </div>
                </div>
                <Button onClick={copyCredentials} className="w-full gap-2"><Copy className="w-4 h-4" /> Copy Message to Share</Button>
                <Button variant="outline" onClick={resetCreateForm} className="w-full">Create Another</Button>
              </div>
            )}
          </DialogContent>
          </Dialog>
        }
      />

      {/* Search */}
      <Input placeholder="Search by name, email, phone or admission #..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.full_name} onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enroll {enrollStudent?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enroll in</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={enrollType === "class" ? "default" : "outline"} onClick={() => { setEnrollType("class"); setEnrollItemId(""); }}>Class</Button>
                <Button type="button" size="sm" variant={enrollType === "recording" ? "default" : "outline"} onClick={() => { setEnrollType("recording"); setEnrollItemId(""); }}>Recording</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{enrollType === "class" ? "Select Class" : "Select Recording"}</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={enrollItemId} onChange={(e) => setEnrollItemId(e.target.value)}>
                <option value="">Choose...</option>
                {(enrollType === "class" ? classes : recordings).map((item: any) => (
                  <option key={item.id} value={item.id}>{item.title}{!item.is_active ? " (Hidden)" : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2"><Label>Access Duration (days)</Label><Input type="number" value={enrollDays} onChange={(e) => setEnrollDays(e.target.value)} /></div>
            <Button onClick={handleEnroll} className="w-full gap-2"><BookOpen className="w-4 h-4" /> Enroll Student</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Students Table */}
      <Card className="glass-strong border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Admission #</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                {filtered.map((s) => (
                  <motion.tr key={s.id} variants={fadeUp} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => openStudentView(s)}>
                    <td className="p-4 font-medium text-foreground font-mono text-xs">{s.admission_number || "—"}</td>
                    <td className="p-4 text-foreground">
                      {s.full_name}
                      {s.is_banned && <span className="ml-2 text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Banned</span>}
                    </td>
                    <td className="p-4 text-muted-foreground">{s.email}</td>
                    <td className="p-4 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="p-4 text-muted-foreground">{format(new Date(s.created_at), "PP")}</td>
                    <td className="p-4">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => openStudentView(s)}>
                          <Eye className="w-3 h-3" /> View
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => openEdit(s)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => openEnroll(s)}>
                          <BookOpen className="w-3 h-3" /> Enroll
                        </Button>
                        <Button variant="ghost" size="sm" className={`text-xs gap-1 ${s.is_banned ? "" : "text-destructive"}`} onClick={() => toggleBan(s)}>
                          {s.is_banned ? <><ShieldCheck className="w-3 h-3" /> Unban</> : <><Ban className="w-3 h-3" /> Ban</>}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="p-8"><EmptyState icon={Users} title={search ? "No matches" : "No students yet"} description={search ? "Try a different search term." : "Student accounts will appear here once created."} /></td></tr>}
              </motion.tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudents;
