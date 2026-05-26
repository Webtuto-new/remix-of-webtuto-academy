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
import CurriculumPage from "./pages/CurriculumPage";
import ClassesPage from "./pages/ClassesPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import RecordingsPage from "./pages/RecordingsPage";
import RecordingPlayerPage from "./pages/RecordingPlayerPage";
import BundlesPage from "./pages/BundlesPage";
import SeminarsPage from "./pages/SeminarsPage";
import WorkshopsPage from "./pages/WorkshopsPage";
import HowToUsePage from "./pages/HowToUsePage";
import TutorApplicationPage from "./pages/TutorApplicationPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SearchPage from "./pages/SearchPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import ContactPage from "./pages/ContactPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFound from "./pages/NotFound";
import RequestClassPage from "./pages/RequestClassPage";
import TutorProfilePage from "./pages/TutorProfilePage";
import TutorsPage from "./pages/TutorsPage";
import QuizzesPage from "./pages/QuizzesPage";
import QuizPlayPage from "./pages/QuizPlayPage";
import QuizJoinPage from "./pages/QuizJoinPage";
import LiveQuizParticipantPage from "./pages/LiveQuizParticipantPage";

// Dashboard pages
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardSchedule from "./pages/dashboard/DashboardSchedule";
import DashboardClasses from "./pages/dashboard/DashboardClasses";
import DashboardRecordings from "./pages/dashboard/DashboardRecordings";
import DashboardPayments from "./pages/dashboard/DashboardPayments";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardWishlist from "./pages/dashboard/DashboardWishlist";
import DashboardHistory from "./pages/dashboard/DashboardHistory";
import DashboardCertificates from "./pages/dashboard/DashboardCertificates";
import DashboardNotes from "./pages/dashboard/DashboardNotes";
import DashboardPlaceholder from "./pages/dashboard/DashboardPlaceholder";
import DashboardRequests from "./pages/dashboard/DashboardRequests";
import DashboardQuizHistory from "./pages/dashboard/DashboardQuizHistory";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminRecordings from "./pages/admin/AdminRecordings";
import AdminCurriculum from "./pages/admin/AdminCurriculum";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminBankDetails from "./pages/admin/AdminBankDetails";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBundles from "./pages/admin/AdminBundles";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminTeacherProfile from "./pages/admin/AdminTeacherProfile";
import AdminClassRequests from "./pages/admin/AdminClassRequests";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminWhatsAppAutomation from "./pages/admin/AdminWhatsAppAutomation";
import AdminQuizzes from "./pages/admin/AdminQuizzes";

// Teacher pages
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherSessions from "./pages/teacher/TeacherSessions";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherRecordings from "./pages/teacher/TeacherRecordings";
import TeacherEarnings from "./pages/teacher/TeacherEarnings";
import TeacherQuizCenter from "./pages/teacher/TeacherQuizCenter";
import TeacherLiveQuizConsole from "./pages/teacher/TeacherLiveQuizConsole";

const queryClient = new QueryClient();

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

                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

