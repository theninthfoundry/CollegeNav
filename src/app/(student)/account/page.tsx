"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Info, Bell, BellOff, MapPin, Check, Bookmark, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteBadge } from "@/components/transit/route-badge";
import { useToast } from "@/components/ui/toast";

export default function AccountPage() {
  const { toast } = useToast();
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [email, setEmail] = React.useState("aarav.student@college.edu");
  const [followedRoutes, setFollowedRoutes] = React.useState<string[]>(["R1", "R3"]);
  const [pushStatus, setPushStatus] = React.useState<"default" | "granted" | "denied">("default");
  const [savedPlaces, setSavedPlaces] = React.useState([
    { id: "1", label: "Home, Miyapur", address: "Flat 402, Mayfair Gardens" },
    { id: "2", label: "Hostel Block B", address: "Near Campus Sports Complex" },
  ]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignedIn(true);
    toast({
      message: `Signed in as ${email}`,
    });
  };

  const toggleFollowRoute = (code: string) => {
    if (followedRoutes.includes(code)) {
      setFollowedRoutes(followedRoutes.filter((r) => r !== code));
      toast({ message: `Unfollowed Route ${code}` });
    } else {
      setFollowedRoutes([...followedRoutes, code]);
      toast({ message: `Following Route ${code}` });
    }
  };

  const handleEnablePush = async () => {
    if (!("Notification" in window)) {
      alert("Push notifications not supported by this browser");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushStatus(perm);
    if (perm === "granted") {
      toast({ message: "Push notifications enabled for followed routes!" });
    } else {
      toast({ message: "Notification permission was not granted." });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
          Student Account
        </h1>
        <p className="text-sm text-ink-3">
          Manage followed routes, web push alerts, and saved transit places.
        </p>
      </header>

      {/* Sign In State */}
      {!isSignedIn ? (
        <div className="rounded-xl border border-line p-5 bg-paper space-y-4 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-ink">Sign in with College Email</h2>
            <p className="text-xs text-ink-3">
              Sign in to sync your followed routes across devices and receive real-time push alerts.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-3 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink focus:outline-accent"
              required
            />
            <Button type="submit" variant="primary" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Sign in as Aarav (Demo)</span>
            </Button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-line p-5 bg-paper flex items-center justify-between shadow-xs">
          <div>
            <div className="text-sm font-semibold text-ink">{email}</div>
            <div className="text-xs text-accent font-medium">B.Tech Student &bull; Enrolled</div>
          </div>
          <button
            type="button"
            onClick={() => setIsSignedIn(false)}
            className="text-xs font-semibold text-ink-3 hover:text-ink px-3 py-1.5 rounded-lg border border-line"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Push Notifications Section */}
      <div className="rounded-xl border border-line p-5 bg-paper space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <span>Disruption Web Push Notifications</span>
            </h2>
            <p className="text-xs text-ink-3">
              Receive notifications for delays &gt; 5 min and cancellations on your routes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleEnablePush}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pushStatus === "granted"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-accent text-white hover:bg-accent/90"
            }`}
          >
            {pushStatus === "granted" ? "Push Enabled" : "Enable Push"}
          </button>
        </div>
      </div>

      {/* Following Routes */}
      <div className="rounded-xl border border-line p-5 bg-paper space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Followed Campus Routes ({followedRoutes.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { code: "R1", name: "Miyapur to Campus" },
            { code: "R2", name: "Kukatpally to Campus" },
            { code: "R3", name: "Secunderabad Express" },
            { code: "R4", name: "Gachibowli Shuttle" },
          ].map((r) => {
            const isFollowed = followedRoutes.includes(r.code);
            return (
              <div
                key={r.code}
                className="flex items-center justify-between p-3 rounded-lg border border-line bg-neutral-50/50"
              >
                <div className="flex items-center gap-2.5">
                  <RouteBadge code={r.code} size="sm" />
                  <span className="text-xs font-semibold text-ink">{r.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFollowRoute(r.code)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    isFollowed
                      ? "bg-accent text-white"
                      : "bg-paper border border-line text-ink-2 hover:bg-neutral-100"
                  }`}
                >
                  {isFollowed ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Places */}
      <div className="rounded-xl border border-line p-5 bg-paper space-y-3 shadow-xs">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Saved Places
        </h2>
        <div className="divide-y divide-line">
          {savedPlaces.map((place) => (
            <div key={place.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-accent" />
                <div>
                  <div className="text-xs font-semibold text-ink">{place.label}</div>
                  <div className="text-[11px] text-ink-3">{place.address}</div>
                </div>
              </div>
              <Link
                href={`/?from=place:${place.id}`}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Plan from here
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Honesty Commitment info card */}
      <div className="rounded-xl border border-line p-5 bg-neutral-50/80 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-semibold text-ink">Our Honesty Guarantee</h2>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed">
          CollegeNav labels every arrival time with its authentic source (Live, Estimated, or Scheduled). 
          Live signals degrade to Estimated after 30 seconds and to Scheduled after 120 seconds. 
          Outdated schedules are never marked &ldquo;Best option&rdquo;, and suspended routes clearly explain why.
        </p>
      </div>
    </div>
  );
}
