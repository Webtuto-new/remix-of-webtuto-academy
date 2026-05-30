import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Info, ChevronLeft, ChevronRight, Radio, GraduationCap, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import LiveStats from "@/components/home/LiveStats";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import HomePreloader from "@/components/home/HomePreloader";

type ClassRow = any;

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const getNextOccurrence = (day?: string | null, time?: string | null): Date | null => {
  if (!day || !time) return null;
  const targetDow = DAYS.indexOf(day.toLowerCase());
  if (targetDow < 0) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m || 0, 0, 0);
  let diff = targetDow - now.getDay();
  if (diff < 0 || (diff === 0 && target.getTime() < now.getTime())) diff += 7;
  target.setDate(now.getDate() + diff);
  return target;
};

const useCountdown = (target: Date | null) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target?.getTime()]);
  if (!target) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return "LIVE NOW";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${min}m`;
  if (min > 0) return `${min}m ${s}s`;
  return `${s}s`;
};

const HeroFeature = ({ items }: { items: ClassRow[] }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);
  const c = items[idx];
  if (!c) return null;
  const bg = c.thumbnail_url;
  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
      {/* Education-themed hero background image */}
      <img src={heroBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      {/* Light mode overlay — darken for text readability */}
      <div className="absolute inset-0 bg-black/40 dark:hidden" />
      {/* Dark mode overlay — subtle tint */}
      <div className="absolute inset-0 bg-black/20 hidden dark:block" />
      <div className="absolute inset-0 bg-mesh opacity-30 dark:opacity-40 mix-blend-overlay" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-[480px] h-[480px] rounded-full bg-primary/30 blur-[140px] animate-float-blob" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-accent/20 blur-[160px] animate-float-blob" style={{ animationDelay: "-5s" }} />
        <div className="absolute top-0 right-1/4 w-[360px] h-[360px] rounded-full bg-secondary/25 blur-[120px] animate-float-blob" style={{ animationDelay: "-2s" }} />
      </div>
      <AnimatePresence mode="sync">
        <motion.div
          key={c.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {bg ? (
            <img src={bg} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-secondary/20" />
          )}
          {/* Netflix-like gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
          {/* Subtle noise/grain via radial dots */}
          <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "3px 3px" }} />
        </motion.div>
      </AnimatePresence>

      <div className="relative h-full container mx-auto px-4 sm:px-8 flex items-end pb-28 sm:pb-36">
        <motion.div
          key={c.id + "-text"}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl space-y-5"
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-accent uppercase">
            <span className="inline-block w-8 h-px bg-accent" /> Featured Class
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground leading-[1.05] tracking-tight drop-shadow-2xl">
            {c.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/80">
            {c.is_live && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/90 text-destructive-foreground font-bold text-xs">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE
              </span>
            )}
            {c.curriculums?.name && <span className="px-2 py-0.5 rounded border border-foreground/20">{c.curriculums.name}</span>}
            {c.grades?.name && <span>{c.grades.name}</span>}
            {c.subjects?.name && <span>· {c.subjects.name}</span>}
            {c.teachers?.name && <span>· {c.teachers.name}</span>}
          </div>
          <p className="text-base sm:text-lg text-foreground/75 max-w-xl line-clamp-3 leading-relaxed">
            {c.short_description || c.description || "Master your syllabus with curated lessons from Sri Lanka's top tutors."}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to={`/class/${c.id}`}>
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2 font-bold px-8">
                <Play className="w-5 h-5 fill-current" /> Watch Now
              </Button>
            </Link>
            <Link to={`/class/${c.id}`}>
              <Button size="lg" variant="secondary" className="bg-foreground/20 backdrop-blur-md text-foreground hover:bg-foreground/30 gap-2 font-bold px-8 border-0">
                <Info className="w-5 h-5" /> More Info
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Pagination dots */}
      {items.length > 1 && (
        <div className="absolute bottom-24 right-8 hidden md:flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all ${i === idx ? "w-8 bg-foreground" : "w-4 bg-foreground/30"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const Row = ({ title, items }: { title: string; items: ClassRow[] }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  if (!items.length) return null;
  return (
    <section className="relative group/row py-6">
      <div className="container mx-auto px-4 sm:px-8 mb-3 flex items-end justify-between">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 sm:w-16 flex items-center justify-center bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-8 h-8 text-foreground" />
        </button>
        <div
          ref={scroller}
          className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth px-8 sm:px-12 lg:px-16 pt-6 pb-10 snap-x snap-mandatory scroll-pl-8 sm:scroll-pl-12 lg:scroll-pl-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((c) => (
            <RowCard key={c.id} c={c} />
          ))}
        </div>
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 sm:w-16 flex items-center justify-center bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-8 h-8 text-foreground" />
        </button>
      </div>
    </section>
  );
};

const RowCard = ({ c }: { c: ClassRow }) => {
  const next = useMemo(() => getNextOccurrence(c.schedule_day, c.schedule_time), [c.schedule_day, c.schedule_time]);
  const countdown = useCountdown(next);
  return (
    <Link
      to={`/class/${c.id}`}
      className="snap-start shrink-0 w-[78vw] xs:w-[60vw] sm:w-[300px] md:w-[320px] lg:w-[340px] xl:w-[360px] max-w-[380px] group/card relative outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
    >
      <motion.div
        whileHover={{ scale: 1.04, zIndex: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative rounded-md overflow-hidden bg-card aspect-video shadow-lg ring-1 ring-foreground/5 hover:ring-2 hover:ring-primary hover:shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.5)]"
      >
        {c.thumbnail_url ? (
          <img src={c.thumbnail_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover/card:opacity-100 transition" />
        {c.is_live && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-[10px] font-bold tracking-wider shadow-[0_0_18px_hsl(var(--destructive)/0.7)] ring-1 ring-destructive/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
            </span>
            LIVE
          </span>
        )}
        {!c.is_live && countdown && countdown !== "LIVE NOW" && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background/80 backdrop-blur text-foreground text-[10px] font-bold tracking-wider ring-1 ring-border/60">
            <Clock className="w-2.5 h-2.5 text-primary" /> {countdown}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 space-y-1.5">
          <h3 className="font-display font-bold text-sm sm:text-base lg:text-lg text-foreground line-clamp-2 leading-tight">{c.title}</h3>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-foreground/70">
            {c.grades?.name && <span>{c.grades.name}</span>}
            {c.subjects?.name && <span>· {c.subjects.name}</span>}
          </div>
          {c.teachers?.name && (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-foreground/60">
              <GraduationCap className="w-3 h-3 text-accent" />
              <span className="truncate">{c.teachers.name}</span>
            </div>
          )}
          <div className="opacity-0 group-hover/card:opacity-100 transition flex items-center gap-2 pt-1">
            <span className="text-accent text-sm font-bold">Rs. {Number(c.price).toLocaleString()}</span>
            {c.original_price && Number(c.original_price) > Number(c.price) && (
              <span className="text-[11px] line-through text-foreground/50">Rs. {Number(c.original_price).toLocaleString()}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const Index = () => {
  return <IndexInner />;
};

const TutorRow = ({ title, tutors }: { title: string; tutors: any[] }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section className="relative group/row py-6">
      <div className="container mx-auto px-4 sm:px-8 mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          {title} <span className="text-muted-foreground/70 font-normal text-sm">({tutors.length})</span>
        </h2>
        <Link to="/tutors" className="text-xs sm:text-sm text-primary hover:underline font-semibold whitespace-nowrap shrink-0">
          View all →
        </Link>
      </div>
      <div className="relative">
        <button onClick={() => scroll(-1)} className="hidden sm:flex absolute left-0 top-0 bottom-0 z-20 w-12 sm:w-16 items-center justify-center bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" aria-label="Scroll left">
          <ChevronLeft className="w-8 h-8 text-foreground" />
        </button>
        <div ref={scroller} className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth px-4 sm:px-8 lg:px-12 pb-6 snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-8 lg:scroll-pl-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tutors.map((t) => (
            <Link key={t.id} to={`/tutor/${t.id}`} className="snap-start shrink-0 w-[170px] sm:w-[200px] lg:w-[220px] group/tutor">
              <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-card to-muted/40 ring-1 ring-foreground/10 hover:ring-2 hover:ring-accent shadow-lg p-5 text-center h-full">
                <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-2 ring-accent/40 ring-offset-2 ring-offset-background bg-gradient-to-br from-primary/30 to-secondary/30">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-foreground/80">
                      {t.name?.charAt(0) || "T"}
                    </div>
                  )}
                </div>
                <h3 className="font-display font-bold text-sm text-foreground line-clamp-1">{t.name}</h3>
                {t.qualifications && (
                  <p className="text-[11px] text-foreground/60 line-clamp-2 mt-1">{t.qualifications}</p>
                )}
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-accent font-semibold opacity-0 group-hover/tutor:opacity-100 transition">
                  View Classes <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        <button onClick={() => scroll(1)} className="hidden sm:flex absolute right-0 top-0 bottom-0 z-20 w-12 sm:w-16 items-center justify-center bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" aria-label="Scroll right">
          <ChevronRight className="w-8 h-8 text-foreground" />
        </button>
        {/* Mobile swipe hint */}
        <div className="sm:hidden absolute top-2 right-4 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur text-[10px] font-semibold text-muted-foreground pointer-events-none">
          Swipe <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </section>
  );
};

const GradeRail = ({ title, grades }: { title: string; grades: any[] }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  if (!grades.length) return null;
  return (
    <section className="relative group/row py-6">
      <div className="container mx-auto px-4 sm:px-8 mb-3 flex items-end justify-between">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
        <Link to="/curriculum" className="text-xs sm:text-sm text-primary hover:underline font-semibold">
          View all →
        </Link>
      </div>
      <div className="relative">
        <button onClick={() => scroll(-1)} className="absolute left-0 top-0 bottom-0 z-20 w-12 sm:w-16 flex items-center justify-center bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" aria-label="Scroll left">
          <ChevronLeft className="w-8 h-8 text-foreground" />
        </button>
        <div ref={scroller} className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth px-4 sm:px-8 lg:px-12 pb-6 snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-8 lg:scroll-pl-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {grades.map((g) => (
            <Link
              key={g.id}
              to={`/curriculum?grade=${g.slug}`}
              className="snap-start shrink-0 w-[160px] sm:w-[200px] lg:w-[220px] group/grade"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="relative h-[140px] sm:h-[170px] rounded-2xl overflow-hidden p-5 flex flex-col justify-between ring-1 ring-foreground/10 hover:ring-2 hover:ring-primary shadow-lg bg-gradient-to-br from-primary/25 via-card to-accent/20"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/30 blur-2xl opacity-60 group-hover/grade:opacity-100 transition" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent/25 blur-2xl opacity-50" />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/40 backdrop-blur text-[10px] font-bold tracking-wider uppercase text-foreground/80">
                    <GraduationCap className="w-3 h-3" /> Grade
                  </span>
                </div>
                <div className="relative">
                  <h3 className="font-display font-bold text-lg sm:text-xl text-foreground leading-tight line-clamp-2">{g.name}</h3>
                  {g.curriculums?.name && (
                    <p className="text-[11px] sm:text-xs text-foreground/70 mt-1 line-clamp-1">{g.curriculums.name}</p>
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        <button onClick={() => scroll(1)} className="absolute right-0 top-0 bottom-0 z-20 w-12 sm:w-16 flex items-center justify-center bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" aria-label="Scroll right">
          <ChevronRight className="w-8 h-8 text-foreground" />
        </button>
      </div>
    </section>
  );
};

const IndexInner = () => {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("classes")
      .select("*, teachers(name), curriculums(name,slug), grades(name), subjects(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => setClasses(data || []));
    supabase.from("curriculums").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setCurriculums(data || []));
    supabase.from("teachers").select("id,name,bio,avatar_url,qualifications").eq("is_active", true).order("name")
      .then(({ data }) => {
        // Dedupe by normalized name (DB has a few legacy duplicates with trailing spaces)
        const seen = new Set<string>();
        const unique = (data || []).filter((t: any) => {
          const key = (t.name || "").trim().toLowerCase().replace(/\s+/g, " ");
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setTeachers(unique);
      });
    supabase
      .from("grades")
      .select("id,name,slug,curriculum_id,curriculums(name,slug)")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setGrades(data || []));
  }, []);

  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const featured = useMemo(() => {
    const f = classes.filter((c) => c.is_featured);
    return (f.length ? f : classes).slice(0, 5);
  }, [classes]);

  const liveNow = useMemo(() => classes.filter((c) => c.is_live), [classes]);
  // Trending excludes live (live has its own row) and is shuffled for variety
  const trending = useMemo(
    () => shuffle(classes.filter((c) => !c.is_live)).slice(0, 12),
    [classes]
  );
  const recordings = useMemo(
    () => classes.filter((c) => c.class_type === "recording" || c.class_type === "bundle"),
    [classes]
  );
  const newReleases = useMemo(() => classes.slice(0, 12), [classes]); // freshest by created_at

  return (
    <Layout>
      <SEOHead
        title="Webtuto — Sri Lanka's #1 Online Learning Platform"
        description="Stream live classes & recorded lessons from top Sri Lankan tutors. National, Cambridge & Edexcel — anytime, anywhere."
        path="/"
      />

      <HomePreloader />
      <HeroFeature items={featured} />

      <div className="relative -mt-32 sm:-mt-40 z-10 space-y-2 pb-20">
        {/* Soft top-to-bottom blend so it merges with the hero seamlessly */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-background to-background" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-40 -right-32 w-[420px] h-[420px] rounded-full bg-primary/15 blur-[140px]" />
          <div className="absolute bottom-40 -left-32 w-[420px] h-[420px] rounded-full bg-accent/10 blur-[140px]" />
        </div>
        <div className="relative">
        {liveNow.length > 0 && <Row title="🔴 Live Now" items={liveNow} />}
        <Row title="New Releases" items={newReleases} />
        <LiveStats />
        {grades.length > 0 && <GradeRail title="Browse by Grade" grades={grades} />}
        {teachers.length > 0 && <TutorRow title="Meet the Tutors" tutors={teachers} />}
        <Row title="Trending This Week" items={trending} />
        {recordings.length > 0 && <Row title="On-Demand Recordings" items={recordings} />}
        {curriculums.map((cur) => {
          // Curriculum rows: exclude items already shown above (live + recordings) for variety
          const items = classes.filter(
            (c) => c.curriculums?.slug === cur.slug && !c.is_live && c.class_type !== "recording" && c.class_type !== "bundle"
          );
          if (!items.length) return null;
          return <Row key={cur.id} title={cur.name} items={items} />;
        })}
        <TestimonialsCarousel />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
