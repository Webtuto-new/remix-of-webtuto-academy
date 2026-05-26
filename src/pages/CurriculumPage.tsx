import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Link, useSearchParams } from "react-router-dom";
import { GraduationCap, ArrowRight, BookOpen, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";
import EmptyState from "@/components/premium/EmptyState";

const CurriculumPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const gradeScroller = useRef<HTMLDivElement>(null);
  const scrollGrades = (dir: 1 | -1) => {
    const el = gradeScroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  useEffect(() => {
    supabase.from("curriculums").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        setCurriculums(data || []);
        const tab = searchParams.get("tab");
        if (data?.length) {
          const match = data.find(c => c.slug === tab);
          setActiveTab(match ? match.id : data[0].id);
        }
      });
    supabase.from("grades").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => {
          const aMatch = a.name.match(/(\d+)/);
          const bMatch = b.name.match(/(\d+)/);
          if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
          return a.name.localeCompare(b.name);
        });
        setGrades(sorted);
      });
    supabase.from("subjects").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setSubjects(data || []));
  }, []);

  // Check URL for grade param
  useEffect(() => {
    const gradeSlug = searchParams.get("grade");
    if (gradeSlug && grades.length) {
      const grade = grades.find(g => g.slug === gradeSlug);
      if (grade) {
        setSelectedGrade(grade);
        setActiveTab(grade.curriculum_id);
      }
    }
  }, [searchParams, grades]);

  const currentGrades = grades.filter(g => g.curriculum_id === activeTab);
  const currentSubjects = selectedGrade ? subjects.filter(s => s.grade_id === selectedGrade.id) : [];

  const handleGradeClick = (grade: any) => {
    setSelectedGrade(grade);
    setSearchParams({ grade: grade.slug });
  };

  const handleBack = () => {
    setSelectedGrade(null);
    searchParams.delete("grade");
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <SEOHead title="Curriculum" description="Browse classes by National, Cambridge, and Edexcel syllabuses." path="/curriculum" />
      <div className="pt-24 pb-20 relative">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-mesh opacity-70 pointer-events-none" />
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="text-center mb-12 relative">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80 mb-3">
              <span className="h-px w-6 bg-primary/40" /> Syllabuses
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3">Choose your curriculum</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">National, Cambridge & Edexcel — pick your path and explore every grade.</p>
          </motion.div>

          {curriculums.length > 0 ? (
            <>
              <div className="relative flex gap-1.5 mb-10 justify-center flex-wrap">
                {curriculums.map((cur) => (
                  <button key={cur.id} onClick={() => { setActiveTab(cur.id); setSelectedGrade(null); searchParams.delete("grade"); setSearchParams(searchParams); }}
                    className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                      activeTab === cur.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-card/60 backdrop-blur border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}>
                    {cur.name}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
              {selectedGrade ? (
                <motion.div key="subjects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="relative">
                  <Button variant="ghost" className="mb-6 gap-2" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4" /> Back to Grades
                  </Button>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">{selectedGrade.name} — Subjects</h2>
                  {currentSubjects.length > 0 ? (
                    <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {currentSubjects.map((subject) => (
                        <motion.div key={subject.id} variants={fadeUp} whileHover={{ y: -4 }}>
                        <Link to={`/classes?subject=${subject.slug}&grade=${selectedGrade.slug}`} className="block bg-card/70 backdrop-blur-sm rounded-2xl p-6 card-elevated group gradient-border">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors ring-1 ring-primary/20">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-display font-semibold text-foreground text-lg">{subject.name}</h3>
                          </div>
                          <div className="flex items-center text-sm text-primary font-semibold gap-1 group-hover:gap-2 transition-all">
                            View classes <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <EmptyState icon={BookOpen} title="No subjects yet" description="Subjects for this grade haven't been added." />
                  )}
                </motion.div>
              ) : (
                <motion.div key="grades" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="relative">
                  {currentGrades.length > 0 ? (
                    <div className="relative group/rail">
                      <button
                        onClick={() => scrollGrades(-1)}
                        aria-label="Scroll left"
                        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/60 shadow-lg opacity-0 group-hover/rail:opacity-100 transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div
                        ref={gradeScroller}
                        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      >
                        {currentGrades.map((grade, i) => (
                          <motion.button
                            key={grade.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.04 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            onClick={() => handleGradeClick(grade)}
                            className="snap-start shrink-0 w-[200px] sm:w-[230px] lg:w-[250px] h-[200px] relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between text-left ring-1 ring-border/60 hover:ring-2 hover:ring-primary shadow-lg bg-gradient-to-br from-primary/20 via-card to-accent/20 group"
                          >
                            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/30 blur-3xl opacity-60 group-hover:opacity-100 transition" />
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-accent/25 blur-3xl opacity-50" />
                            <div className="relative flex items-start justify-between">
                              <div className="w-11 h-11 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center ring-1 ring-foreground/10">
                                <GraduationCap className="w-5 h-5 text-primary" />
                              </div>
                              <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <div className="relative">
                              <h3 className="font-display font-bold text-foreground text-xl leading-tight line-clamp-2">
                                {grade.name}
                              </h3>
                              <div className="flex items-center text-sm text-primary font-semibold gap-1 mt-3 group-hover:gap-2 transition-all">
                                View subjects <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      <button
                        onClick={() => scrollGrades(1)}
                        aria-label="Scroll right"
                        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/60 shadow-lg opacity-0 group-hover/rail:opacity-100 transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <EmptyState icon={GraduationCap} title="No grades yet" description="Grades for this curriculum haven't been added." />
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </>
          ) : (
            <EmptyState icon={GraduationCap} title="No curriculums yet" description="Check back soon." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CurriculumPage;
