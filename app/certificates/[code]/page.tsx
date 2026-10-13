"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Check, Download, Link2 } from "lucide-react";
import { api } from "@/convex/_generated/api";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const buttonStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontFamily: font.body,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const printCss = `
@page { size: A4 landscape; margin: 0; }
.certificate-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  html, body { background: #FFFFFF !important; }
  .certificate-toolbar { display: none !important; }
  .certificate-page { padding: 0 !important; min-height: 0 !important; background: #FFFFFF !important; }
  .certificate-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; width: 297mm !important; max-width: none !important; height: 210mm !important; aspect-ratio: auto !important; }
}
`;

function issuedDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function pageUrl() {
  return typeof window === "undefined" ? "" : window.location.href;
}

export default function CertificatePage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const certificate = useQuery(api.certificates.getByCode, code ? { code } : "skip");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (certificate) {
      document.title = `${certificate.fullName} · ${certificate.trackName} certificate · BitDesigners Africa`;
    }
  }, [certificate]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="certificate-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "#090909",
        padding: "32px 20px 64px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style>{printCss}</style>

      <div
        className="certificate-toolbar"
        style={{
          width: "100%",
          maxWidth: 960,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <Link href="/" style={{ fontFamily: font.display, fontSize: 15, fontWeight: 600, color: "#FFFFFF", textDecoration: "none" }}>
          BitDesigners Africa
        </Link>
        {certificate && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={copyLink}
              style={{ ...buttonStyle, backgroundColor: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.16)" }}
            >
              {copied ? <Check style={{ width: 14, height: 14, color: "#4ADE80" }} /> : <Link2 style={{ width: 14, height: 14 }} />}
              {copied ? "Link copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ ...buttonStyle, backgroundColor: "#6366F1", color: "#FFFFFF", border: "1px solid #6366F1" }}
            >
              <Download style={{ width: 14, height: 14 }} />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {certificate === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", marginTop: 80 }}>Loading certificate…</p>
      ) : certificate === null ? (
        <div style={{ textAlign: "center", marginTop: 80, maxWidth: 420 }}>
          <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
            Certificate not found
          </h1>
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "#A3A3A3", margin: "8px 0 0" }}>
            We couldn&apos;t find a certificate with the code <span style={{ fontFamily: font.mono }}>{code}</span>. Check the
            link and try again.
          </p>
        </div>
      ) : (
        <div
          className="certificate-sheet"
          style={{
            width: "100%",
            maxWidth: 960,
            aspectRatio: "297 / 210",
            backgroundColor: "#FCFCFA",
            color: "#111111",
            borderRadius: 14,
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            padding: "clamp(24px, 6%, 64px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{ position: "absolute", inset: "clamp(10px, 1.6%, 18px)", border: "1px solid #D4D4D8", borderRadius: 6, pointerEvents: "none" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, position: "relative" }}>
            <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4F46E5" }}>
              BitDesigners Africa
            </span>
            <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "#71717A" }}>
              {certificate.code}
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <p style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#71717A", margin: 0 }}>
              Certificate of completion
            </p>
            <p style={{ fontFamily: font.body, fontSize: 16, color: "#52525B", margin: "clamp(12px, 3vw, 28px) 0 0" }}>This certifies that</p>
            <h1
              style={{
                fontFamily: font.display,
                fontSize: "clamp(28px, 5.4vw, 56px)",
                lineHeight: 1.05,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#111111",
                margin: "8px 0 0",
              }}
            >
              {certificate.fullName}
            </h1>
            <p style={{ fontFamily: font.body, fontSize: "clamp(14px, 1.8vw, 18px)", lineHeight: 1.5, color: "#3F3F46", margin: "clamp(10px, 2vw, 20px) 0 0", maxWidth: 620 }}>
              has completed every module of the <strong style={{ fontWeight: 600, color: "#111111" }}>{certificate.trackName}</strong> track
              {certificate.cohortName ? ` as part of ${certificate.cohortName}` : ""}, including lessons and mentor-reviewed missions.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
              position: "relative",
              borderTop: "1px solid #E4E4E7",
              paddingTop: 16,
            }}
          >
            <div>
              <p style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A1A1AA", margin: 0 }}>
                Issued
              </p>
              <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "#18181B", margin: "4px 0 0" }}>
                {issuedDate(certificate.issuedAt)}
              </p>
            </div>
            <div style={{ textAlign: "right", minWidth: 0 }}>
              <p style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A1A1AA", margin: 0 }}>
                Verify
              </p>
              <p style={{ fontFamily: font.mono, fontSize: 12, color: "#18181B", margin: "4px 0 0", wordBreak: "break-all" }}>
                {pageUrl().replace(/^https?:\/\//, "")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
