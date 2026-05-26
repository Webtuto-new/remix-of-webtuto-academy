import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, GraduationCap } from "lucide-react";

const schema = z.object({
  student_name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  curriculum_id: z.string().optional().or(z.literal("")),
  grade_id: z.string().optional().or(z.literal("")),
  subject_id: z.string().optional().or(z.literal("")),
  subject_text: z.string().trim().max(160).optional().or(z.literal("")),
  grade_text: z.string().trim().max(120).optional().or(z.literal("")),
  class_type: z.enum(["individual", "group", "seminar", "recording"]),
  preferred_language: z.string().trim().max(60).optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  preferred_time: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const RequestClassPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_name: profile?.full_name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    curriculum_id: "",
    grade_id: "",
    subject_id: "",
    subject_text: "",
    grade_text: "",
    class_type: "individual",
    preferred_language: "",
    preferred_date: "",
    preferred_time: "",
    budget: "",
    message: "",
  });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      student_name: f.student_name || profile?.full_name || "",
      email: f.email || profile?.email || user?.email || "",
      phone: f.phone || profile?.phone || "",
    }));
  }, [profile, user]);

  useEffect(() => {
    supabase.from("curriculums").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setCurriculums(data || []));
  }, []);

  useEffect(() => {
    if (!form.curriculum_id) { setGrades([]); return; }
    supabase.from("grades").select("*").eq("curriculum_id", form.curriculum_id).eq("is_active", true).order("sort_order").then(({ data }) => setGrades(data || []));
  }, [form.curriculum_id]);

  useEffect(() => {
    if (!form.grade_id) { setSubjects([]); return; }
    supabase.from("subjects").select("*").eq("grade_id", form.grade_id).eq("is_active", true).order("sort_order").then(({ data }) => setSubjects(data || []));
  }, [form.grade_id]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!user) {
      toast({ title: "Please log in to submit a request", variant: "destructive" });
      navigate("/login?redirect=/request-class");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      toast({ title: "Check your form", description: first || "Please review the fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload: any = {
      user_id: user.id,
      student_name: form.student_name,
      email: form.email,
      phone: form.phone || null,
      curriculum_id: form.curriculum_id || null,
      grade_id: form.grade_id || null,
      subject_id: form.subject_id || null,
      subject_text: form.subject_text || null,
      grade_text: form.grade_text || null,
      class_type: form.class_type,
      preferred_language: form.preferred_language || null,
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time || null,
      budget: form.budget ? parseFloat(form.budget) : null,
      message: form.message || null,
      status: "pending",
    };
    const { error } = await supabase.from("class_requests" as any).insert(payload);
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request submitted", description: "We'll review and get back to you soon." });
    navigate("/dashboard/requests");
  };

  return (
    <Layout>
      <SEOHead title="Request a Class | Webtuto" description="Tell us what you want to learn — subject, grade, budget — and we'll match you with a tutor." path="/request-class" />
      <div className="relative bg-mesh pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong text-xs font-semibold text-primary tracking-wide">
              <GraduationCap className="w-3.5 h-3.5" /> Custom Class Request
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground tracking-tight">Request a Class</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">Can't find what you need? Tell us your subject, level, and budget — we'll match you with a tutor.</p>
          </motion.div>

          {!user && (
            <Card className="mb-4 border-primary/40 bg-primary/5">
              <CardContent className="p-4 text-sm text-foreground">
                Please <Link to="/login?redirect=/request-class" className="text-primary font-medium underline">log in</Link> to submit a request.
              </CardContent>
            </Card>
          )}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="glass-strong rounded-2xl ring-glow">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Your Name *</Label>
                  <Input value={form.student_name} onChange={(e) => update("student_name", e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={40} />
                </div>
                <div className="space-y-1.5">
                  <Label>Class Type *</Label>
                  <Select value={form.class_type} onValueChange={(v) => update("class_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual (1-on-1)</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="recording">Recording</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Curriculum</Label>
                  <Select value={form.curriculum_id} onValueChange={(v) => { update("curriculum_id", v); update("grade_id", ""); update("subject_id", ""); }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {curriculums.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Grade / Level</Label>
                  <Select value={form.grade_id} onValueChange={(v) => { update("grade_id", v); update("subject_id", ""); }} disabled={!form.curriculum_id}>
                    <SelectTrigger><SelectValue placeholder={form.curriculum_id ? "Select" : "Pick curriculum first"} /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={form.subject_id} onValueChange={(v) => update("subject_id", v)} disabled={!form.grade_id}>
                    <SelectTrigger><SelectValue placeholder={form.grade_id ? "Select" : "Pick grade first"} /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject (custom)</Label>
                  <Input value={form.subject_text} onChange={(e) => update("subject_text", e.target.value)} placeholder="If not in list" maxLength={160} />
                </div>
                <div className="space-y-1.5">
                  <Label>Grade (custom)</Label>
                  <Input value={form.grade_text} onChange={(e) => update("grade_text", e.target.value)} placeholder="If not in list" maxLength={120} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Preferred Language</Label>
                  <Input value={form.preferred_language} onChange={(e) => update("preferred_language", e.target.value)} placeholder="English / Sinhala / Tamil" maxLength={60} />
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred Date</Label>
                  <Input type="date" value={form.preferred_date} onChange={(e) => update("preferred_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred Time</Label>
                  <Input type="time" value={form.preferred_time} onChange={(e) => update("preferred_time", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Budget (LKR)</Label>
                <Input type="number" min="0" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="e.g. 2500" />
              </div>

              <div className="space-y-1.5">
                <Label>Message / Special Requirements</Label>
                <Textarea rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} maxLength={2000} placeholder="Tell us what you're trying to learn or any specific needs..." />
              </div>

              <Button onClick={submit} disabled={submitting || !user} variant="premium" className="w-full gap-2" size="lg">
                <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </CardContent>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default RequestClassPage;
