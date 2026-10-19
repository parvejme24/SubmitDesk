import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBackground } from "@/components/theme/app-background";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SubmitDesk", template: "%s · SubmitDesk" },
  description: "Submit projects and get them reviewed by mentors.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2f9" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1e2e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme class before hydration
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        <ThemeProvider>
          <AppBackground />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
