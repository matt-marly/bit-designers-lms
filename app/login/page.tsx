"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useSignIn } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clerkErrorMessage } from "@/lib/clerk-error";

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

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // `me` stays null until AuthBootstrap links the account (or blocks it).
  useEffect(() => {
    if (!isAuthenticated || !me) return;
    router.replace(me.hasAdminAccess ? "/admin" : "/home");
  }, [isAuthenticated, me, router]);

  const finishSignIn = async () => {
    const { error } = await signIn.finalize();
    if (error) {
      setError(clerkErrorMessage(error));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) {
      // Already signed in: the redirect effect takes over once Convex catches up.
      if (error.code !== "session_exists") setError(clerkErrorMessage(error));
      setLoading(false);
      return;
    }

    if (signIn.status === "complete") {
      await finishSignIn();
      return;
    }

    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const hasEmailCode = signIn.supportedSecondFactors.some(
        (factor) => factor.strategy === "email_code",
      );
      if (hasEmailCode) {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          setError(clerkErrorMessage(sendError));
        } else {
          setStep("code");
        }
        setLoading(false);
        return;
      }
    }

    setError("Unable to complete sign in. Please contact an admin.");
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setError(clerkErrorMessage(error));
      setLoading(false);
      return;
    }

    if (signIn.status === "complete") {
      await finishSignIn();
    } else {
      setError("Unable to complete sign in. Please try again.");
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    const { error } = await signIn.mfa.sendEmailCode();
    if (error) setError(clerkErrorMessage(error));
  };

  const startOver = async () => {
    await signIn.reset();
    setCode("");
    setError("");
    setStep("credentials");
  };

  return (
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
        {isSignedIn ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: font.display, fontSize: 18, fontWeight: 600, color: "#FFFFFF", margin: 0, marginBottom: 4 }}>
              You&apos;re signed in
            </p>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>
              Taking you to your dashboard...
            </p>
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/login" })}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginTop: 20,
                color: "#A5B4FC",
                fontFamily: font.body,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Use a different account
            </button>
          </div>
        ) : (
        <>
        {/* Header */}
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
          <p
            style={{
              fontFamily: font.body,
              fontSize: 14,
              color: "#737373",
              margin: 0,
            }}
          >
            {step === "credentials"
              ? "Sign in to your account"
              : `Enter the code we sent to ${email}`}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={step === "credentials" ? handleSubmit : handleVerify}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {step === "credentials" ? (
            <>
              {/* Email */}
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={labelStyle}>VERIFICATION CODE</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                style={inputStyle}
                {...focusHandlers}
              />
            </div>
          )}

          {/* Error */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.4 : 1,
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#777AF5";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#6366F1";
            }}
          >
            {step === "credentials"
              ? loading ? "Signing in..." : "Sign in"
              : loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* Footer */}
        {step === "credentials" ? (
          <p
            style={{
              textAlign: "center",
              fontFamily: font.body,
              fontSize: 13,
              color: "#737373",
              margin: 0,
              marginTop: 24,
            }}
          >
            Don&apos;t have an account? You need an invite.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: font.body,
              fontSize: 13,
              marginTop: 24,
            }}
          >
            <button type="button" onClick={resendCode} style={linkButtonStyle}>
              Resend code
            </button>
            <button type="button" onClick={startOver} style={linkButtonStyle}>
              Start over
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#6366F1",
  fontFamily: font.body,
  fontSize: 13,
  cursor: "pointer",
};
