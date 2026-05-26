import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ThemeProvider from "@/components/ThemeProvider";
import Index from "./pages/Index";

// Lazy-loaded public pages (code-split per route for faster initial load)
const CurriculumPage = lazy(() => import("./pages/CurriculumPage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const ClassDetailPage = lazy(() => import("./pages/ClassDetailPage"));
const RecordingsPage = lazy(() => import("./pages/RecordingsPage"));
const RecordingPlayerPage = lazy(() => import("./pages/RecordingPlayerPage"));
const BundlesPage = lazy(() => import("./pages/BundlesPage"));
const SeminarsPage = lazy(() => import("./pages/SeminarsPage"));
const WorkshopsPage = lazy(() => import("./pages/WorkshopsPage"));
const HowToUsePage = lazy(() => import("./pages/HowToUsePage"));
const TutorApplicationPage = lazy(() => import("./pages/TutorApplicationPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RequestClassPage = lazy(() => import("./pages/RequestClassPage"));
const TutorProfilePage = lazy(() => import("./pages/TutorProfilePage"));
const TutorsPage = lazy(() => import("./pages/TutorsPage"));
const QuizzesPage = lazy(() => import("./pages/QuizzesPage"));
const QuizPlayPage = lazy(() => import("./pages/QuizPlayPage"));
const QuizJoinPage = lazy(() => import("./pages/QuizJoinPage"));
const LiveQuizParticipantPage = lazy(() => import("./pages/LiveQuizParticipantPage"));
const QuizResultsPage = lazy(() => import("./pages/QuizResultsPage"));

// Dashboard pages
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const DashboardOverview = lazy(() => import("./pages/dashboard/DashboardOverview"));
const DashboardSchedule = lazy(() => import("./pages/dashboard/DashboardSchedule"));
const DashboardClasses = lazy(() => import("./pages/dashboard/DashboardClasses"));
const DashboardRecordings = lazy(() => import("./pages/dashboard/DashboardRecordings"));
const DashboardPayments = lazy(() => import("./pages/dashboard/DashboardPayments"));
const DashboardProfile = lazy(() => import("./pages/dashboard/DashboardProfile"));
const DashboardWishlist = lazy(() => import("./pages/dashboard/DashboardWishlist"));
const DashboardHistory = lazy(() => import("./pages/dashboard/DashboardHistory"));
const DashboardCertificates = lazy(() => import("./pages/dashboard/DashboardCertificates"));
const DashboardNotes = lazy(() => import("./pages/dashboard/DashboardNotes"));
const DashboardPlaceholder = lazy(() => import("./pages/dashboard/DashboardPlaceholder"));
const DashboardRequests = lazy(() => import("./pages/dashboard/DashboardRequests"));
const DashboardQuizHistory = lazy(() => import("./pages/dashboard/DashboardQuizHistory"));

// Admin pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminTeachers = lazy(() => import("./pages/admin/AdminTeachers"));
const AdminApplications = lazy(() => import("./pages/admin/AdminApplications"));
const AdminRecordings = lazy(() => import("./pages/admin/AdminRecordings"));
const AdminCurriculum = lazy(() => import("./pages/admin/AdminCurriculum"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminBankDetails = lazy(() => import("./pages/admin/AdminBankDetails"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminCertificates = lazy(() => import("./pages/admin/AdminCertificates"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminBundles = lazy(() => import("./pages/admin/AdminBundles"));
const AdminAdmins = lazy(() => import("./pages/admin/AdminAdmins"));
const AdminTeacherProfile = lazy(() => import("./pages/admin/AdminTeacherProfile"));
const AdminClassRequests = lazy(() => import("./pages/admin/AdminClassRequests"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminWhatsAppAutomation = lazy(() => import("./pages/admin/AdminWhatsAppAutomation"));
const AdminQuizzes = lazy(() => import("./pages/admin/AdminQuizzes"));

// Teacher pages
const TeacherLayout = lazy(() => import("./pages/teacher/TeacherLayout"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherClasses = lazy(() => import("./pages/teacher/TeacherClasses"));
const TeacherSessions = lazy(() => import("./pages/teacher/TeacherSessions"));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherRecordings = lazy(() => import("./pages/teacher/TeacherRecordings"));
const TeacherEarnings = lazy(() => import("./pages/teacher/TeacherEarnings"));
const TeacherQuizCenter = lazy(() => import("./pages/teacher/TeacherQuizCenter"));
const TeacherLiveQuizConsole = lazy(() => import("./pages/teacher/TeacherLiveQuizConsole"));
const TeacherQuizAnalytics = lazy(() => import("./pages/teacher/TeacherQuizAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requireAdmin>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

const TeacherWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requireTutor>
    <TeacherLayout>{children}</TeacherLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/curriculum" element={<CurriculumPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/class/:id" element={<ClassDetailPage />} />
                <Route path="/recordings" element={<RecordingsPage />} />
                <Route path="/recording/:id" element={<RecordingPlayerPage />} />
                <Route path="/bundles" element={<BundlesPage />} />
                <Route path="/seminars" element={<SeminarsPage />} />
                <Route path="/workshops" element={<WorkshopsPage />} />
                <Route path="/how-to-use" element={<HowToUsePage />} />
                <Route path="/tutor-application" element={<TutorApplicationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/request-class" element={<RequestClassPage />} />
                <Route path="/tutor/:id" element={<TutorProfilePage />} />
                <Route path="/tutors" element={<TutorsPage />} />
                <Route path="/quizzes" element={<QuizzesPage />} />
                <Route path="/quizzes/join" element={<QuizJoinPage />} />
                <Route path="/quizzes/live/:sessionId" element={<LiveQuizParticipantPage />} />
                <Route path="/quiz/:id" element={<QuizPlayPage />} />
                <Route path="/quiz/results/:attemptId" element={<QuizResultsPage />} />

                {/* Student Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <DashboardWrapper>
                      <DashboardOverview />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/schedule"
                  element={
                    <DashboardWrapper>
                      <DashboardSchedule />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/classes"
                  element={
                    <DashboardWrapper>
                      <DashboardClasses />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/recordings"
                  element={
                    <DashboardWrapper>
                      <DashboardRecordings />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/history"
                  element={
                    <DashboardWrapper>
                      <DashboardHistory />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/wishlist"
                  element={
                    <DashboardWrapper>
                      <DashboardWishlist />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/notes"
                  element={
                    <DashboardWrapper>
                      <DashboardNotes />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/payments"
                  element={
                    <DashboardWrapper>
                      <DashboardPayments />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/profile"
                  element={
                    <DashboardWrapper>
                      <DashboardProfile />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/certificates"
                  element={
                    <DashboardWrapper>
                      <DashboardCertificates />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/referrals"
                  element={
                    <DashboardWrapper>
                      <DashboardPlaceholder title="Referrals" />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/requests"
                  element={
                    <DashboardWrapper>
                      <DashboardRequests />
                    </DashboardWrapper>
                  }
                />
                <Route
                  path="/dashboard/quiz-history"
                  element={
                    <DashboardWrapper>
                      <DashboardQuizHistory />
                    </DashboardWrapper>
                  }
                />

                {/* Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <AdminWrapper>
                      <AdminDashboard />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/classes"
                  element={
                    <AdminWrapper>
                      <AdminClasses />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/sessions"
                  element={
                    <AdminWrapper>
                      <AdminSessions />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/students"
                  element={
                    <AdminWrapper>
                      <AdminStudents />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/teachers"
                  element={
                    <AdminWrapper>
                      <AdminTeachers />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/teachers/:id"
                  element={
                    <AdminWrapper>
                      <AdminTeacherProfile />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/applications"
                  element={
                    <AdminWrapper>
                      <AdminApplications />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/recordings"
                  element={
                    <AdminWrapper>
                      <AdminRecordings />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/curriculum"
                  element={
                    <AdminWrapper>
                      <AdminCurriculum />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/bundles"
                  element={
                    <AdminWrapper>
                      <AdminBundles />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <AdminWrapper>
                      <AdminPayments />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/bank-details"
                  element={
                    <AdminWrapper>
                      <AdminBankDetails />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/payouts"
                  element={
                    <AdminWrapper>
                      <AdminPayouts />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/certificates"
                  element={
                    <AdminWrapper>
                      <AdminCertificates />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/coupons"
                  element={
                    <AdminWrapper>
                      <AdminCoupons />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/announcements"
                  element={
                    <AdminWrapper>
                      <AdminAnnouncements />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/testimonials"
                  element={
                    <AdminWrapper>
                      <AdminTestimonials />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <AdminWrapper>
                      <AdminAnalytics />
                    </AdminWrapper>
                  }
                />

                <Route
                  path="/admin/admins"
                  element={
                    <AdminWrapper>
                      <AdminAdmins />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/class-requests"
                  element={
                    <AdminWrapper>
                      <AdminClassRequests />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/whatsapp"
                  element={
                    <AdminWrapper>
                      <AdminWhatsApp />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/whatsapp-automation"
                  element={
                    <AdminWrapper>
                      <AdminWhatsAppAutomation />
                    </AdminWrapper>
                  }
                />
                <Route
                  path="/admin/quizzes"
                  element={
                    <AdminWrapper>
                      <AdminQuizzes />
                    </AdminWrapper>
                  }
                />

                {/* Teacher Dashboard */}
                <Route path="/teacher" element={<TeacherWrapper><TeacherDashboard /></TeacherWrapper>} />
                <Route path="/teacher/classes" element={<TeacherWrapper><TeacherClasses /></TeacherWrapper>} />
                <Route path="/teacher/sessions" element={<TeacherWrapper><TeacherSessions /></TeacherWrapper>} />
                <Route path="/teacher/students" element={<TeacherWrapper><TeacherStudents /></TeacherWrapper>} />
                <Route path="/teacher/recordings" element={<TeacherWrapper><TeacherRecordings /></TeacherWrapper>} />
                <Route path="/teacher/earnings" element={<TeacherWrapper><TeacherEarnings /></TeacherWrapper>} />
                <Route path="/teacher/quiz-center" element={<TeacherWrapper><TeacherQuizCenter /></TeacherWrapper>} />
                <Route path="/teacher/quiz-center/live/:sessionId" element={<TeacherWrapper><TeacherLiveQuizConsole /></TeacherWrapper>} />
                <Route path="/teacher/quiz-center/:quizId/analytics" element={<TeacherWrapper><TeacherQuizAnalytics /></TeacherWrapper>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

