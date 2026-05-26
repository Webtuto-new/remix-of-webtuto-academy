import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Play, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import EmptyState from "@/components/premium/EmptyState";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    supabase.from("classes").select("*, teachers(name)").eq("is_active", true).then(({ data }) => setClasses(data || []));
    supabase.from("recordings").select("*, teachers(name)").eq("is_active", true).then(({ data }) => setRecordings(data || []));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let results: any[] = [];
    if (typeFilter === "all" || typeFilter === "classes") {
      results.push(...classes.filter(c =>
        c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.teachers?.name?.toLowerCase().includes(q)
      ).map(c => ({ ...c, _type: "class" })));
    }
    if (typeFilter === "all" || typeFilter === "recordings") {
      results.push(...recordings.filter(r =>
        r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      ).map(r => ({ ...r, _type: "recording" })));
    }
    return results;
  }, [query, classes, recordings, typeFilter]);

  return (
    <Layout>
      <SEOHead title="Search" description="Search classes, recordings, and teachers on Webtuto." path="/search" />
      <div className="relative pt-24 pb-20 min-h-screen">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-mesh opacity-60 pointer-events-none" />
        <div className="absolute top-10 -left-20 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[140px] animate-float-blob pointer-events-none" />
        <div className="absolute top-20 right-0 w-[360px] h-[360px] rounded-full bg-accent/15 blur-[130px] animate-float-blob pointer-events-none" style={{ animationDelay: "-4s" }} />

        <div className="container mx-auto px-4 relative">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Find anything
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2">Search Webtuto</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">Explore live classes, recorded lessons, and expert tutors — all in one place.</p>
          </motion.div>

          <div className="relative max-w-2xl mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <Input
              autoFocus
              className="pl-12 pr-12 h-14 rounded-2xl bg-card/60 backdrop-blur border-border/60 text-base shadow-lg shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder="Search classes, recordings, teachers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground" aria-label="Clear">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
            {["all", "classes", "recordings"].map(t => (
              <Button
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(t)}
                className={`capitalize text-xs shrink-0 rounded-full h-9 px-4 ${typeFilter === t ? "shadow-md shadow-primary/20" : "bg-card/40 backdrop-blur border-border/60"}`}
              >
                {t}
              </Button>
            ))}
          </div>

          {query && (
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""} for "{query}"
            </p>
          )}

          {filtered.length > 0 ? (
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((item) => {
                const isClass = item._type === "class";
                return (
                  <motion.div key={`${item._type}-${item.id}`} variants={fadeUp} whileHover={{ y: -4 }}>
                    <Link to={isClass ? `/class/${item.id}` : `/recording/${item.id}`} className="block h-full group">
                      <Card className="overflow-hidden h-full rounded-2xl bg-card/70 backdrop-blur-sm border-border/60 hover:ring-2 hover:ring-primary/30 transition-all">
                        {item.thumbnail_url && (
                          <div className="aspect-video bg-muted overflow-hidden relative">
                            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${
                            isClass ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-secondary/15 text-secondary ring-1 ring-secondary/30"
                          }`}>
                            {isClass ? <BookOpen className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                            {isClass ? "Class" : "Recording"}
                          </span>
                          <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description || item.short_description || ""}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-border/60">
                            <span className="font-bold text-foreground text-sm">LKR {Number(item.price).toLocaleString()}</span>
                            {item.teachers?.name && <span className="text-xs text-muted-foreground truncate ml-2">{item.teachers.name}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : query ? (
            <EmptyState icon={Search} title="No matches found" description={`We couldn't find anything for "${query}". Try a different keyword.`} />
          ) : (
            <EmptyState icon={Sparkles} title="Start typing to search" description="Find classes, recordings, and tutors across the entire Webtuto library." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
