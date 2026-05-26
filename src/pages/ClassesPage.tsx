import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ClassCard from "@/components/ClassCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";
import { SkeletonCard } from "@/components/ui/skeleton";
import EmptyState from "@/components/premium/EmptyState";

const ClassesPage = () => {
  const [searchParams] = useSearchParams();
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subjectMeta, setSubjectMeta] = useState<{ name: string; gradeName: string } | null>(null);

  const subjectSlug = searchParams.get("subject");
  const gradeSlug = searchParams.get("grade");
  const teacherId = searchParams.get("teacher");

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      let q = supabase.from("classes").select("*, teachers(name), curriculums(name), grades(name, slug), subjects(name, slug)")
        .eq("is_active", true).order("created_at", { ascending: false });

      const { data } = await q;
      let classes = data || [];

      // Filter by subject/grade slugs if provided
      if (subjectSlug) {
        classes = classes.filter(c => c.subjects?.slug === subjectSlug);
      }
      if (gradeSlug) {
        classes = classes.filter(c => c.grades?.slug === gradeSlug);
      }
      if (teacherId) {
        classes = classes.filter(c => c.teacher_id === teacherId);
      }

      setDbClasses(classes);

      // Get subject/grade names for header
      if (subjectSlug && classes.length > 0) {
        const first = classes[0];
        setSubjectMeta({ name: first.subjects?.name || subjectSlug, gradeName: first.grades?.name || "" });
      } else if (subjectSlug) {
        // Fetch from subjects table directly
        const { data: subData } = await supabase.from("subjects").select("name, grade_id").eq("slug", subjectSlug).maybeSingle();
        if (subData) {
          const { data: gradeData } = await supabase.from("grades").select("name").eq("id", subData.grade_id).maybeSingle();
          setSubjectMeta({ name: subData.name, gradeName: gradeData?.name || "" });
        }
      } else {
        setSubjectMeta(null);
      }
      setLoading(false);
    };
    fetchClasses();
  }, [subjectSlug, gradeSlug, teacherId]);

  const filtered = dbClasses.filter(c => {
    const matchesQuery = !query || c.title.toLowerCase().includes(query.toLowerCase()) || (c.teachers?.name || "").toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === "all" || c.class_type === typeFilter;
    return matchesQuery && matchesType;
  });

  const types = ["all", "monthly", "hourly", "seminar", "workshop", "bundle", "recording"];

  const pageTitle = subjectMeta ? `${subjectMeta.name} — ${subjectMeta.gradeName}` : "All Classes";
  const pageDesc = subjectMeta ? `Browse ${subjectMeta.name} classes for ${subjectMeta.gradeName}` : "Browse live classes, seminars, workshops and more";

  return (
    <Layout>
      <SEOHead title={pageTitle} description={pageDesc} path="/classes" />
      <div className="pt-24 pb-20 relative">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-mesh opacity-60 pointer-events-none" />
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8 relative">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80 mb-3">
              <span className="h-px w-6 bg-primary/40" /> Discover
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2">{pageTitle}</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">{pageDesc}</p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 relative">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10 h-11 rounded-xl bg-card/60 backdrop-blur border-border/60" placeholder="Search classes..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex gap-1.5 flex-wrap overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              {types.map(t => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(t)}
                  className={`capitalize rounded-full h-9 px-4 shrink-0 ${typeFilter === t ? "shadow-md shadow-primary/20" : "bg-card/40 backdrop-blur border-border/60"}`}
                >
                  {t === "all" ? "All" : t}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 relative">{loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "class" : "classes"} found`}</p>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {filtered.map((c) => (
                <ClassCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  curriculum={c.curriculums?.name || "—"}
                  grade={c.grades?.name || "—"}
                  subject={c.subjects?.name || "—"}
                  teacherName={c.teachers?.name || "Tutor"}
                  classType={c.class_type}
                  price={Number(c.price)}
                  originalPrice={c.original_price ? Number(c.original_price) : undefined}
                  duration={c.duration_minutes ? `${c.duration_minutes} min` : undefined}
                  isLive={c.is_live}
                  description={c.short_description || c.description}
                  thumbnail={c.thumbnail_url}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState icon={BookOpen} title="No classes match your filters" description="Try clearing search or switching to a different category." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClassesPage;
