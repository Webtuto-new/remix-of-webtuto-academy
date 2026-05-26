import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, BookmarkPlus, ChevronDown, ChevronLeft, ChevronRight, Clock, Download, ExternalLink, Eye, FileText, ListVideo, Lock, NotebookPen, Play, Trash2, User } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import LessonModuleViewer from "@/components/lessons/LessonModuleViewer";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ShareButtons from "@/components/ShareButtons";
import PurchaseButton from "@/components/PurchaseButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  duration_minutes: number | null;
  episode_number: number | null;
  is_active: boolean;
  chapter_name: string | null;
  session_date: string | null;
}

const normalizeVideoUrl = (url?: string | null) => {
  const v = (url ?? "").trim();
  if (!v) return null;
  if (["collection", "null", "undefined"].includes(v.toLowerCase())) return null;
  return v;
};

const getYouTubeId = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
};

const isPlayableLesson = (lesson: Lesson) => {
  const url = normalizeVideoUrl(lesson.video_url);
  if (!url) return false;
  if (getYouTubeId(url)) return true;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:");
};

const VideoPlayer = ({ url, title, onEnded, onError, storageKey, recordingId, lessonId, lessonTitle }: { url: string; title: string; onEnded?: () => void; onError?: () => void; storageKey?: string; recordingId?: string; lessonId?: string; lessonTitle?: string }) => {
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return (
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }
  const lastSavedRef = { current: 0 } as { current: number };
  return (
    <video
      controls
      autoPlay
      playsInline
      muted
      className="w-full h-full object-contain bg-background"
      src={url}
      controlsList="nodownload"
      onEnded={onEnded}
      onCanPlay={(e) => { e.currentTarget.muted = false; }}
      onLoadedMetadata={(e) => {
        if (!storageKey) return;
        try {
          const saved = Number(localStorage.getItem(`${storageKey}_t`) || 0);
          if (saved > 5 && saved < e.currentTarget.duration - 10) {
            e.currentTarget.currentTime = saved;
          }
        } catch {}
      }}
      onTimeUpdate={(e) => {
        if (!storageKey) return;
        const now = Date.now();
        if (now - lastSavedRef.current < 4000) return;
        lastSavedRef.current = now;
        const t = e.currentTarget.currentTime;
        const d = e.currentTarget.duration || 0;
        try {
          localStorage.setItem(`${storageKey}_t`, String(Math.floor(t)));
          if (d > 0 && recordingId) {
            const pct = Math.min(100, Math.round((t / d) * 100));
            localStorage.setItem(`webtuto_progress_${recordingId}`, JSON.stringify({ lessonId, lessonTitle, pct, t: Math.floor(t), d: Math.floor(d), at: now }));
          }
        } catch {}
      }}
      onError={onError}
    >
      Your browser does not support the video tag.
    </video>
  );
};

const RecordingPlayerPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [recording, setRecording] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [showLessons, setShowLessons] = useState(false);
  const [recordingNotes, setRecordingNotes] = useState<any[]>([]);
  const [moduleVideos, setModuleVideos] = useState<{ id: string; url: string; title: string }[]>([]);
  const [activeModuleVideo, setActiveModuleVideo] = useState<{ id: string; url: string; title: string } | null>(null);
  const [bookmarks, setBookmarks] = useState<{ id: string; lessonId: string | null; lessonTitle: string; label: string; at: number }[]>([]);
  const [notes, setNotes] = useState<{ id: string; lessonId: string | null; lessonTitle: string; text: string; at: number }[]>([]);
  const [noteDraft, setNoteDraft] = useState("");

  // Load bookmarks/notes from localStorage on mount or when recording changes
  useEffect(() => {
    if (!id) return;
    try {
      setBookmarks(JSON.parse(localStorage.getItem(`webtuto_bookmarks_${id}`) || "[]"));
      setNotes(JSON.parse(localStorage.getItem(`webtuto_notes_${id}`) || "[]"));
    } catch { /* noop */ }
  }, [id]);

  const persistBookmarks = (next: typeof bookmarks) => {
    setBookmarks(next);
    if (id) localStorage.setItem(`webtuto_bookmarks_${id}`, JSON.stringify(next));
  };
  const persistNotes = (next: typeof notes) => {
    setNotes(next);
    if (id) localStorage.setItem(`webtuto_notes_${id}`, JSON.stringify(next));
  };
  const addBookmark = () => {
    const label = (activeLesson?.title || activeModuleVideo?.title || recording?.title || "Bookmark").trim();
    const next = [
      { id: crypto.randomUUID(), lessonId: activeLesson?.id ?? null, lessonTitle: label, label, at: Date.now() },
      ...bookmarks,
    ];
    persistBookmarks(next);
  };
  const removeBookmark = (bid: string) => persistBookmarks(bookmarks.filter((b) => b.id !== bid));
  const addNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    const lessonTitle = activeLesson?.title || activeModuleVideo?.title || recording?.title || "";
    persistNotes([{ id: crypto.randomUUID(), lessonId: activeLesson?.id ?? null, lessonTitle, text, at: Date.now() }, ...notes]);
    setNoteDraft("");
  };
  const removeNote = (nid: string) => persistNotes(notes.filter((n) => n.id !== nid));
  const jumpToBookmark = (b: { lessonId: string | null }) => {
    if (!b.lessonId) return;
    const lesson = lessons.find((l) => l.id === b.lessonId);
    if (lesson) { setPlayerError(null); setActiveModuleVideo(null); setActiveLesson(lesson); }
  };

  useEffect(() => {
    setPlayerError(null);
    // Save last watched lesson for resume
    if (activeLesson?.id && id) {
      localStorage.setItem(`webtuto_last_lesson_${id}`, activeLesson.id);
    }
  }, [activeLesson?.id, id]);

  useEffect(() => {
    if (!id) return;

    supabase
      .from("recordings")
      .select("*, teachers(name)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setRecording(data);
        if (data?.subject_id) {
          supabase
            .from("recordings")
            .select("id, title, thumbnail_url")
            .eq("subject_id", data.subject_id)
            .neq("id", id)
            .limit(4)
            .then(({ data: rel }) => setRelated(rel || []));
        }
      });

    supabase
      .from("recording_notes")
      .select("*")
      .eq("recording_id", id)
      .order("created_at")
      .then(({ data }) => setRecordingNotes(data || []));

    supabase
      .from("recording_videos")
      .select("*")
      .eq("recording_id", id)
      .eq("is_active", true)
      .order("episode_number", { ascending: true })
      .then(({ data }) => {
        const lessonsData = (data || []) as Lesson[];
        setLessons(lessonsData);
        // Resume from last watched lesson
        const lastLessonId = localStorage.getItem(`webtuto_last_lesson_${id}`);
        const resumeLesson = lastLessonId ? lessonsData.find(l => l.id === lastLessonId) : null;
        setActiveLesson(resumeLesson ?? lessonsData.find(isPlayableLesson) ?? lessonsData[0] ?? null);
      });

    if (user) {
      supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("recording_id", id)
        .eq("status", "active")
        .then(({ data }) => setHasAccess(!!data?.length));
    } else {
      setHasAccess(false);
    }
  }, [id, user]);

  const totalDuration = useMemo(
    () => lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0),
    [lessons]
  );

  // Main player source: prefer legacy lesson if set, else active module video
  const mainTitle = activeLesson?.title ?? activeModuleVideo?.title ?? null;
  const activeUrl = normalizeVideoUrl(activeLesson?.video_url) ?? (activeModuleVideo?.url ?? null);
  const hasAnyVideo = !!activeLesson || lessons.length > 0 || moduleVideos.length > 0;

  const handleVideoEnded = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
    const nextLesson = lessons[currentIndex + 1];
    if (nextLesson) {
      setPlayerError(null);
      setActiveLesson(nextLesson);
    }
  };

  const handleNextLesson = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
    const nextLesson = lessons[currentIndex + 1];
    if (nextLesson) {
      setPlayerError(null);
      setActiveLesson(nextLesson);
    }
  };

  const handlePrevLesson = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
    const prevLesson = lessons[currentIndex - 1];
    if (prevLesson) {
      setPlayerError(null);
      setActiveLesson(prevLesson);
    }
  };

  if (!recording) {
    return (
      <Layout>
        <div className="pt-20 pb-16 text-center text-muted-foreground">
          <div className="animate-pulse space-y-4 max-w-3xl mx-auto px-3">
            <div className="aspect-video bg-muted rounded-xl" />
            <div className="h-6 bg-muted rounded-lg w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  const freePreviewUrl = normalizeVideoUrl((recording as any).free_preview_url);
  const currentIndex = activeLesson ? lessons.findIndex((l) => l.id === activeLesson.id) : -1;

  const shareLink = `${window.location.origin}/recording/${id}`;

  return (
    <Layout>
      <SEOHead 
        title={recording.title} 
        description={recording.description || `Watch ${recording.title} on Webtuto`} 
        path={`/recording/${id}`} 
        image={recording.thumbnail_url || undefined} 
      />
      <div className="relative pt-16 sm:pt-20 pb-12 sm:pb-16 min-h-screen overflow-hidden">
        {/* Cinematic backdrop */}
        {recording.thumbnail_url && (
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <img src={recording.thumbnail_url} alt="" className="w-full h-[60vh] object-cover opacity-20 scale-110 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/85 to-background" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-mesh opacity-50 pointer-events-none" />
        <div className="container mx-auto px-3 sm:px-4">
          {/* Back button */}
          <Link
            to="/recordings"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
          </Link>

          {hasAccess ? (
            <>
              {/* Video player - full width on mobile */}
              <div className="space-y-3 sm:space-y-4">
                <div className="aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-white/10 hover:ring-glow transition-shadow">
                  {!hasAnyVideo ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 bg-muted/50">
                      <Play className="w-10 h-10 sm:w-14 sm:h-14 mb-2" />
                      <p className="text-xs sm:text-sm">No lessons available yet</p>
                    </div>
                  ) : !activeUrl ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/30 px-4 text-center">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-60" />
                      <p className="text-xs sm:text-sm font-medium text-foreground">Select a lesson to start watching.</p>
                    </div>
                  ) : playerError ? (
                    <div className="flex flex-col items-center justify-center h-full px-4 text-center bg-muted/30">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-60" />
                      <p className="text-xs sm:text-sm font-medium text-foreground">Video failed to load</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{playerError}</p>
                      <div className="mt-3">
                        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                          <a href={activeUrl} target="_blank" rel="noreferrer">
                            Open link <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <VideoPlayer
                      key={activeLesson?.id ?? activeModuleVideo?.id ?? activeUrl}
                      url={activeUrl}
                      title={mainTitle ?? recording.title}
                      onEnded={handleVideoEnded}
                      onError={() =>
                        setPlayerError("The video URL is invalid, blocked, or the storage bucket is not public.")
                      }
                    />
                  )}
                </div>

                {/* Navigation buttons */}
                {activeLesson && lessons.length > 1 && (
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevLesson}
                      disabled={currentIndex === 0}
                      className="gap-1 text-xs h-8"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentIndex + 1} / {lessons.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextLesson}
                      disabled={currentIndex === lessons.length - 1}
                      className="gap-1 text-xs h-8"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {/* Title & meta */}
                <div className="space-y-1.5">
                  <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">{recording.title}</h1>
                  {mainTitle && (
                    <p className="text-primary font-medium text-xs sm:text-sm">Now Playing: {mainTitle}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {recording.teachers?.name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {recording.teachers.name}
                      </span>
                    )}
                    {totalDuration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalDuration} min
                      </span>
                    )}
                    <span>
                      {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {recording.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{recording.description}</p>
                )}

                {/* Notes & Share */}
                {recordingNotes.length > 0 && (
                  <div className="glass-strong rounded-2xl p-3 sm:p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" /> Notes & Materials
                    </h3>
                    <div className="space-y-1.5">
                      {recordingNotes.map((n: any) => (
                        <a key={n.id} href={n.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors">
                          <Download className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs sm:text-sm text-foreground">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{n.file_type?.toUpperCase()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <ShareButtons url={shareLink} title={recording.title} />

                {/* Bookmarks & Notes (stored locally per device) */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="glass-strong rounded-2xl p-3 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Bookmark className="w-4 h-4 text-primary" /> Bookmarks
                        <span className="text-[10px] text-muted-foreground font-normal">({bookmarks.length})</span>
                      </h3>
                      <Button onClick={addBookmark} size="sm" variant="outline" className="gap-1 h-7 text-[11px]">
                        <BookmarkPlus className="w-3.5 h-3.5" /> Save
                      </Button>
                    </div>
                    {bookmarks.length === 0 ? (
                      <p className="text-xs text-muted-foreground/80">Save the current lesson to revisit it later.</p>
                    ) : (
                      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                        {bookmarks.map((b) => (
                          <div key={b.id} className="group flex items-center gap-1.5 p-1.5 rounded-md hover:bg-muted/60 transition-colors">
                            <button onClick={() => jumpToBookmark(b)} className="flex-1 min-w-0 text-left">
                              <p className="text-xs text-foreground truncate">{b.label}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(b.at).toLocaleDateString()}</p>
                            </button>
                            <button onClick={() => removeBookmark(b.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all" aria-label="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-strong rounded-2xl p-3 sm:p-4 space-y-2.5">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <NotebookPen className="w-4 h-4 text-secondary" /> My Notes
                      <span className="text-[10px] text-muted-foreground font-normal">({notes.length})</span>
                    </h3>
                    <div className="flex gap-1.5">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNote(); } }}
                        placeholder="Jot a note… (⌘/Ctrl+Enter to save)"
                        rows={2}
                        className="flex-1 text-xs bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                      <Button onClick={addNote} disabled={!noteDraft.trim()} size="sm" variant="default" className="h-auto px-2 text-[11px]">
                        Add
                      </Button>
                    </div>
                    {notes.length > 0 && (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {notes.map((n) => (
                          <div key={n.id} className="group p-2 rounded-md bg-muted/40 border border-border/40">
                            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{n.text}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-muted-foreground truncate">{n.lessonTitle}</span>
                              <button onClick={() => removeNote(n.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lessons list - collapsible on mobile */}
                {lessons.length > 0 && (() => {
                  // Group lessons by chapter
                  const chapters: { name: string | null; lessons: Lesson[] }[] = [];
                  lessons.forEach(lesson => {
                    const chName = lesson.chapter_name || null;
                    const existing = chapters.find(c => c.name === chName);
                    if (existing) existing.lessons.push(lesson);
                    else chapters.push({ name: chName, lessons: [lesson] });
                  });
                  const hasChapters = chapters.some(c => c.name);

                  return (
                  <div className="glass-strong rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowLessons(!showLessons)}
                      className="w-full p-3 flex items-center justify-between sm:cursor-default"
                      type="button"
                    >
                      <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
                        <ListVideo className="w-4 h-4 text-primary" />
                        Lessons ({lessons.length})
                      </h3>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform sm:hidden ${showLessons ? "rotate-90" : ""}`} />
                    </button>
                    <div className={`${showLessons ? "block" : "hidden"} sm:block max-h-[50vh] overflow-y-auto border-t border-border/60`}>
                      {chapters.map((chapter, ci) => {
                        const chapterHasActive = chapter.lessons.some(l => l.id === activeLesson?.id);
                        const lessonItems = (
                          <div className="divide-y divide-border/40">
                            {chapter.lessons.map((lesson, i) => {
                              const isActive = activeLesson?.id === lesson.id;
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => {
                                    setPlayerError(null);
                                    setActiveModuleVideo(null);
                                    setActiveLesson(lesson);
                                    setShowLessons(false);
                                  }}
                                  className={`w-full flex items-center gap-2 p-2.5 sm:p-3 text-left transition-colors hover:bg-muted/60 ${
                                    isActive ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"
                                  }`}
                                  type="button"
                                >
                                  <div
                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {isActive ? <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : lesson.episode_number || i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs sm:text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                                      {lesson.title}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {lesson.duration_minutes && <span className="text-[10px] sm:text-xs text-muted-foreground">{lesson.duration_minutes} min</span>}
                                      {lesson.session_date && <span className="text-[10px] text-muted-foreground/70">{lesson.session_date}</span>}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );

                        if (hasChapters && chapter.name) {
                          return (
                            <Collapsible key={ci} defaultOpen={chapterHasActive || ci === 0}>
                              <CollapsibleTrigger className="w-full px-3 py-2.5 bg-muted/40 border-b border-border/40 flex items-center justify-between hover:bg-muted/60 transition-colors">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">{chapter.name}</p>
                                  <span className="text-[10px] text-muted-foreground">({chapter.lessons.length})</span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-0 [[data-state=closed]_&]:rotate-0" />
                              </CollapsibleTrigger>
                              <CollapsibleContent>{lessonItems}</CollapsibleContent>
                            </Collapsible>
                          );
                        }

                        return <div key={ci}>{lessonItems}</div>;
                      })}
                    </div>
                  </div>
                  );
                })()}
              </div>

              {/* Upgraded multi-video lesson modules */}
              <div className="mt-6">
                <LessonModuleViewer
                  parent={{ kind: "recording", id: id! }}
                  hasAccess={hasAccess}
                  activeVideoId={activeModuleVideo?.id ?? null}
                  onVideosLoaded={(vs) => {
                    setModuleVideos(vs);
                    // Auto-load first module video if no legacy lesson is playable
                    if (!activeLesson && vs.length > 0 && !activeModuleVideo) {
                      setActiveModuleVideo(vs[0]);
                    }
                  }}
                  onPlay={(v) => {
                    setPlayerError(null);
                    setActiveLesson(null);
                    setActiveModuleVideo(v);
                  }}
                />
              </div>
            </>
          ) : (
            /* Non-purchased view */
            <div className="space-y-4 sm:space-y-6">
              {/* Show modules so prospects can see structure (locked) */}
              <LessonModuleViewer parent={{ kind: "recording", id: id! }} hasAccess={false} />
              {/* Free Preview Video */}
              {freePreviewUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-primary font-medium">
                    <Eye className="w-3.5 h-3.5" /> Free Preview
                  </div>
                  <div className="aspect-video bg-card rounded-lg sm:rounded-xl overflow-hidden shadow-lg border border-border/60">
                    <VideoPlayer url={freePreviewUrl} title={`${recording.title} - Preview`} />
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-lg sm:rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.08)_0%,_transparent_70%)]" />
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-xs sm:text-sm">Purchase to unlock all lessons</p>
                </div>
              )}

              <div className="space-y-2 text-center">
                <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{recording.title}</h1>
                {recording.description && <p className="text-xs sm:text-sm text-muted-foreground">{recording.description}</p>}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  {recording.teachers?.name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {recording.teachers.name}
                    </span>
                  )}
                  {lessons.length > 0 && (
                    <span>
                      {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <ShareButtons url={shareLink} title={recording.title} />

              <div className="max-w-xs mx-auto">
                <PurchaseButton
                  type="recording"
                  itemId={recording.id}
                  price={recording.price}
                  title={recording.title}
                  thumbnail_url={recording.thumbnail_url}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">Access for {recording.access_duration_days || 365} days after purchase.</p>

              {lessons.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-display text-sm sm:text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-primary" /> Course Content
                  </h3>
                  <div className="space-y-1.5">
                    {lessons.map((lesson, i) => (
                      <div key={lesson.id} className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/50 border border-border/50">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-muted flex items-center justify-center text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                          {lesson.episode_number || i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate">{lesson.title}</p>
                          {lesson.duration_minutes && <p className="text-[10px] sm:text-xs text-muted-foreground">{lesson.duration_minutes} min</p>}
                        </div>
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-8 sm:mt-12">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Related Recordings</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {related.map((r) => (
                  <Link key={r.id} to={`/recording/${r.id}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 border-border/50">
                      <CardContent className="p-2.5 sm:p-3">
                        <p className="font-medium text-foreground text-xs sm:text-sm line-clamp-2">{r.title}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecordingPlayerPage;
