"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { BookOpen, Radio, Target } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { font, monoLabelStyle } from "@/components/learn/ui";
import { errorMessage } from "@/components/admin/ui";

const steps = [
  {
    icon: BookOpen,
    title: "Learn",
    body: "Work through modules one lesson at a time. Your progress saves as you go.",
  },
  {
    icon: Target,
    title: "Missions",
    body: "Put each module into practice. Submit a link to your work and mentors review it.",
  },
  {
    icon: Radio,
    title: "Live",
    body: "Join sessions with your cohort and mentors. Recordings appear here afterwards.",
  },
];

function cohortContext(trackName: string, cohort: { name: string; startsAt: number }) {
  if (cohort.startsAt <= Date.now()) return `You're in ${trackName}, ${cohort.name}.`;
  const date = new Date(cohort.startsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `You're in ${trackName}, ${cohort.name}. It starts ${date}.`;
}

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(destination: string) {
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding({});
      router.replace(destination);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const firstName = me?.user.fullName.split(/\s+/)[0] ?? "";
  const studentTrack = me?.tracks.find((t) => t.isStudent || t.isAlumni);
  const staffTracks = me?.tracks.filter((t) => t.staffRole !== null) ?? [];

  let context: string | null = null;
  if (studentTrack?.cohort) {
    context = cohortContext(studentTrack.name, studentTrack.cohort);
  } else if (staffTracks.length > 0) {
    context = `You're on the team for ${staffTracks.map((t) => t.name).join(", ")}.`;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            alt="BitDesigners Africa"
            style={{ height: 22, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
          />
          <button
            type="button"
            onClick={() => finish("/home")}
            disabled={busy || !me}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: font.body,
              fontSize: 14,
              color: "var(--color-text-tertiary)",
              cursor: busy || !me ? "default" : "pointer",
            }}
          >
            Skip
          </button>
        </div>

        <p style={monoLabelStyle}>Welcome</p>
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 32,
            lineHeight: "40px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: "8px 0 0",
          }}
        >
          {me ? `Welcome, ${firstName}.` : "Welcome."}
        </h1>
        <p style={{ fontFamily: font.body, fontSize: 16, lineHeight: "26px", color: "var(--color-text-secondary)", margin: "12px 0 0" }}>
          {context ?? "Here's how BitDesigners works."}
        </p>

        <ol style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: 20,
                  borderRadius: 14,
                  border: "1px solid var(--color-border-subtle)",
                  backgroundColor: "var(--color-bg-surface)",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(99,102,241,0.12)",
                    color: "#A5B4FC",
                  }}
                >
                  <Icon style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <p style={{ fontFamily: font.body, fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                    {index + 1}. {step.title}
                  </p>
                  <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {error && (
          <p role="alert" style={{ fontFamily: font.body, fontSize: 14, color: "#F87171", margin: "20px 0 0" }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
          <button
            type="button"
            onClick={() => finish("/home")}
            disabled={busy || !me}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "var(--color-indigo)",
              color: "#fff",
              fontFamily: font.body,
              fontSize: 15,
              fontWeight: 600,
              cursor: busy || !me ? "default" : "pointer",
              opacity: busy || !me ? 0.6 : 1,
            }}
          >
            Go to my dashboard
          </button>
          <button
            type="button"
            onClick={() => finish("/profile")}
            disabled={busy || !me}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: "1px solid var(--color-border-strong)",
              backgroundColor: "transparent",
              color: "var(--color-text-primary)",
              fontFamily: font.body,
              fontSize: 15,
              fontWeight: 500,
              cursor: busy || !me ? "default" : "pointer",
              opacity: busy || !me ? 0.6 : 1,
            }}
          >
            Set up my profile
          </button>
        </div>
      </div>
    </main>
  );
}
