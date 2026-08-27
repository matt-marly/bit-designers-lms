"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { Markdown } from "@/components/markdown";
import { getModuleNavigation } from "@/lib/mock-learn-data";
import type { LoadedModuleContent } from "@/lib/content";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

export function LessonDocClient({
  content,
}: {
  content: LoadedModuleContent | null;
}) {
  const params = useParams();
  const slug = params.moduleSlug as string;
  const nav = getModuleNavigation(slug);
  const mod = nav.current;

  const readingMinutes = content ? content.meta.lesson.readingMinutes : 12;
  const lessonFooter = content ? "Lesson 01 of 01" : "Lesson 02 of 04";

  const [isComplete, setIsComplete] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  function handleMarkComplete() {
    setIsComplete(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowCheck(true);
      });
    });
  }

  if (!mod) {
    return (
      <div style={{ padding: 48 }}>
        <p style={{ fontFamily: font.body, fontSize: "14.5px", color: "var(--color-text-secondary)" }}>
          Module not found.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── STICKY TOP BAR ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "var(--color-bg-base)",
          borderBottom: "1px solid var(--color-border-subtle)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "0 -32px",
          paddingLeft: 32,
          paddingRight: 32,
        }}
        className="doc-top-bar"
      >
        <Link
          href={`/learn/${slug}`}
          style={{
            fontFamily: font.body,
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 400,
            color: "var(--color-text-tertiary)",
            textDecoration: "none",
            transitionProperty: "color",
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--ease-out-quart)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
        >
          &larr; Back to Lesson
        </Link>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
          }}
        >
          Module {mod.moduleNumber} · {mod.title}
        </span>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
          }}
        >
          {readingMinutes} Min Read
        </span>
      </div>

      {/* ── LESSON CONTENT ── */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          paddingTop: 48,
        }}
        className="doc-content"
      >
        {/* Lesson header */}
        <SectionLabel>Module Lesson</SectionLabel>
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 32,
            lineHeight: "38px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
            marginTop: 16,
          }}
        >
          {mod.title}
        </h1>
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 10,
          }}
        >
          Unit {mod.unitNumber} · Module {mod.moduleNumber} · {mod.track} · {readingMinutes} Min Read
        </p>
        <div
          style={{
            height: 1,
            backgroundColor: "var(--color-border-subtle)",
            marginTop: 32,
            marginBottom: 40,
          }}
        />

        {/* Body content */}
        <article style={{ maxWidth: "68ch" }}>
          {content ? (
            <Markdown>{content.lessonMd}</Markdown>
          ) : (
            <>
          {/* Intro */}
          <p
            style={{
              fontFamily: font.body,
              fontSize: 16,
              lineHeight: "28px",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            When we talk about Bitcoin as a design medium, we are asking a fundamental question: what
            does it mean to design for a protocol instead of a platform? Unlike traditional fintech
            where a company controls the experience end-to-end, Bitcoin is an open, permissionless
            network. Every wallet, every exchange, every Lightning app is a different interpretation
            of the same underlying system.
          </p>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            This freedom is both the challenge and the opportunity. There is no single design system
            imposed by a platform owner. No human-interface guidelines from Bitcoin Inc. The
            community itself has to develop shared patterns, test them with real users, and iterate
            publicly. As a designer entering this space, you are not just building products — you are
            shaping the UX layer of a global financial protocol.
          </p>

          {/* H2: Why Bitcoin Changes Everything */}
          <h2
            style={{
              fontFamily: font.display,
              fontSize: 20,
              lineHeight: "26px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 48,
              marginBottom: 16,
            }}
          >
            Why Bitcoin Changes Everything for Designers
          </h2>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            In conventional product design, you can rely on backend systems to catch mistakes. A bank
            can reverse a fraudulent transaction. A payment processor can issue a refund. Bitcoin
            offers no such safety net. Transactions are irreversible by design. Private keys, once
            lost, cannot be recovered. This means every interface decision carries real, permanent
            consequences for users.
          </p>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            This is not a limitation — it is a design constraint that, when embraced, produces better
            interfaces. Constraints force clarity. When you cannot undo a mistake, you design
            confirmation flows that actually work. When there is no customer support to call, you
            build self-service tools that genuinely empower users. Bitcoin&apos;s constraints push
            designers toward higher standards of craft.
          </p>

          {/* Callout block */}
          <div
            style={{
              backgroundColor: "var(--color-bg-surface-2)",
              borderLeft: "3px solid var(--color-indigo)",
              borderRadius: "0 8px 8px 0",
              padding: "16px 20px",
              margin: "28px 0",
            }}
          >
            <SectionLabel color="var(--color-indigo-text)">Key Insight</SectionLabel>
            <p
              style={{
                fontFamily: font.body,
                fontSize: "14.5px",
                lineHeight: "22px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: 0,
                marginTop: 8,
              }}
            >
              Bitcoin&apos;s constraints — irreversibility, self-custody, no central authority — are
              not obstacles to good design. They are the forcing functions that produce more honest,
              more empowering, and ultimately more trustworthy user experiences. The best Bitcoin
              designers treat these constraints as creative fuel, not limitations to work around.
            </p>
          </div>

          {/* H2: Understanding the UTXO Model */}
          <h2
            style={{
              fontFamily: font.display,
              fontSize: 20,
              lineHeight: "26px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 48,
              marginBottom: 16,
            }}
          >
            Understanding the UTXO Model
          </h2>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            One of the most important concepts for Bitcoin designers to understand is the UTXO model.
            Unlike account-based systems where you have a single balance, Bitcoin tracks individual
            &ldquo;coins&rdquo; — unspent transaction outputs. Think of it like having a collection
            of bills in a physical wallet rather than a number on a screen. This has profound
            implications for how we present balances, construct transactions, and communicate fees to
            users.
          </p>

          {/* Bitcoin concept block */}
          <div
            style={{
              backgroundColor: "var(--color-bg-surface-2)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 14,
              padding: 20,
              margin: "28px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <SectionLabel color="var(--color-btc-text)">Bitcoin Concept</SectionLabel>
              <StatusPill label="BTC" variant="warning" />
            </div>
            <h3
              style={{
                fontFamily: font.display,
                fontSize: 16,
                lineHeight: "22px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
                marginTop: 12,
              }}
            >
              UTXO — Unspent Transaction Output
            </h3>
            <p
              style={{
                fontFamily: font.body,
                fontSize: "14.5px",
                lineHeight: "22px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: 0,
                marginTop: 8,
              }}
            >
              A UTXO is a discrete chunk of bitcoin that was received in a previous transaction and
              has not yet been spent. When you &ldquo;send&rdquo; bitcoin, you are actually
              consuming one or more UTXOs as inputs and creating new UTXOs as outputs. The
              &ldquo;balance&rdquo; users see is the sum of all their UTXOs — but under the hood,
              there is no single balance field.
            </p>
          </div>

          {/* H2: Designing for Irreversibility */}
          <h2
            style={{
              fontFamily: font.display,
              fontSize: 20,
              lineHeight: "26px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 48,
              marginBottom: 16,
            }}
          >
            Designing for Irreversibility
          </h2>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            Because Bitcoin transactions cannot be reversed, the confirmation flow is arguably the
            most critical UX surface in any Bitcoin application. A well-designed confirmation screen
            prevents costly mistakes. Here is a framework for approaching irreversible transaction
            design.
          </p>

          {/* Step block */}
          <div
            style={{
              margin: "28px 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {[
              {
                num: "01",
                title: "Surface all critical details before confirmation",
                body: "Show the recipient address, amount, fee, and total cost on one screen. Do not hide fees behind a dropdown or require scrolling. Users should see exactly what will happen before they tap confirm.",
              },
              {
                num: "02",
                title: "Use progressive friction for high-value sends",
                body: "For transactions above a user-defined threshold, add an intentional delay or require biometric confirmation. This is not bad UX — it is a security feature that users learn to appreciate after their first near-mistake.",
              },
              {
                num: "03",
                title: "Provide clear, immediate post-send feedback",
                body: "After broadcast, show transaction status with honest language. Say 'Transaction broadcast — waiting for confirmation' instead of 'Sent!' A transaction is not truly final until it has confirmations.",
              },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 13,
                    lineHeight: "22px",
                    fontWeight: 600,
                    color: "var(--color-indigo-text)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {step.num}.
                </span>
                <div>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: "14.5px",
                      lineHeight: "22px",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      lineHeight: "22px",
                      fontWeight: 400,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                      marginTop: 4,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Closing paragraph */}
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginTop: 20,
            }}
          >
            Designing for Bitcoin is designing for a world where users hold real sovereignty over
            their money. That sovereignty comes with responsibility, and your job as a designer is to
            make that responsibility feel manageable, clear, and even empowering. The patterns you
            develop here will not just serve one product — they will contribute to the shared design
            language of the entire Bitcoin ecosystem.
          </p>
            </>
          )}
        </article>

        {/* ── BOTTOM NAV ── */}
        <div
          style={{
            height: 1,
            backgroundColor: "var(--color-border-subtle)",
            marginTop: 64,
          }}
        />
        <div
          style={{
            paddingTop: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <OutlineButton>← Previous Lesson</OutlineButton>
          <PrimaryButton>Next Lesson →</PrimaryButton>
        </div>
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {lessonFooter}
        </p>

        {/* Mark complete */}
        <div style={{ marginTop: 24, marginBottom: 48 }}>
          {!isComplete ? (
            <OutlineButton fullWidth onClick={handleMarkComplete}>
              Mark Lesson Complete
            </OutlineButton>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 0",
              }}
            >
              <CheckCircle
                style={{
                  width: 18,
                  height: 18,
                  color: "var(--color-success-text)",
                  opacity: showCheck ? 1 : 0,
                  transform: showCheck ? "scale(1)" : "scale(0.8)",
                  transition:
                    "opacity 240ms cubic-bezier(0.25, 1, 0.5, 1), transform 240ms cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              />
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "var(--color-success-text)",
                  opacity: showCheck ? 1 : 0,
                  transition: "opacity 240ms cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                Lesson Complete
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
