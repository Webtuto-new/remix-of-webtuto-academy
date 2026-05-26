import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ShareButtons from "@/components/ShareButtons";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Users, ExternalLink, ArrowLeft, Play, FileText, Download, Star, Shield, Award, Zap, CheckCircle2, Globe } from "lucide-react";
import PurchaseButton from "@/components/PurchaseButton";
import WishlistButton from "@/components/WishlistButton";
import ReviewForm from "@/components/ReviewForm";
import ReviewsList from "@/components/ReviewsList";
import CountdownTimer from "@/components/CountdownTimer";

import LessonModuleViewer from "@/components/lessons/LessonModuleViewer";

const baseTabs = ["Overview", "Lessons", "Schedule", "Teacher", "Reviews"];

const ClassDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [dbClass, setDbClass] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [reviewKey, setReviewKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoursPerWeek, setHoursPerWeek] = useState(1);
  const [classesPerWeek, setClassesPerWeek] = useState(1);
  const [stats, setStats] = useState<{ rating: number; reviewCount: number; studentCount: number }>({ rating: 0, reviewCount: 0, studentCount: 0 });

  useEffect(() => {
    if (!id) return;
    supabase.from("classes").select("*, teachers(*), curriculums(name), grades(name), subjects(name)").eq("id", id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDbClass(data);
          setTeacher(data.teachers);
          supabase.from("class_sessions").select("*").eq("class_id", id).order("session_date")
            .then(({ data: s }) => setSessions(s || []));
          if (data.delivery_mode === "recorded" || data.delivery_mode === "hybrid") {
            supabase.from("class_lessons").select("*").eq("class_id", id).eq("is_active", true).order("lesson_number")
              .then(({ data: l }) => setLessons(l || []));
            supabase.from("class_materials").select("*").eq("class_id", id).order("created_at")
              .then(({ data: m }) => setMaterials(m || []));
          }
        }
        setLoading(false);
      });
    if (user) {
      supabase.from("enrollments").select("id, expires_at, enrolled_at").eq("user_id", user.id).eq("class_id", id).eq("status", "active").maybeSingle()
        .then(({ data }) => setEnrollment(data));
    }
    // Rating + student count for trust signals
    (async () => {
      const [{ data: revs }, { count: enrolled }] = await Promise.all([
        supabase.from("reviews").select("rating").eq("class_id", id),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("class_id", id).eq("status", "active"),
      ]);
      const list = revs || [];
      const avg = list.length ? list.reduce((s: number, r: any) => s + r.rating, 0) / list.length : 0;
      setStats({ rating: avg, reviewCount: list.length, studentCount: enrolled || 0 });
    })();
  }, [id, user]);

  if (loading) {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!dbClass) {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center">
          <p className="text-muted-foreground text-lg mb-4">Class not found</p>
          <Link to="/classes"><Button variant="outline">Browse Classes</Button></Link>
        </div>
      </Layout>
    );
  }

  const hasRecordedContent = dbClass.delivery_mode === "recorded" || dbClass.delivery_mode === "hybrid";
  const tabs = baseTabs;

  const isHourly = dbClass.class_type === "hourly";
  const basePrice = Number(dbClass.price);
  const totalHours = hoursPerWeek * classesPerWeek;
  const calculatedPrice = isHourly ? basePrice * totalHours : basePrice;

  const teacherName = teacher?.name || "Tutor";
  const curriculum = dbClass.curriculums?.name || "";
  const grade = dbClass.grades?.name || "";
  const subject = dbClass.subjects?.name || "";
  const sessionCount = sessions.length || 4;
  const duration = dbClass.duration_minutes ? `${dbClass.duration_minutes} min` : "2 hrs";

  // Auto-generate a rich description if none exists
  const generateAutoDescription = () => {
    const parts: string[] = [];
    parts.push(`Join ${teacherName} for an engaging ${dbClass.class_type === "monthly" ? "monthly" : dbClass.class_type} class on ${dbClass.title}.`);
    if (subject) parts.push(`This ${subject} class${grade ? ` for ${grade}` : ""}${curriculum ? ` (${curriculum} curriculum)` : ""} is designed to help students build a strong foundation and excel in their studies.`);
    if (sessions.length > 0) parts.push(`The course includes ${sessions.length} interactive sessions, each ${duration} long, with live instruction and Q&A.`);
    parts.push("Enrolled students get access to session recordings, downloadable notes, and dedicated teacher support.");
    if (dbClass.has_free_trial) parts.push("A free trial session is available so you can experience the class before enrolling.");
    return parts.join(" ");
  };

  const description = dbClass.description || dbClass.short_description || generateAutoDescription();

  const cls = {
    title: dbClass.title,
    description,
    curriculum: curriculum || "—",
    grade: grade || "—",
    subject: subject || "—",
    teacherName,
    price: calculatedPrice,
    basePrice: basePrice,
    originalPrice: dbClass.original_price ? Number(dbClass.original_price) : undefined,
    sessionCount,
    duration,
    isLive: dbClass.is_live,
    classType: dbClass.class_type,
    thumbnail: dbClass.thumbnail_url,
  };

  const classId = dbClass.id;
  const price = cls.price;
  const shareLink = `${window.location.origin}/class/${classId}`;

  const now = new Date();
  const nextSession = sessions.find(s => {
    const sessionDate = new Date(`${s.session_date}T${s.start_time}`);
    return sessionDate > now && s.status === "scheduled";
  });

  return (
    <Layout>
      <SEOHead title={cls.title} description={cls.description} path={`/class/${classId}`} image={cls.thumbnail || undefined} />
      <div className="relative pt-24 pb-14 overflow-hidden">
        {cls.thumbnail && (
          <div className="absolute inset-0 -z-10">
            <img src={cls.thumbnail} alt="" aria-hidden className="w-full h-full object-cover opacity-25 scale-110 blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-mesh" />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2 mb-5">
              <Badge variant="secondary">{cls.curriculum}</Badge>
              {cls.grade !== "—" && <Badge variant="outline">{cls.grade}</Badge>}
              {cls.subject !== "—" && <Badge variant="outline">{cls.subject}</Badge>}
              <Badge variant="outline" className="capitalize">{cls.classType}</Badge>
              {cls.isLive && <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE</span>}
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">{cls.title}</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-3xl leading-relaxed mb-5">{cls.description}</p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {stats.reviewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-bold text-foreground">{stats.rating.toFixed(1)}</span>
                  <span>({stats.reviewCount} reviews)</span>
                </span>
              )}
              {stats.studentCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{stats.studentCount}</span> enrolled
                </span>
              )}
              <Link to={teacher?.id ? `/tutor/${teacher.id}` : "#"} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Award className="w-4 h-4 text-primary" /> {cls.teacherName}
              </Link>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {cls.sessionCount} sessions</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {cls.duration}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {nextSession && enrollment && (
              <CountdownTimer targetDate={new Date(`${nextSession.session_date}T${nextSession.start_time}`)} sessionTitle={nextSession.title} zoomLink={nextSession.zoom_link} />
            )}

            <div className="flex gap-1 border-b border-border overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-3">About this class</h2>
                  <div className="text-muted-foreground leading-relaxed space-y-3">
                    {cls.description.split(". ").reduce((acc: string[][], sentence, i, arr) => {
                      const last = acc[acc.length - 1];
                      if (last && last.join(". ").length + sentence.length < 200) {
                        last.push(sentence);
                      } else {
                        acc.push([sentence]);
                      }
                      return acc;
                    }, [] as string[][]).map((group, i) => (
                      <p key={i}>{group.join(". ")}{group[group.length - 1]?.endsWith(".") ? "" : "."}</p>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Curriculum", value: cls.curriculum },
                    { label: "Grade", value: cls.grade },
                    { label: "Subject", value: cls.subject },
                    { label: "Teacher", value: cls.teacherName },
                    { label: "Sessions", value: `${cls.sessionCount} sessions` },
                    { label: "Duration", value: cls.duration },
                  ].filter(item => item.value !== "—").map(item => (
                    <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Lessons" && (
              <div className="space-y-6">
                {lessons.length > 0 && (
                  <>
                    <h2 className="font-display text-xl font-semibold text-foreground">Lessons</h2>
                    <div className="space-y-3">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="bg-card rounded-xl p-4 card-elevated flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{lesson.lesson_number ? `${lesson.lesson_number}. ` : ""}{lesson.title}</p>
                            {lesson.duration_minutes && <p className="text-sm text-muted-foreground">{lesson.duration_minutes} min</p>}
                          </div>
                          {enrollment && lesson.video_url && (
                            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1.5"><Play className="w-3.5 h-3.5" /> Watch</Button>
                            </a>
                          )}
                          {!enrollment && <Badge variant="outline">Enroll to access</Badge>}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {materials.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-3">Materials & Notes</h3>
                    <div className="space-y-2">
                      {materials.map(m => (
                        <div key={m.id} className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm font-medium text-foreground">{m.title}</span>
                          {enrollment ? (
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="gap-1"><Download className="w-3.5 h-3.5" /> Download</Button>
                            </a>
                          ) : (
                            <Badge variant="outline" className="text-xs">Enroll to access</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upgraded multi-video lesson modules */}
                <LessonModuleViewer parent={{ kind: "class", id: dbClass.id }} hasAccess={!!enrollment} />
              </div>
            )}

            {activeTab === "Schedule" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-foreground">Session Schedule</h2>
                {sessions.length > 0 ? sessions.map((session) => {
                  const sessionDate = new Date(`${session.session_date}T${session.start_time}`);
                  const isJoinable = enrollment && session.zoom_link && Math.abs(sessionDate.getTime() - now.getTime()) < 15 * 60 * 1000;
                  return (
                    <div key={session.id} className="bg-card rounded-xl p-4 card-elevated space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                            <span className="font-display font-bold text-secondary">W{session.week_number || "—"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.session_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · {session.start_time} - {session.end_time}
                            </p>
                          </div>
                        </div>
                        <Badge variant={session.status === "completed" ? "secondary" : session.status === "live" ? "destructive" : "outline"} className="capitalize shrink-0">{session.status}</Badge>
                      </div>
                      {enrollment && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                          {isJoinable && session.zoom_link && (
                            <a href={session.zoom_link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="default" className="gap-1.5">
                                <Video className="w-3.5 h-3.5" /> Join Zoom
                              </Button>
                            </a>
                          )}
                          {session.recording_url && (
                            <a href={session.recording_url} target="_blank" rel="noopener noreferrer" onClick={() => {
                              if (user) supabase.from("student_activity" as any).insert({ user_id: user.id, activity_type: "recording_view", resource_id: session.id, resource_title: session.title } as any);
                            }}>
                              <Button size="sm" variant="outline" className="gap-1.5">
                                <Video className="w-3.5 h-3.5" /> Recording
                              </Button>
                            </a>
                          )}
                          {session.notes_url && (
                            <a href={session.notes_url} target="_blank" rel="noopener noreferrer" onClick={() => {
                              if (user) supabase.from("student_activity" as any).insert({ user_id: user.id, activity_type: "note_download", resource_id: session.id, resource_title: session.title } as any);
                            }}>
                              <Button size="sm" variant="outline" className="gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> Notes
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <p className="text-muted-foreground">No sessions scheduled yet.</p>
                )}
              </div>
            )}

            {activeTab === "Teacher" && (
              <div className="space-y-4">
                <Link to={teacher?.id ? `/tutor/${teacher.id}` : "#"} className="flex items-center gap-4 group hover:opacity-80 transition">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary/10 flex items-center justify-center ring-2 ring-accent/30">
                    {teacher?.avatar_url ? (
                      <img src={teacher.avatar_url} alt={cls.teacherName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-secondary text-xl">{cls.teacherName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-accent transition-colors">{cls.teacherName}</h2>
                    <p className="text-muted-foreground">{teacher?.qualifications || "Educator"}</p>
                    <p className="text-xs text-accent font-semibold mt-0.5">View full profile →</p>
                  </div>
                </Link>
                <p className="text-muted-foreground leading-relaxed">
                  {teacher?.bio || "An experienced educator dedicated to helping students succeed."}
                </p>
              </div>
            )}

            {activeTab === "Reviews" && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold text-foreground">Reviews</h2>
                <ReviewsList classId={classId} key={reviewKey} />
                {user && <ReviewForm classId={classId} onReviewAdded={() => setReviewKey(k => k + 1)} />}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 card-elevated sticky top-24">
              {isHourly ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-3">Configure your weekly sessions:</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hours per class:</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setHoursPerWeek(Math.max(1, hoursPerWeek - 1))} disabled={hoursPerWeek <= 1}>-</Button>
                        <span className="w-8 text-center font-medium">{hoursPerWeek}</span>
                        <Button size="sm" variant="outline" onClick={() => setHoursPerWeek(hoursPerWeek + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Classes per week:</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setClassesPerWeek(Math.max(1, classesPerWeek - 1))} disabled={classesPerWeek <= 1}>-</Button>
                        <span className="w-8 text-center font-medium">{classesPerWeek}</span>
                        <Button size="sm" variant="outline" onClick={() => setClassesPerWeek(classesPerWeek + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground">Total: <span className="font-medium text-foreground">{totalHours} hours/week</span></p>
                      <p className="text-muted-foreground">Rate: LKR {cls.basePrice.toLocaleString()}/hour</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3 mb-4">
                <span className="font-display font-bold text-3xl text-foreground">LKR {price.toLocaleString()}</span>
                {isHourly && <span className="text-sm text-muted-foreground">/week</span>}
                {cls.originalPrice && !isHourly && (
                  <span className="text-muted-foreground line-through">LKR {cls.originalPrice.toLocaleString()}</span>
                )}
              </div>
              {cls.originalPrice && !isHourly && (
                <p className="text-sm text-accent font-medium mb-4">Save LKR {(cls.originalPrice - price).toLocaleString()}!</p>
              )}

              {enrollment ? (
                <div className="space-y-3">
                  <div className="bg-secondary/10 text-secondary p-4 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <span className="text-lg">✓</span> Enrolled
                    </div>
                    {enrollment.expires_at && (
                      <p className="text-xs text-secondary/80">
                        Expires: {new Date(enrollment.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  {isHourly && (
                    <Button variant="outline" className="w-full" onClick={() => setEnrollment(null)}>
                      Add More Hours
                    </Button>
                  )}
                  {nextSession?.zoom_link && (
                    <a href={nextSession.zoom_link} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2" size="lg"><Video className="w-4 h-4" /> Join Next Class</Button>
                    </a>
                  )}
                </div>
              ) : (
                <PurchaseButton type="class" itemId={classId} price={price} title={isHourly ? `${cls.title} (${totalHours}h/week)` : cls.title} />
              )}

              <div className="flex gap-2 mt-3">
                <WishlistButton classId={classId} />
              </div>
              <div className="mt-3">
                <ShareButtons url={shareLink} title={cls.title} />
              </div>

              <div className="mt-6 space-y-3 text-sm">
                {[
                  { icon: Calendar, text: isHourly ? `${totalHours} hours/week` : `${cls.sessionCount} sessions` },
                  { icon: Clock, text: cls.duration },
                  { icon: Video, text: "Recordings included" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="w-4 h-4 text-secondary" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClassDetailPage;
