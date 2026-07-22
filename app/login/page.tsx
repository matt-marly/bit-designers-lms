"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check user role for redirect
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } else {
      router.push('/home');
    }
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
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
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
              placeholder="••••••••"
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
            {loading ? "Signing in..." : "Sign in"}
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
          Don&apos;t have an account? You need an invite.
        </p>
      </div>
    </div>
  );
}
