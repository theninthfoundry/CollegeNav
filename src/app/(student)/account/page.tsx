"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function AccountPage() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({
      message: `Sign in code sent to ${email}`,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
          Account
        </h1>
        <p className="text-sm text-ink-3">
          Manage followed routes, notifications, and campus transit preferences.
        </p>
      </header>

      {/* Sign in with college email */}
      <div className="rounded-lg border border-line p-5 bg-paper space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-ink">Sign in with College Email</h2>
          <p className="text-xs text-ink-3">
            Sign in to sync your followed routes across devices and receive Web Push disruption alerts.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-3 max-w-md">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@college.edu"
            aria-label="College email"
          />
          <Button type="submit" variant="primary">
            Send sign in code
          </Button>
        </form>
      </div>

      {/* About data honesty */}
      <div className="rounded-lg border border-line p-5 bg-s1 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold text-ink">Our Honesty Commitment</h2>
        </div>
        <p className="text-sm text-ink-2 leading-relaxed">
          CollegeNav never guesses arrival times or hides disruptions. Every displayed timing carries a source label (Live, Estimated, or Scheduled), and every route displays a public verification status maintained by the transport office.
        </p>
        <div className="pt-2 text-xs text-ink-3 border-t border-line">
          Timezone: Asia/Kolkata (IST) • Dejavu Hackathon Problem 05
        </div>
      </div>
    </div>
  );
}
