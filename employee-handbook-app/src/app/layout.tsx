import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { IdleTimeoutProvider } from '@/lib/idle-timeout/provider';
import { ClerkSignOutListener } from "@/lib/idle-timeout/clerkSignOutListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gail - Employee Handbook App",
  description: "AI-powered chatbot helping workers understand their rights and company policies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <IdleTimeoutProvider>
            <ClerkSignOutListener />
            {children}
          </IdleTimeoutProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}