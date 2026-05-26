import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, KeyRound } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

const DashboardProfile = () => {
  const { user, profile, refreshProfile, updatePassword } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });
  const [passwords, setPasswords] = useState({ current: "", new_pw: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      address: form.address,
      updated_at: new Date().toISOString(),
    }).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      refreshProfile();
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_pw !== passwords.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    const { error } = await updatePassword(passwords.new_pw);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed!" });
      setPasswords({ current: "", new_pw: "", confirm: "" });
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6 max-w-2xl">
      <motion.h1 variants={fadeUp} className="font-display text-2xl md:text-3xl font-bold text-gradient">My Profile</motion.h1>

      <motion.section variants={fadeUp} className="relative glass-strong rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-secondary/15 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Personal Information</h2>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Admission Number</Label>
              <Input value={profile?.admission_number || ""} disabled className="bg-muted/60" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled className="bg-muted/60" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <Button type="submit" variant="premium" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </form>
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="relative glass-strong rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/25 to-primary/15 text-accent flex items-center justify-center ring-1 ring-accent/20">
              <KeyRound className="w-4 h-4" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={passwords.new_pw} onChange={(e) => setPasswords(p => ({ ...p, new_pw: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            <Button type="submit" variant="premium">Change Password</Button>
          </form>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default DashboardProfile;
