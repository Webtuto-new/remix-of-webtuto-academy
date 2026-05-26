import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";

const PhonePrompt = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const show = !!user && !!profile && !profile.phone;

  const handleSave = async () => {
    if (!phone.trim()) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ phone: phone.trim() }).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Phone number saved!" });
      await refreshProfile();
    }
  };

  return (
    <Dialog open={show}>
      <DialogContent className="sm:max-w-md glass-strong border-border/60 ring-glow overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <DialogHeader className="relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center mb-2 ring-1 ring-primary/30">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-xl">One last step</DialogTitle>
          <DialogDescription className="text-center">
            We need your phone number to keep you updated about your classes and important announcements.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2 relative">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              type="tel"
              placeholder="e.g. 07X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} variant="premium" className="w-full">
            {saving ? "Saving..." : "Save Phone Number"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhonePrompt;
