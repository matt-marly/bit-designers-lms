"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
};

type Blocked = "no_access" | "suspended";

/**
 * Links the signed-in Clerk account to a Convex user (accepting a pending
 * invitation on first sign-in) and blocks the app for accounts without access.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const ensureCurrent = useMutation(api.users.ensureCurrent);
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const [blocked, setBlocked] = useState<{ userId: string; reason: Blocked } | null>(null);
  const linkedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId || linkedFor.current === userId) return;
    linkedFor.current = userId;
    ensureCurrent({})
      .then((result) => {
        setBlocked(result === "ok" ? null : { userId, reason: result });
      })
      .catch(() => {
        linkedFor.current = null;
      });
  }, [isAuthenticated, userId, ensureCurrent]);

  let reason: Blocked | null = blocked !== null && blocked.userId === userId ? blocked.reason : null;
  if (me) {
    reason = me.user.status === "suspended" ? "suspended" : null;
  }

  if (reason !== null) {
    return <NoAccess reason={reason} />;
  }
  return <>{children}</>;
}

function NoAccess({ reason }: { reason: Blocked }) {
  const { signOut } = useClerk();

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
          textAlign: "center",
        }}
      >
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
          {reason === "suspended" ? "Account suspended" : "No access yet"}
        </h2>
        <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>
          {reason === "suspended"
            ? "Your account has been suspended. Contact an admin if you think this is a mistake."
            : "BitDesigners Africa is invite-only, and we couldn't find an invitation for this email address. Ask an admin to invite you."}
        </p>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/login" })}
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
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
