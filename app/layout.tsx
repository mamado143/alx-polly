import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "./providers";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polling App",
  description: "Create and share polls with real-time results",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <div className="min-h-screen bg-background">
            <nav className="border-b">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center space-x-6">
                    <Link href="/" className="text-xl font-semibold hover:text-primary">
                      Polling App
                    </Link>
                    <nav className="hidden md:flex space-x-4">
                      <Link href="/polls" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        My Polls
                      </Link>
                      <Link href="/polls/new" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        Create Poll
                      </Link>
                    </nav>
                  </div>
                  <div className="flex items-center space-x-4">
                    <AuthButton />
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
