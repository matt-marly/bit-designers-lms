"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.inviteCode as string;

  const [status, setStatus] = useState<"validating" | "invalid" | "valid">("validating");
  const [inviteData, setInviteData] = useState<{ track: string; cohort: string; inviteId: string; cohortId: string; trackRaw: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const res = await fetch('/api/invites/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: params.inviteCode })
        })
        const data = await res.json()

        if (!data.valid) {
          setStatus('invalid')
          return
        }

        setInviteData({
          track: data.track === 'design_lab' ? 'Design Lab' : 'Open Source Lab',
          cohort: data.cohortName,
          inviteId: data.inviteId,
          cohortId: data.cohortId,
          trackRaw: data.track
        })
        setStatus('valid')
      } catch {
        setStatus('invalid')
      }
    }
    validateInvite()
  }, [params.inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          track: inviteData?.trackRaw,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Update profile with track
      await supabase
        .from('profiles')
        .update({ track: inviteData?.trackRaw })
        .eq('id', authData.user.id)

      // Create enrollment
      await supabase.from('enrollments').insert({
        user_id: authData.user.id,
        cohort_id: inviteData?.cohortId,
        role_in_cohort: 'learner'
      })

      // Increment invite use count via API
      await fetch('/api/invites/validate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: inviteData?.inviteId })
      })
    }

    router.push('/home')
  };

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
          {/* State A — Validating */}
          {status === "validating" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  color: "#737373",
                  margin: 0,
                  marginTop: 12,
                }}
              >
                Validating invite...
              </p>
            </div>
          )}

          {/* State B — Invalid */}
          {status === "invalid" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <XCircle
                style={{ width: 32, height: 32, color: "#EF4444", marginBottom: 12 }}
                aria-hidden="true"
              />
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
                Invalid invite link
              </h2>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  color: "#737373",
                  margin: 0,
                }}
              >
                This invite link is invalid, expired, or has already been used.
              </p>
              <button
                onClick={() => router.push("/login")}
                style={{
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
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#333333";
                }}
              >
                Back to login
              </button>
            </div>
          )}

          {/* State C — Valid (signup form) */}
          {status === "valid" && (
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
                  Create your account
                </p>
                {inviteData && (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 12,
                      backgroundColor: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.35)",
                      color: "#A5B4FC",
                      fontFamily: font.mono,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "4px 12px",
                      borderRadius: 999,
                    }}
                  >
                    {inviteData.track} · {inviteData.cohort}
                  </span>
                )}
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Full name */}
                <div>
                  <label
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "#B5B5B5",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Amara Okonkwo"
                    required
                    style={{
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
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#333333";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "#B5B5B5",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
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
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#333333";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "#B5B5B5",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    style={{
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
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#333333";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

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
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              {/* Footer */}
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
                Already have an account?{" "}
                <Link
                  href="/login"
                  style={{
                    color: "#6366F1",
                    textDecoration: "none",
                    transition: "color 120ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#777AF5")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6366F1")}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
