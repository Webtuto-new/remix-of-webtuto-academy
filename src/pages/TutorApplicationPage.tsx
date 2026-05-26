import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, emailTemplates } from "@/lib/email";
import FileOrLinkInput from "@/components/FileOrLinkInput";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { Sparkles, DollarSign, Users, CalendarClock, ShieldCheck, ArrowRight } from "lucide-react";

const TutorApplicationPage = () => {
  const { user } = useAuth();
  const [agreed, setAgreed] = useState({ payment: false, fee: false });
  const [loading, setLoading] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed.payment || !agreed.fee) {
      toast.error("Please agree to all terms before submitting.");
      return;
    }

    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    const { error } = await supabase.from("tutor_applications").insert({
      name,
      email,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      age: parseInt(formData.get("age") as string) || null,
      teaching_experience: formData.get("experience") as string,
      subjects_can_teach: formData.get("subjects") as string,
      max_grade_level: formData.get("maxGrade") as string,
      online_teaching_years: parseInt(formData.get("onlineYears") as string) || 0,
      agreed_payment_terms: agreed.payment,
      agreed_platform_fee: agreed.fee,
      user_id: user?.id || null,
      cv_url: cvUrl || null,
      demo_recording_url: demoUrl || null,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit application. " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Application submitted successfully! We'll review it shortly.");

    try {
      const appEmail = emailTemplates.tutorApplicationReceived(name);
      await sendEmail({ to: email, subject: appEmail.subject, html: appEmail.html });
    } catch (e) {
      console.error("Tutor application email failed:", e);
    }

    setLoading(false);
    form.reset();
    setAgreed({ payment: false, fee: false });
    setCvUrl(null);
    setDemoUrl(null);
  };

  return (
    <Layout>
      <SEOHead title="Become a Tutor" description="Join Webtuto and teach thousands of students across Sri Lanka." path="/tutor-application" />
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-14 sm:pb-20 border-b border-border/40">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-background to-accent/15" />
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-3xl -z-10" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-accent/20 blur-3xl -z-10" />
        <div className="absolute inset-0 bg-mesh opacity-40 -z-10" />
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" animate="show" variants={stagger} className="text-center space-y-4 sm:space-y-5">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong text-xs font-semibold text-primary tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Tutor Vacancy · Now Hiring
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground tracking-tight leading-[1.05]">
              Teach. <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Earn.</span> <br className="sm:hidden" />Inspire Sri Lanka.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join Webtuto's growing network of educators. Set your own schedule, reach thousands of students nationwide, and get paid for every session you deliver.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 pt-2">
              <a href="#apply" className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)] hover:scale-[1.02] active:scale-95 transition">
                Apply Now <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#perks" className="inline-flex items-center gap-2 px-6 h-12 rounded-full border border-border/60 bg-card/40 backdrop-blur font-semibold text-sm hover:border-primary/50 transition">
                See the perks
              </a>
            </motion.div>
          </motion.div>

          {/* Perks strip */}
          <motion.div
            id="perks"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { icon: DollarSign, title: "Competitive Earnings", body: "Set your own rates. Get paid per booked session — no hidden cuts." },
              { icon: CalendarClock, title: "Flexible Schedule", body: "Teach when you want — live, recorded or hybrid." },
              { icon: Users, title: "Wide Reach", body: "Thousands of students across National, Cambridge & Edexcel." },
              { icon: ShieldCheck, title: "Trusted Platform", body: "Secure payments, automatic reminders, and a real support team." },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative rounded-2xl p-4 sm:p-5 bg-card/60 backdrop-blur border border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 ring-1 ring-primary/20 group-hover:scale-110 transition">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-foreground">{p.title}</h3>
                <p className="text-xs sm:text-[13px] text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div id="apply" className="relative bg-mesh pt-12 sm:pt-16 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Application Form</h2>
            <p className="text-sm text-muted-foreground mt-2">Takes about 3 minutes. We review every submission within 48 hours.</p>
          </div>

          <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 md:p-8 space-y-6 ring-glow">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Your full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" placeholder="Your age" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Your address" required />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="your@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="+94 XX XXX XXXX" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Teaching Experience</Label>
              <Textarea id="experience" name="experience" placeholder="Describe your teaching experience..." rows={3} required />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjects">Subjects You Can Teach</Label>
                <Input id="subjects" name="subjects" placeholder="e.g., Maths, Science" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxGrade">Maximum Grade Level</Label>
                <Input id="maxGrade" name="maxGrade" placeholder="e.g., A/L" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onlineYears">Online Teaching Experience (years)</Label>
              <Input id="onlineYears" name="onlineYears" type="number" placeholder="0" required />
            </div>

            <div className="space-y-3">
              <Label>Curriculum</Label>
              <div className="flex flex-wrap gap-4">
                {["National", "Cambridge", "Edexcel"].map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox /> {c}
                  </label>
                ))}
              </div>
            </div>

            {/* File uploads */}
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="font-display font-semibold text-foreground">Upload Documents</h3>
              {!user && <p className="text-sm text-amber-600">Please log in to upload files, or paste a link instead.</p>}
              <FileOrLinkInput
                value={cvUrl}
                onChange={setCvUrl}
                bucket="applications"
                folder="cv"
                accept=".pdf,.doc,.docx"
                label="CV / Resume"
                linkPlaceholder="https://drive.google.com/... or direct link to your CV"
                uploadHint="Upload your CV (PDF, DOC)"
              />
              <FileOrLinkInput
                value={demoUrl}
                onChange={setDemoUrl}
                bucket="applications"
                folder="demo"
                accept="video/*,.mp4,.mov,.webm"
                label="Demo Teaching Recording"
                linkPlaceholder="https://youtube.com/watch?v=... or direct video link"
                uploadHint="Upload a demo teaching video"
                previewType="video"
              />
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="font-display font-semibold text-foreground">Agreements</h3>
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={agreed.payment}
                  onCheckedChange={(v) => setAgreed({ ...agreed, payment: !!v })}
                />
                <span>I understand and agree that I will not receive any payment unless a student books and pays for a session.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={agreed.fee}
                  onCheckedChange={(v) => setAgreed({ ...agreed, fee: !!v })}
                />
                <span>I agree that Webtuto may charge a commission or service fee.</span>
              </label>
            </div>

            <Button type="submit" size="lg" variant="premium" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </motion.form>
        </div>
      </div>
    </Layout>
  );
};

export default TutorApplicationPage;
