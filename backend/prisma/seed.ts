import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type SubmissionStatus } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const STUDENT_PASSWORD = "Student@12345";

// One-click sign-in accounts (buttons on the login page). Keep in sync with frontend/src/lib/quick-login.ts
const QUICK_ACCOUNTS = [
  { name: "Tanvir Ahmed", email: "tanvir.ahmed@submitdesk.dev", password: "SubmitDesk@2026", role: "MENTOR" },
  { name: "Nadia Islam", email: "nadia.islam@submitdesk.dev", password: "SubmitDesk@2026", role: "STUDENT" },
] as const;

const emailFor = (name: string) => `${name.toLowerCase().replace(/\s+/g, ".")}@submitdesk.dev`;
const handleFor = (name: string) => name.toLowerCase().replace(/\s+/g, "");

const projects = [
  "Todo App", "Weather Dashboard", "Portfolio Site", "E-commerce Store", "Chat App",
  "Blog Platform", "Recipe Finder", "Expense Tracker", "Quiz Game", "Movie Explorer",
  "Job Board", "Fitness Tracker", "Notes App", "URL Shortener", "Kanban Board",
  "Music Player", "Hotel Booking", "Library System", "Crypto Tracker", "Travel Planner",
  "Event Manager", "Food Delivery", "Doctor Appointment", "Real Estate Listing", "Pomodoro Timer",
];

const statuses: SubmissionStatus[] = ["PENDING", "APPROVED", "REJECTED"];

async function main() {
  const email = process.env.SEED_MENTOR_EMAIL;
  const password = process.env.SEED_MENTOR_PASSWORD;
  if (!email || !password) throw new Error("SEED_MENTOR_EMAIL and SEED_MENTOR_PASSWORD must be set in .env");

  const mentor = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Head Mentor", email, passwordHash: await bcrypt.hash(password, 10), role: "MENTOR" },
  });
  console.log(`✔ Mentor: ${mentor.email}`);

  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
  const students = await Promise.all(
    ["Rahim Uddin", "Karim Hasan", "Nusrat Jahan", "Tania Akter", "Sabbir Ahmed"].map((name, i) =>
      prisma.user.upsert({
        where: { email: emailFor(name) },
        update: {},
        create: { name, email: emailFor(name), passwordHash: studentHash },
      }),
    ),
  );
  console.log(`✔ ${students.length} students (password: ${STUDENT_PASSWORD})`);

  const quick: Record<string, string> = {};
  for (const a of QUICK_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { role: a.role },
      create: { name: a.name, email: a.email, passwordHash: await bcrypt.hash(a.password, 10), role: a.role },
    });
    quick[a.role] = user.id;
  }
  console.log(`✔ Quick sign-in accounts: ${QUICK_ACCOUNTS.map((a) => a.email).join(", ")}`);

  // A few projects for the quick sign-in student, one in each status.
  const studentProjects: { name: string; slug: string; status: SubmissionStatus; mark?: number; comment?: string }[] = [
    { name: "Portfolio Website", slug: "portfolio-website", status: "APPROVED", mark: 88, comment: "Clean design and great README!" },
    {
      name: "Task Manager",
      slug: "task-manager",
      status: "REJECTED",
      mark: 45,
      comment: "Drag and drop breaks on mobile, and the live link shows a 404 on refresh.",
    },
    { name: "Movie Search App", slug: "movie-search-app", status: "PENDING" },
  ];
  let created = 0;
  for (const [i, p] of studentProjects.entries()) {
    const repoUrlKey = `github.com/nadiaislam/${p.slug}`;
    if (await prisma.submission.findUnique({ where: { repoUrlKey }, select: { id: true } })) continue;
    const createdAt = new Date(Date.now() - (studentProjects.length - i) * 24 * 60 * 60 * 1000);
    await prisma.submission.create({
      data: {
        projectName: p.name,
        repoUrl: `https://github.com/nadiaislam/${p.slug}`,
        repoUrlKey,
        liveUrl: `https://${p.slug}-nadia.vercel.app`,
        description: `${p.name} built with Next.js and Tailwind CSS. Responsive layout, form validation and dark mode.`,
        status: p.status,
        studentId: quick.STUDENT!,
        createdAt,
        ...(p.status !== "PENDING" && {
          reviewedById: mentor.id,
          reviewedAt: new Date(createdAt.getTime() + 3 * 60 * 60 * 1000),
          feedbacks: { create: { mentorId: mentor.id, decision: p.status, mark: p.mark, comment: p.comment } },
        }),
      },
    });
    created++;
  }

  for (const [i, projectName] of projects.entries()) {
    const student = students[i % students.length]!;
    const slug = projectName.toLowerCase().replace(/\s+/g, "-");
    const handle = handleFor(student.name); // GitHub usernames have no dots
    const repoUrl = `https://github.com/${handle}/${slug}`;
    const repoUrlKey = `github.com/${handle}/${slug}`;
    const status = statuses[i % statuses.length]!;
    const createdAt = new Date(Date.now() - (projects.length - i) * 6 * 60 * 60 * 1000);

    const exists = await prisma.submission.findUnique({ where: { repoUrlKey }, select: { id: true } });
    if (exists) continue;

    await prisma.submission.create({
      data: {
        projectName,
        repoUrl,
        repoUrlKey,
        liveUrl: `https://${slug}-${handle}.vercel.app`,
        description: `${projectName} built with React and Tailwind. Includes responsive layout, form validation and a clean UI.`,
        status,
        studentId: student.id,
        createdAt,
        ...(status !== "PENDING" && {
          reviewedById: mentor.id,
          reviewedAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
          feedbacks: {
            create: {
              mentorId: mentor.id,
              decision: status,
              // Spread the marks a bit: approved 72–96, rejected 30–54
              mark: status === "APPROVED" ? 72 + ((i * 7) % 25) : 30 + ((i * 5) % 25),
              comment:
                status === "APPROVED"
                  ? "Great work, clean code and good structure."
                  : "Live site is broken on mobile and README is missing setup steps.",
            },
          },
        }),
      },
    });
    created++;
  }
  console.log(`✔ ${created} submissions created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
