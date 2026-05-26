import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Play, Users, ArrowRight, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import ClassCard from "@/components/ClassCard";
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { icon: Users, label: "Active Students", value: "500+" },
  { icon: GraduationCap, label: "Expert Tutors", value: "25+" },
  { icon: BookOpen, label: "Courses/Classes", value: "50+" },
  { icon: Play, label: "Recordings", value: "1,200+" },
];

const Index = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("classes").select("*, teachers(name), curriculums(name), grades(name), subjects(name)")
      .eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => {
        if (!data?.length) {
          // If no featured, get any active classes
          supabase.from("classes").select("*, teachers(name), curriculums(name), grades(name), subjects(name)")
            .eq("is_active", true).order("created_at", { ascending: false }).limit(6)
            .then(({ data: all }) => setClasses(all || []));
        } else {
          setClasses(data);
        }
      });
    supabase.from("curriculums").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setCurriculums(data || []));
  }, []);

  return (
    <Layout>
      <SEOHead title="Webtuto" description="Sri Lanka's #1 online learning platform. Live classes, expert tutors, and comprehensive courses for National, Cambridge & Edexcel syllabuses." path="/" />
      {/* Hero */}
      <section className="hero-gradient bg-mesh relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-secondary/20 blur-[80px] sm:blur-[100px] animate-float-blob" />
          <div className="absolute bottom-10 right-10 sm:right-20 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-accent/15 blur-[100px] sm:blur-[120px] animate-float-blob" style={{animationDelay:'-4s'}} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-primary/10 blur-[120px] sm:blur-[150px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto px-4 relative"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-primary-foreground/80 border border-primary-foreground/10">
              <Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-accent" />
              Sri Lanka's #1 Online Learning Platform
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight">
              Learn Smarter with{" "}
              <span className="text-gradient-gold">Webtuto.LK</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/60 max-w-2xl mx-auto leading-relaxed">
              Live classes, expert tutors, and comprehensive courses for National, Cambridge & Edexcel syllabuses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 sm:pt-4">
              <Link to="/curriculum">
                <Button variant="hero" size="lg" className="text-sm sm:text-base gap-2 w-full sm:w-auto">
                  Explore Courses <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero-outline" size="lg" className="text-sm sm:text-base w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8 sm:-mt-10 z-10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl p-3 sm:p-5 text-center card-elevated">
                <stat.icon className="w-5 sm:w-6 h-5 sm:h-6 text-accent mx-auto mb-1.5 sm:mb-2" />
                <div className="font-display font-bold text-xl sm:text-2xl text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Preview */}
      {curriculums.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Choose Your Curriculum
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We support multiple syllabuses to match your academic path
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {curriculums.map((cur) => (
                <Link
                  key={cur.id}
                  to={`/curriculum?tab=${cur.slug}`}
                  className="bg-card rounded-xl p-6 card-elevated text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/12 transition-colors">
                    <GraduationCap className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{cur.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Classes */}
      {classes.length > 0 && (
        <section className="py-20 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Featured Classes
                </h2>
                <p className="text-muted-foreground">Handpicked courses to kickstart your learning</p>
              </div>
              <Link to="/classes" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c) => (
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
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to="/classes">
                <Button variant="outline">View All Classes</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="hero-gradient rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-accent/10 blur-[80px] sm:blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-40 sm:w-56 h-40 sm:h-56 rounded-full bg-secondary/10 blur-[60px] sm:blur-[80px]" />
            </div>
            <div className="relative space-y-5 sm:space-y-8">
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-primary-foreground leading-tight">
                Ready to Start Learning?
              </h2>
              <p className="text-primary-foreground/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Join Webtuto.LK today and get access to the best tutors in Sri Lanka
              </p>
              <div className="pt-2 sm:pt-4">
                <Link to="/signup">
                  <Button variant="hero" size="lg" className="text-sm sm:text-base px-8 sm:px-10 py-5 sm:py-6">
                    Sign Up Now — It's Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
