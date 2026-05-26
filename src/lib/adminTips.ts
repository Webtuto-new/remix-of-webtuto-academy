/**
 * Tips shown next to each admin page title.
 * Keys are the exact pathnames in AdminLayout's menu.
 */
export const ADMIN_TIPS: Record<string, { title: string; body: string }> = {
  "/admin": {
    title: "Admin Dashboard",
    body: "Quick overview of the platform — students, classes, revenue and pending tasks. Click any KPI to drill down.",
  },
  "/admin/classes": {
    title: "Classes",
    body: "Create and edit live, recorded and hybrid classes. Set price, schedule, teacher, curriculum and thumbnail. Use 'Bulk Create' to publish a class across multiple grades at once.",
  },
  "/admin/sessions": {
    title: "Sessions & Zoom",
    body: "Manage individual Zoom session links per class. Add the meeting URL and time — students see them in their dashboard schedule.",
  },
  "/admin/students": {
    title: "Students",
    body: "Search, view and manage student accounts. From here you can manually enroll a student into a class, view payment history, or update their phone number.",
  },
  "/admin/teachers": {
    title: "Teachers",
    body: "Add or edit tutors. Each teacher needs a name, bio, qualifications and photo. Link a teacher to a user account to give them access to the Teacher panel.",
  },
  "/admin/applications": {
    title: "Tutor Applications",
    body: "Review submissions from the Become-a-Tutor form. Open the CV and demo video, then approve to create a teacher profile or reject.",
  },
  "/admin/class-requests": {
    title: "Class Requests",
    body: "Custom class requests from students (subject, grade, budget). Reply on WhatsApp/email and either create a matching class or mark as fulfilled.",
  },
  "/admin/whatsapp": {
    title: "WhatsApp Messages",
    body: "Send broadcast or targeted WhatsApp messages to enrolled students. Templates support {{name}} and {{class}} placeholders.",
  },
  "/admin/whatsapp-automation": {
    title: "WhatsApp Automation",
    body: "Automatic reminders before classes, payment follow-ups and welcome messages. Toggle each rule on/off and edit the timing.",
  },
  "/admin/recordings": {
    title: "Recordings",
    body: "Upload lesson videos (max 500MB) and link them to a class. Add chapters, notes and free-preview URLs to gate paid content.",
  },
  "/admin/quizzes": {
    title: "Quizzes",
    body: "Build practice quizzes, scheduled exams and live quiz games. Use the Quiz Builder to paste questions in bulk or import from CSV.",
  },
  "/admin/curriculum": {
    title: "Curriculum",
    body: "Manage the three-tier hierarchy: Curriculum → Grade → Subject. Drag to reorder. Anything inactive is hidden from students.",
  },
  "/admin/bundles": {
    title: "Bundles",
    body: "Group multiple classes/recordings into a discounted package. Set a single price and bundle thumbnail.",
  },
  "/admin/payments": {
    title: "Payments",
    body: "Approve manual bank-transfer payments. Open a payment to see the uploaded receipt, then Approve to activate the enrollment or Reject with a reason.",
  },
  "/admin/bank-details": {
    title: "Bank Details",
    body: "Bank account info shown to students on the checkout page. Keep at least one active account.",
  },
  "/admin/payouts": {
    title: "Teacher Payouts",
    body: "Track money owed to each tutor based on confirmed enrollments. Mark as Paid once you settle outside the platform.",
  },
  "/admin/certificates": {
    title: "Certificates",
    body: "Issue completion certificates to students. Pick a class, select students and generate a PDF — they appear in the student dashboard.",
  },
  "/admin/coupons": {
    title: "Coupons",
    body: "Create percentage or fixed-amount discount codes. Limit by class, expiry date, or total uses.",
  },
  "/admin/announcements": {
    title: "Announcements",
    body: "Banner messages shown across the site or to specific classes. Useful for exam updates, holidays or new launches.",
  },
  "/admin/analytics": {
    title: "Analytics",
    body: "Revenue trends, top classes, conversion and student engagement. Filter by date range or curriculum.",
  },
  "/admin/admins": {
    title: "Admin Management",
    body: "Grant or revoke admin/tutor roles. Use with care — admins have full data access.",
  },
};

export const getAdminTip = (pathname: string) => {
  // exact match first, then prefix
  if (ADMIN_TIPS[pathname]) return ADMIN_TIPS[pathname];
  const match = Object.keys(ADMIN_TIPS)
    .filter((k) => pathname.startsWith(k) && k !== "/admin")
    .sort((a, b) => b.length - a.length)[0];
  return match ? ADMIN_TIPS[match] : null;
};

export const getAdminTitle = (pathname: string) => {
  const tip = getAdminTip(pathname);
  return tip?.title || "Admin";
};