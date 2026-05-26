import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, FileText, Video, ExternalLink, UserCheck } from "lucide-react";
import EmptyState from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const AdminApplications = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const { toast } = useToast();

  const fetchApps = () => {
    supabase.from("tutor_applications").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setApps(data || []));
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tutor_applications").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Application ${status}` }); fetchApps(); if (selected?.id === id) setSelected((s: any) => ({ ...s, status })); }
  };

  const statusBadge = (status: string) => {
    const cls = status === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
      status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30" :
      "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${cls}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-gradient">Tutor Applications</h1>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong border-border/50">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-gradient">
                  {selected.name} {statusBadge(selected.status)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <p className="text-muted-foreground">Email: <span className="text-foreground">{selected.email}</span></p>
                  <p className="text-muted-foreground">Phone: <span className="text-foreground">{selected.phone}</span></p>
                  <p className="text-muted-foreground">Age: <span className="text-foreground">{selected.age || "—"}</span></p>
                  <p className="text-muted-foreground">Address: <span className="text-foreground">{selected.address || "—"}</span></p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground">Teaching Background</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <p className="text-muted-foreground">Subjects: <span className="text-foreground">{selected.subjects_can_teach || "—"}</span></p>
                    <p className="text-muted-foreground">Max Grade: <span className="text-foreground">{selected.max_grade_level || "—"}</span></p>
                    <p className="text-muted-foreground">Online Years: <span className="text-foreground">{selected.online_teaching_years || 0}</span></p>
                    <p className="text-muted-foreground">Curriculum: <span className="text-foreground">
                      {[selected.curriculum_national && "National", selected.curriculum_london && "London"].filter(Boolean).join(", ") || "—"}
                    </span></p>
                  </div>
                  {selected.teaching_experience && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Experience:</p>
                      <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selected.teaching_experience}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground">Uploaded Documents</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selected.cv_url ? (
                      <a href={selected.cv_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">CV / Resume</p>
                          <p className="text-xs text-muted-foreground truncate">{selected.cv_url.split("/").pop()}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 ml-auto group-hover:text-primary" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border">
                        <FileText className="w-5 h-5 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No CV uploaded</p>
                      </div>
                    )}
                    {selected.demo_recording_url ? (
                      <a href={selected.demo_recording_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                          <Video className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Demo Recording</p>
                          <p className="text-xs text-muted-foreground truncate">{selected.demo_recording_url.split("/").pop()}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 ml-auto group-hover:text-primary" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border">
                        <Video className="w-5 h-5 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No demo uploaded</p>
                      </div>
                    )}
                  </div>

                  {selected.demo_recording_url && (
                    selected.demo_recording_url.includes("youtube.com") || selected.demo_recording_url.includes("youtu.be") ? (
                      <div className="aspect-video rounded-xl overflow-hidden border border-border/60">
                        <iframe
                          src={selected.demo_recording_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : selected.demo_recording_url.match(/\.(mp4|webm|mov)/) ? (
                      <div className="aspect-video rounded-xl overflow-hidden border border-border/60 bg-foreground/5">
                        <video controls className="w-full h-full" src={selected.demo_recording_url} controlsList="nodownload" />
                      </div>
                    ) : null
                  )}
                </div>

                <div className="text-xs text-muted-foreground border-t border-border pt-4 flex gap-4">
                  <span>Payment terms: {selected.agreed_payment_terms ? "✅ Agreed" : "❌ Not agreed"}</span>
                  <span>Platform fee: {selected.agreed_platform_fee ? "✅ Agreed" : "❌ Not agreed"}</span>
                </div>

                {selected.status === "pending" && (
                  <div className="flex gap-3 border-t border-border pt-4">
                    <Button onClick={() => updateStatus(selected.id, "approved")} variant="premium" className="flex-1 gap-1">
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => updateStatus(selected.id, "rejected")} className="flex-1 gap-1">
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Applied: {new Date(selected.created_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {apps.length === 0 ? (
        <EmptyState icon={UserCheck} title="No applications yet" description="Tutor applications will appear here once submitted." />
      ) : (
        <Card className="glass-strong border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Subjects</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">CV</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Demo</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {apps.map((a) => (
                    <motion.tr key={a.id} variants={fadeUp} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors group">
                      <td className="p-4 font-medium text-foreground">{a.name}</td>
                      <td className="p-4 text-muted-foreground">{a.email}</td>
                      <td className="p-4 text-muted-foreground text-xs max-w-[120px] truncate">{a.subjects_can_teach || "—"}</td>
                      <td className="p-4">
                        {a.cv_url ? (
                          <a href={a.cv_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3" /> View
                          </a>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="p-4">
                        {a.demo_recording_url ? (
                          <a href={a.demo_recording_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                            <Video className="w-3 h-3" /> View
                          </a>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="p-4">{statusBadge(a.status)}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary text-xs gap-1" onClick={() => setSelected(a)}>
                            <Eye className="w-3 h-3" /> Review
                          </Button>
                          {a.status === "pending" && (
                            <>
                              <Button variant="ghost" size="sm" className="hover:bg-emerald-500/10 hover:text-emerald-400 text-xs text-emerald-400" onClick={() => updateStatus(a.id, "approved")}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive text-xs text-destructive" onClick={() => updateStatus(a.id, "rejected")}>
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminApplications;
