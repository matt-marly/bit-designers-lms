"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Award, Bell, Megaphone, MessageSquare, Radio } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { font, monoLabelStyle } from "@/components/learn/ui";
import { errorMessage, smallButtonStyle } from "@/components/admin/ui";
import { useNow } from "@/lib/use-now";
import { relativeTime } from "@/lib/time";

type Notification = FunctionReturnType<typeof api.notifications.list>["page"][number];

const typeIcon: Record<Notification["type"], typeof Bell> = {
  review: MessageSquare,
  workshop: Radio,
  announcement: Megaphone,
  certificate: Award,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { results, status, loadMore } = usePaginatedQuery(api.notifications.list, {}, { initialNumItems: 20 });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const now = useNow(60_000);
  const hasUnread = results.some((n) => !n.read);

  async function open(n: Notification) {
    setError(null);
    try {
      if (!n.read) await markRead({ notificationId: n._id });
      if (n.link) router.push(n.link);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    setError(null);
    try {
      await markAllRead({});
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 0 48px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
        <div>
          <p style={{ ...monoLabelStyle, margin: "0 0 8px" }}>Inbox</p>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 28,
              lineHeight: "34px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Notifications
          </h1>
        </div>
        {hasUnread && (
          <button
            type="button"
            style={{ ...smallButtonStyle, opacity: markingAll ? 0.6 : 1 }}
            disabled={markingAll}
            onClick={handleMarkAll}
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </header>

      {error && (
        <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: "0 0 16px" }}>
          {error}
        </p>
      )}

      {status === "LoadingFirstPage" ? (
        <p role="status" style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>
          Loading notifications…
        </p>
      ) : results.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            borderRadius: 14,
            border: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-bg-surface)",
          }}
        >
          <Bell aria-hidden style={{ width: 28, height: 28, color: "var(--color-text-tertiary)" }} />
          <p style={{ fontFamily: font.body, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", margin: "12px 0 4px" }}>
            You&apos;re all caught up
          </p>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
            Reviews, new sessions and announcements will show up here.
          </p>
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            borderRadius: 14,
            border: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-bg-surface)",
            overflow: "hidden",
          }}
        >
          {results.map((n, i) => {
            const Icon = typeIcon[n.type];
            return (
              <li key={n._id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)" }}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  style={{
                    width: "100%",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "16px 20px",
                    background: n.read ? "transparent" : "rgba(99,102,241,0.05)",
                    border: "none",
                    textAlign: "left",
                    cursor: n.link || !n.read ? "pointer" : "default",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: n.read ? "var(--color-bg-surface-2)" : "rgba(99,102,241,0.14)",
                      color: n.read ? "var(--color-text-tertiary)" : "#A5B4FC",
                    }}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: n.read ? 400 : 600,
                        lineHeight: "20px",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {n.title}
                    </span>
                    {n.body && (
                      <span
                        className="line-clamp-2"
                        style={{
                          display: "block",
                          fontFamily: font.body,
                          fontSize: 13,
                          lineHeight: "20px",
                          color: "var(--color-text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        {n.body}
                      </span>
                    )}
                    <span style={{ display: "block", fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
                      {relativeTime(n.createdAt, now)}
                    </span>
                  </span>
                  {!n.read && (
                    <span
                      aria-label="Unread"
                      style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: "#6366F1", flexShrink: 0, marginTop: 6 }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {status === "CanLoadMore" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button type="button" style={smallButtonStyle} onClick={() => loadMore(20)}>
            Load more
          </button>
        </div>
      )}
      {status === "LoadingMore" && (
        <p role="status" style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 16 }}>
          Loading…
        </p>
      )}
    </div>
  );
}
