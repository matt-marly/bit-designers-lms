"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { useAuth, useClerk, useSignUp } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { clerkErrorMessage } from "@/lib/clerk-error";
import { passwordError } from "@/lib/password-policy";
import { ConfirmPasswordField, NewPasswordField } from "@/components/auth/password-field";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const labelStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "#B5B5B5",
  display: "block",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  backgroundColor: "#181818",
  border: "1px solid #333333",
  borderRadius: 10,
  padding: "0 14px",
  fontFamily: font.body,
  fontSize: 14,
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#333333";
    e.currentTarget.style.boxShadow = "none";
  },
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  backgroundColor: "transparent",
  color: "#FFFFFF",
  border: "1px solid #333333",
  borderRadius: 10,
  fontFamily: font.body,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  marginTop: 20,
};

type Phase = "form" | "linking" | "done";

export default function AcceptInvitePage() {
  return (
    <Shell>
      <Suspense fallback={<Spinner label="Loading invitation..." />}>
        <AcceptInvite />
      </Suspense>
    </Shell>
  );
}

function AcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticket = searchParams.get("__clerk_ticket");
  const clerkStatus = searchParams.get("__clerk_status");

  const { signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const { isAuthenticated } = useConvexAuth();
  const ensureCurrent = useMutation(api.users.ensureCurrent);
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  const [phase, setPhase] = useState<Phase>("form");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const linkStarted = useRef(false);

  useEffect(() => {
    if (phase !== "linking" || !isAuthenticated || linkStarted.current) return;
    linkStarted.current = true;
    ensureCurrent({ fullName })
      .then((result) => {
        if (result === "ok") {
          setPhase("done");
        } else {
          setError(
            result === "suspended"
              ? "Your account has been suspended. Contact an admin."
              : "Your account was created, but we couldn't find your invitation. Contact an admin.",
          );
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ConvexError
            ? String(err.data)
            : "Your account was created, but we couldn't apply your invitation. Contact an admin.",
        );
        setLoading(false);
      });
  }, [phase, isAuthenticated, ensureCurrent, fullName]);

  useEffect(() => {
    if (phase !== "done" || !me) return;
    router.replace(me.hasAdminAccess ? "/admin" : "/home");
  }, [phase, me, router]);

  const passwordValid = passwordError(password) === null;
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    phase === "form" && !loading && fullName.trim().length > 0 && passwordValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    setError("");

    const invalidPassword = passwordError(password);
    if (invalidPassword) {
      setError(invalidPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const { error: createError } = await signUp.create({ strategy: "ticket", ticket, password });
    if (createError) {
      const alreadyUsed =
        createError.code.includes("ticket") || createError.code === "form_identifier_exists";
      setError(
        alreadyUsed
          ? "This invitation has already been used. Sign in with your email and password instead."
          : clerkErrorMessage(createError),
      );
      setLoading(false);
      return;
    }

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || undefined;

    // A ticket sign-up usually completes immediately, and a completed sign-up
    // can't be updated, so names only go on the sign-up when Clerk requires them.
    if (
      signUp.status === "missing_requirements" &&
      (signUp.missingFields.includes("first_name") || signUp.missingFields.includes("last_name"))
    ) {
      const { error: updateError } = await signUp.update({ firstName, lastName });
      if (updateError) {
        setError(clerkErrorMessage(updateError));
        setLoading(false);
        return;
      }
    }

    if (signUp.status !== "complete") {
      setError("We couldn't finish creating your account. Please contact an admin.");
      setLoading(false);
      return;
    }

    const { error: finalizeError } = await signUp.finalize();
    if (finalizeError) {
      setError(
        `Your account was created, but we couldn't sign you in (${clerkErrorMessage(finalizeError)}). Sign in from the login page.`,
      );
      setLoading(false);
      return;
    }

    if (clerk.user && !clerk.user.firstName) {
      // Best effort: the name of record lives in Convex, so a failure here is harmless.
      await clerk.user.update({ firstName, lastName }).catch(() => undefined);
    }
    setPhase("linking");
  };

  if (phase === "form" && isSignedIn && !loading) {
    return (
      <Notice
        title="You're already signed in"
        body="Sign out first if you want to accept this invitation with a different account."
        actionLabel="Continue"
        onAction={() => router.push(me?.hasAdminAccess ? "/admin" : "/home")}
      />
    );
  }

  if (!ticket) {
    return (
      <Notice
        title="Invalid invitation link"
        body="This link is missing its invitation token. Open the link from your invitation email again."
        actionLabel="Back to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (clerkStatus === "sign_in") {
    return (
      <Notice
        title="You already have an account"
        body="Sign in with your existing account to access your invitation."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p
          style={{
            fontFamily: font.display,
            fontSize: 18,
            fontWeight: 600,
            color: "#FFFFFF",
            margin: 0,
            marginBottom: 4,
          }}
        >
          BitDesigners Africa
        </p>
        <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>
          You&apos;ve been invited. Set up your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={labelStyle}>FULL NAME</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Amara Okonkwo"
            autoComplete="name"
            required
            disabled={phase !== "form"}
            style={inputStyle}
            {...focusHandlers}
          />
        </div>

        <NewPasswordField
          label="PASSWORD"
          value={password}
          onChange={setPassword}
          disabled={phase !== "form"}
          labelStyle={labelStyle}
        />

        <ConfirmPasswordField
          label="CONFIRM PASSWORD"
          value={confirmPassword}
          onChange={setConfirmPassword}
          password={password}
          disabled={phase !== "form"}
          labelStyle={labelStyle}
        />

        {/* Clerk bot protection mounts here */}
        <div id="clerk-captcha" />

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.20)",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: font.body,
              fontSize: 13,
              color: "#F87171",
              marginTop: -8,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            height: 40,
            backgroundColor: "#6366F1",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            fontFamily: font.body,
            fontSize: 14,
            fontWeight: 500,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.4,
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => {
            if (canSubmit) e.currentTarget.style.backgroundColor = "#777AF5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#6366F1";
          }}
        >
          {phase === "form"
            ? loading
              ? "Creating account..."
              : "Accept invitation"
            : "Setting up your access..."}
        </button>
      </form>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#090909",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: "#111111",
            border: "1px solid #242424",
            borderRadius: 16,
            padding: 40,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid #333333",
          borderTop: "2px solid #6366F1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0, marginTop: 12 }}>
        {label}
      </p>
    </div>
  );
}

function Notice({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <XCircle style={{ width: 32, height: 32, color: "#EF4444", marginBottom: 12 }} aria-hidden="true" />
      <h2
        style={{
          fontFamily: font.display,
          fontSize: 20,
          fontWeight: 600,
          color: "#FFFFFF",
          margin: 0,
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>{body}</p>
      <button type="button" onClick={onAction} style={secondaryButtonStyle}>
        {actionLabel}
      </button>
    </div>
  );
}
