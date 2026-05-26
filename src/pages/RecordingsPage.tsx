import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, User, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";
import { SkeletonCard } from "@/components/ui/skeleton";
import EmptyState from "@/components/premium/EmptyState";

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    supabase.from("recordings").select("*, teachers(name)").eq("is_active", true).order("created_at", { ascending: false })
      .then(({ data }) => { setRecordings(data || []); setLoading(false); });
  }, []);

  // Build dynamic tabs from recording_type values
  const tabs = useMemo(() => {
    const types = new Set<string>();
    types.add("All");
    types.add("Recording");
    recordings.forEach(r => {
      if ((r as any).recording_type) types.add((r as any).recording_type);
    });
    return Array.from(types);
  }, [recordings]);

  const filtered = recordings.filter(r => {
    const matchesQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
    const type = (r as any).recording_type || "Recording";
    const matchesTab = activeTab === "All" || type === activeTab;
    return matchesQuery && matchesTab;
  });

  return (
    <Layout>
      <SEOHead title="Recording Store" description="Purchase and watch class recordings at your own pace on Webtuto." path="/recordings" />
      <div className="pt-20 sm:pt-24 pb-20 relative">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-mesh opacity-60 pointer-events-none" />
        <div className="container mx-auto px-3 sm:px-4">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-5 sm:mb-8 relative">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-primary/80 mb-2 sm:mb-3">
              <span className="h-px w-5 sm:w-6 bg-primary/40" /> Stream lessons
            </span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-1.5 sm:mb-2">Recording Library</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl">Watch cinematic class recordings at your own pace — anytime, anywhere.</p>
          </motion.div>

          <div className="relative max-w-md mb-4 sm:mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10 h-10 sm:h-11 rounded-xl bg-card/60 backdrop-blur border-border/60" placeholder="Search recordings..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {/* Filter tabs */}
          {tabs.length > 2 && (
            <div className="flex gap-1.5 mb-5 sm:mb-8 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {tabs.map(tab => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  size="sm"
                  className={`text-xs shrink-0 rounded-full h-8 sm:h-9 px-3.5 sm:px-4 ${activeTab === tab ? "shadow-md shadow-primary/20" : "bg-card/40 backdrop-blur border-border/60"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 relative">
              {filtered.map(r => {
                const hasPreview = !!(r as any).free_preview_url;
                const typeLabel = (r as any).recording_type || "Recording";
                return (
                  <motion.div key={r.id} variants={fadeUp} whileHover={{ y: -4 }}>
                  <Link to={`/recording/${r.id}`} className="block group h-full">
                    <Card className="overflow-hidden rounded-2xl bg-card/70 backdrop-blur-sm border-border/60 hover:ring-2 hover:ring-primary/30 transition-all h-full">
                      <div className="aspect-video bg-muted overflow-hidden relative">
                        {r.thumbnail_url ? (
                          <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/25 to-secondary/25">
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-foreground/70" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-2xl shadow-primary/40">
                            <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        {hasPreview && (
                          <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 inline-flex items-center gap-1 bg-accent text-accent-foreground text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg shadow-accent/30">
                            <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">Free </span>Preview
                          </span>
                        )}
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <Badge variant="outline" className="mb-1.5 sm:mb-2 text-[9px] sm:text-[10px] px-1.5 py-0 border-primary/30 bg-primary/5 text-primary">{typeLabel}</Badge>
                        <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-2 text-[13px] sm:text-base leading-snug group-hover:text-primary transition-colors">{r.title}</h3>
                        {r.teachers?.name && (
                          <p className="text-[11px] sm:text-sm text-muted-foreground mb-1 flex items-center gap-1 line-clamp-1">
                            <User className="w-3 h-3 shrink-0" /> {r.teachers.name}
                          </p>
                        )}
                        {r.duration_minutes && <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{r.duration_minutes} min</p>}
                        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border/60">
                          <span className="font-bold text-foreground text-[13px] sm:text-base">LKR {r.price}</span>
                          <span className="text-[11px] sm:text-sm font-medium text-primary">View →</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <EmptyState icon={Play} title="No recordings yet" description="Check back soon — new lessons drop every week." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecordingsPage;
