import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const DashboardCertificates = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("certificates").select("*, classes(title)").eq("user_id", user.id).order("issued_at", { ascending: false })
      .then(({ data }) => setCerts(data || []));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">My Certificates</h1>
      {certs.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" description="Complete a class to earn your first certificate." />
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 gap-4">
          {certs.map(c => (
            <motion.div
              key={c.id}
              variants={fadeUp}
              className="relative overflow-hidden glass-strong rounded-2xl p-7 text-center transition-all hover:ring-glow hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
              <div className="relative">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 text-accent flex items-center justify-center mb-3 ring-1 ring-accent/30">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{c.title}</h3>
                {(c as any).classes?.title && <p className="text-sm text-muted-foreground mb-2">{(c as any).classes.title}</p>}
                <p className="text-xs font-mono text-muted-foreground">{c.certificate_number}</p>
                <p className="text-xs text-muted-foreground mt-1">Issued: {new Date(c.issued_at).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardCertificates;
