import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Radio, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function QuizJoinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!user) { toast.error("Please log in first"); return navigate("/login"); }
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) return toast.error("Enter the 6-character code");
    setLoading(true);
    const { data: session } = await supabase
      .from("quiz_live_sessions")
      .select("id, quiz_id, status")
      .eq("join_code", trimmed)
      .in("status", ["waiting", "active", "paused"])
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (!session) {
      setLoading(false);
      return toast.error("No active session for that code");
    }
    await supabase.from("quiz_live_participants").upsert(
      { live_session_id: session.id, user_id: user.id, status: "waiting" } as any,
      { onConflict: "live_session_id,user_id" } as any
    );
    navigate(`/quizzes/live/${session.id}`);
  };

  return (
    <Layout>
      <SEOHead title="Join Live Quiz — Webtuto" description="Enter a join code to join your tutor's live quiz." path="/quizzes/join" />
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-4">
              <Radio className="w-7 h-7" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">Join Live Quiz</h1>
            <p className="text-muted-foreground mt-2 text-sm">Enter the 6-character code from your tutor.</p>
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="pl-9 h-14 text-center text-2xl font-mono tracking-[0.5em] font-bold uppercase"
                maxLength={6}
              />
            </div>
            <Button onClick={join} disabled={loading || code.length !== 6} variant="premium" className="w-full h-12">
              {loading ? "Joining…" : "Join Quiz"}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}