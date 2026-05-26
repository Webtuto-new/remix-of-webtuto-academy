import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, Star, BookOpen, ArrowRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";
import { SkeletonCard } from "@/components/ui/skeleton";
import EmptyState from "@/components/premium/EmptyState";

interface TutorRow {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  qualifications: string | null;
}

interface TutorStats {
  classCount: number;
  recordingCount: number;
  studentCount: number;
  avgRating: number;
  reviewCount: number;
  curriculums: string[];
  subjects: string[];
}

const TutorsPage = () => {
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [stats, setStats] = useState<Record<string, TutorStats>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [curriculumFilter, setCurriculumFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: ts }, { data: cls }, { data: recs }, { data: revs }, { data: enrolls }] =
        await Promise.all([
          supabase.from("teachers").select("*").eq("is_active", true).order("name"),
          supabase
            .from("classes")
            .select("id, teacher_id, curriculums(name), subjects(name)")
            .eq("is_active", true),
          supabase.from("recordings").select("id, teacher_id").eq("is_active", true),
          supabase.from("reviews").select("rating, class_id"),
          supabase.from("enrollments").select("user_id, class_id, recording_id").eq("status", "active"),
        ]);

      const tutorList = (ts || []) as TutorRow[];
      // Dedupe by normalized name to hide legacy duplicates
      const seen = new Set<string>();
      const unique = tutorList.filter((t) => {
        const key = (t.name || "").trim().toLowerCase().replace(/\s+/g, " ");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setTutors(unique);

      // class_id -> teacher_id map
      const classToTeacher: Record<string, string> = {};
      const recToTeacher: Record<string, string> = {};
      (cls || []).forEach((c: any) => {
        if (c.teacher_id) classToTeacher[c.id] = c.teacher_id;
      });
      (recs || []).forEach((r: any) => {
        if (r.teacher_id) recToTeacher[r.id] = r.teacher_id;
      });

      const s: Record<string, TutorStats> = {};
      tutorList.forEach((t) => {
        s[t.id] = {
          classCount: 0,
          recordingCount: 0,
          studentCount: 0,
          avgRating: 0,
          reviewCount: 0,
          curriculums: [],
          subjects: [],
        };
      });

      const curriculumSet: Record<string, Set<string>> = {};
      const subjectSet: Record<string, Set<string>> = {};
      (cls || []).forEach((c: any) => {
        if (!c.teacher_id || !s[c.teacher_id]) return;
        s[c.teacher_id].classCount += 1;
        if (c.curriculums?.name) {
          (curriculumSet[c.teacher_id] ||= new Set()).add(c.curriculums.name);
        }
        if (c.subjects?.name) {
          (subjectSet[c.teacher_id] ||= new Set()).add(c.subjects.name);
        }
      });
      (recs || []).forEach((r: any) => {
        if (r.teacher_id && s[r.teacher_id]) s[r.teacher_id].recordingCount += 1;
      });

      // students per teacher (unique users)
      const studentSet: Record<string, Set<string>> = {};
      (enrolls || []).forEach((e: any) => {
        const tid = (e.class_id && classToTeacher[e.class_id]) || (e.recording_id && recToTeacher[e.recording_id]);
        if (!tid || !s[tid]) return;
        (studentSet[tid] ||= new Set()).add(e.user_id);
      });

      // ratings
      const ratings: Record<string, { sum: number; count: number }> = {};
      (revs || []).forEach((r: any) => {
        const tid = classToTeacher[r.class_id];
        if (!tid) return;
        const cur = (ratings[tid] ||= { sum: 0, count: 0 });
        cur.sum += r.rating;
        cur.count += 1;
      });

      Object.keys(s).forEach((tid) => {
        s[tid].studentCount = studentSet[tid]?.size || 0;
        s[tid].reviewCount = ratings[tid]?.count || 0;
        s[tid].avgRating = ratings[tid] ? ratings[tid].sum / ratings[tid].count : 0;
        s[tid].curriculums = Array.from(curriculumSet[tid] || []);
        s[tid].subjects = Array.from(subjectSet[tid] || []);
      });

      setStats(s);
      setLoading(false);
    })();
  }, []);

  const allCurriculums = useMemo(() => {
    const set = new Set<string>();
    Object.values(stats).forEach((s) => s.curriculums.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [stats]);

  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    Object.values(stats).forEach((s) => s.subjects.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [stats]);

  const filtered = tutors.filter((t) => {
    const st = stats[t.id];
    const matchQ =
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.qualifications || "").toLowerCase().includes(query.toLowerCase()) ||
      (t.bio || "").toLowerCase().includes(query.toLowerCase());
    const matchC = curriculumFilter === "all" || st?.curriculums.includes(curriculumFilter);
    const matchS = subjectFilter === "all" || st?.subjects.includes(subjectFilter);
    return matchQ && matchC && matchS;
  });

  return (
    <Layout>
      <SEOHead
        title="Meet Our Tutors — WebTuto"
        description="Browse expert tutors across Sri Lankan & Cambridge curricula. Find the right teacher for live classes, recorded lessons, and one-on-one help."
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl -z-10" />
        <div className="container py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-4 rounded-full backdrop-blur">
              <GraduationCap className="w-3 h-3 mr-1.5" /> {tutors.length} Verified Tutors
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Meet the minds <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                shaping young Sri Lanka
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Hand-picked, qualified educators delivering live lessons, recorded series and personalised guidance for
              Local, Cambridge and Edexcel students.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border/40 sticky top-16 z-30 bg-background/80 backdrop-blur-xl">
        <div className="container py-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tutor name, subject, qualification…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={curriculumFilter}
              onChange={(e) => setCurriculumFilter(e.target.value)}
              className="h-11 px-3 rounded-md border border-input bg-background text-sm min-w-[140px]"
            >
              <option value="all">All Curriculums</option>
              {allCurriculums.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-11 px-3 rounded-md border border-input bg-background text-sm min-w-[140px]"
            >
              <option value="all">All Subjects</option>
              {allSubjects.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No tutors match your filters"
            description="Try clearing filters or searching a different subject."
          />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((t) => {
              const st = stats[t.id] || ({} as TutorStats);
              return (
                <motion.div key={t.id} variants={fadeUp}>
                  <Link
                    to={`/tutor/${t.id}`}
                    className="group block relative h-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                  >
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
                    <div className="relative p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-background bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <GraduationCap className="w-8 h-8 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors truncate">
                            {t.name}
                          </h3>
                          {t.qualifications && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.qualifications}</p>
                          )}
                          {st.reviewCount > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                              <span className="text-xs font-semibold">{st.avgRating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({st.reviewCount})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {t.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{t.bio}</p>
                      )}

                      {st.subjects && st.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {st.subjects.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] font-medium">{s}</Badge>
                          ))}
                          {st.subjects.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">+{st.subjects.length - 3}</Badge>
                          )}
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-border/40 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-primary">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="font-bold text-sm">{st.classCount || 0}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Classes</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-accent">
                            <span className="font-bold text-sm">{st.recordingCount || 0}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Lessons</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span className="font-bold text-sm">{st.studentCount || 0}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Students</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View profile</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </Layout>
  );
};

export default TutorsPage;