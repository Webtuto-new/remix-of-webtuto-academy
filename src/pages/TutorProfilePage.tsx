import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Calendar, ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClassCard from "@/components/ClassCard";
import EmptyState from "@/components/premium/EmptyState";
import { SkeletonCard } from "@/components/ui/skeleton";

const TutorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [tutor, setTutor] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: t }, { data: cls }, { data: recs }] = await Promise.all([
        supabase.from("teachers").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("classes")
          .select("*, curriculums(name), grades(name), subjects(name), teachers(name)")
          .eq("teacher_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("recordings")
          .select("*, curriculums(name), grades(name), subjects(name)")
          .eq("teacher_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      setTutor(t);
      setClasses(cls || []);
      setRecordings(recs || []);

      // Fetch upcoming + past sessions for these classes
      const classIds = (cls || []).map((c) => c.id);
      if (classIds.length) {
        const { data: ses } = await supabase
          .from("class_sessions")
          .select("*, classes(title)")
          .in("class_id", classIds)
          .order("session_date", { ascending: false })
          .limit(20);
        setSessions(ses || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter((s) => s.session_date >= today).reverse();
  const past = sessions.filter((s) => s.session_date < today);

  return (
    <Layout>
      <SEOHead
        title={tutor ? `${tutor.name} — Tutor Profile` : "Tutor Profile"}
        description={tutor?.bio || "Webtuto tutor profile"}
        path={`/tutor/${id}`}
      />

      {/* Hero */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-0">
          <div className="absolute top-10 -left-20 w-[420px] h-[420px] rounded-full bg-primary/25 blur-[140px] animate-float-blob" />
          <div className="absolute top-20 right-10 w-[380px] h-[380px] rounded-full bg-accent/15 blur-[130px] animate-float-blob" style={{ animationDelay: "-4s" }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <Link to="/classes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Classes
          </Link>

          {loading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="w-32 h-32 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-64 bg-muted rounded" />
                <div className="h-4 w-96 bg-muted rounded" />
              </div>
            </div>
          ) : !tutor ? (
            <EmptyState icon={GraduationCap} title="Tutor not found" description="This tutor profile does not exist." />
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-2 ring-accent/40 ring-offset-4 ring-offset-background bg-gradient-to-br from-primary/30 to-secondary/30 shadow-2xl">
                  {tutor.avatar_url ? (
                    <img src={tutor.avatar_url} alt={tutor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-5xl text-foreground/80">
                      {tutor.name?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase">Tutor</div>
                <h1 className="font-display text-3xl md:text-5xl font-extrabold text-gradient leading-tight">{tutor.name}</h1>
                {tutor.qualifications && (
                  <p className="text-sm md:text-base text-foreground/80 inline-flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-accent" /> {tutor.qualifications}
                  </p>
                )}
                {tutor.bio && (
                  <p className="text-foreground/70 leading-relaxed max-w-3xl">{tutor.bio}</p>
                )}
                <div className="flex flex-wrap gap-3 pt-3">
                  <div className="px-4 py-2 rounded-xl glass-strong">
                    <div className="text-2xl font-display font-bold text-foreground">{classes.length}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Active Classes</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl glass-strong">
                    <div className="text-2xl font-display font-bold text-foreground">{recordings.length}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Recordings</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl glass-strong">
                    <div className="text-2xl font-display font-bold text-foreground">{upcoming.length}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Upcoming</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Classes */}
      <section className="container mx-auto px-4 py-10 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          <h2 className="font-display text-2xl font-bold text-foreground">Classes</h2>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : classes.length === 0 ? (
          <EmptyState icon={BookOpen} title="No classes yet" description="This tutor hasn't published any classes yet." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((c) => (
              <ClassCard
                key={c.id}
                id={c.id}
                title={c.title}
                curriculum={c.curriculums?.name || "—"}
                grade={c.grades?.name || "—"}
                subject={c.subjects?.name || "—"}
                teacherName={tutor?.name || "Tutor"}
                classType={c.class_type}
                price={Number(c.price)}
                originalPrice={c.original_price ? Number(c.original_price) : undefined}
                duration={c.duration_minutes ? `${c.duration_minutes} min` : undefined}
                isLive={c.is_live}
                description={c.short_description || c.description}
                thumbnail={c.thumbnail_url}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recordings */}
      {recordings.length > 0 && (
        <section className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-accent" />
            <h2 className="font-display text-2xl font-bold text-foreground">Recorded Lessons</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((r) => (
              <Link key={r.id} to={`/recording/${r.id}`} className="block rounded-xl overflow-hidden glass-strong hover:ring-2 hover:ring-accent transition-all group">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {r.thumbnail_url ? (
                    <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30 p-4">
                      <span className="font-display font-bold text-foreground/70 text-center line-clamp-3">{r.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-display font-bold text-foreground line-clamp-2">{r.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    {r.grades?.name} {r.subjects?.name && `· ${r.subjects.name}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sessions */}
      <section className="container mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <h2 className="font-display text-xl font-bold text-foreground">Upcoming Sessions</h2>
          </div>
          <div className="glass-strong rounded-xl divide-y divide-border/40 overflow-hidden">
            {upcoming.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No upcoming sessions</div>
            ) : (
              upcoming.slice(0, 8).map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground line-clamp-1">{s.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{s.classes?.title}</div>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <div className="text-foreground font-semibold">{new Date(s.session_date).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">{s.start_time?.slice(0, 5)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display text-xl font-bold text-foreground">Past Sessions</h2>
          </div>
          <div className="glass-strong rounded-xl divide-y divide-border/40 overflow-hidden">
            {past.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No past sessions</div>
            ) : (
              past.slice(0, 8).map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground line-clamp-1">{s.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{s.classes?.title}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    {new Date(s.session_date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TutorProfilePage;