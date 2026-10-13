"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Award, ExternalLink } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { roleLabel, type Me } from "@/lib/access";
import { useLearnerTrack } from "@/lib/use-learner-track";
import { uploadToConvex } from "@/lib/upload";
import {
  Avatar,
  Toast,
  cardStyle,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  smallButtonStyle,
  ghostButtonStyle,
  useToast,
  type ShowToast,
} from "@/components/admin/ui";
import { LoadingLine, PageMessage, ProgressBar, TrackChips, font, monoLabelStyle } from "@/components/learn/ui";
import { MissionStatusIndicator, shortDate } from "@/components/learn/missions";
import { AVATAR_TYPES, MAX_AVATAR_BYTES, PROFILE_LIMITS } from "@/convex/lib/profile";

type LearnerTrack = Me["tracks"][number];

const rowLabelStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary)",
};

const rowValueStyle: React.CSSProperties = {
  fontFamily: font.body,
  fontSize: 13,
  color: "var(--color-text-primary)",
  textAlign: "right",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

function monthYear(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function cohortStatus(track: LearnerTrack | null): { label: string; color: string } | null {
  if (!track?.cohort) return null;
  if (track.isAlumni) return { label: "Alumni", color: "#A5B4FC" };
  if (track.cohort.startsAt > Date.now()) return { label: `Starts ${shortDate(track.cohort.startsAt)}`, color: "#FBBF24" };
  return { label: "Active", color: "#22C55E" };
}

export default function ProfilePage() {
  const { loading, me, tracks, track, selectTrack } = useLearnerTrack();
  const { toast, showToast } = useToast();

  if (loading) {
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", paddingTop: 32 }}>
        <LoadingLine>Loading your profile…</LoadingLine>
      </div>
    );
  }
  if (!me) {
    return <PageMessage title="We couldn't load your profile" body="Refresh the page to try again." />;
  }

  const isLearner = track !== null && (track.isStudent || track.isAlumni);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", paddingBottom: 48 }}>
        <header style={{ marginTop: 32, marginBottom: 32 }}>
          <p style={{ ...monoLabelStyle, margin: "0 0 8px" }}>Dashboard · Profile</p>
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
            My profile
          </h1>
        </header>

        <TrackChips tracks={tracks} selectedId={track?.trackId ?? ""} onSelect={selectTrack} />

        <div
          className="profile-grid"
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}
        >
          <IdentityCard me={me} track={track} showToast={showToast} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <AboutCard me={me} showToast={showToast} />
            <CertificatesCard />
            {isLearner && track && <ProgressCard track={track} />}
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </>
  );
}

function IdentityCard({ me, track, showToast }: { me: Me; track: LearnerTrack | null; showToast: ShowToast }) {
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.users.setAvatar);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const status = cohortStatus(track);

  async function handleFile(file: File) {
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      showToast("Use a PNG, JPG or WebP image", "error");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast("Photos must be 2 MB or smaller", "error");
      return;
    }
    setUploading(true);
    try {
      const url = await generateUploadUrl({});
      const fileId = await uploadToConvex(url, file);
      const result = await setAvatar({ fileId });
      if (result.ok) showToast("Photo updated");
      else showToast(result.error, "error");
    } catch (err) {
      showToast(err instanceof Error && err.message === "Upload failed" ? "The upload failed. Try again." : errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      await setAvatar({ fileId: null });
      showToast("Photo removed");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  const rows: { label: string; value: string; color?: string }[] = [];
  if (track) rows.push({ label: "Track", value: track.name });
  if (track?.cohort) rows.push({ label: "Cohort", value: track.cohort.name });
  if (status) rows.push({ label: "Status", value: status.label, color: status.color });
  rows.push({ label: "Joined", value: monthYear(me.user._creationTime) });

  return (
    <section
      aria-label="Your details"
      style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
    >
      <Avatar name={me.user.fullName} src={me.avatarUrl} size={88} />
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button
          type="button"
          style={{ ...smallButtonStyle, opacity: uploading ? 0.6 : 1 }}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Saving…" : me.avatarUrl ? "Change photo" : "Add photo"}
        </button>
        {me.avatarUrl && (
          <button type="button" style={ghostButtonStyle} disabled={uploading} onClick={removePhoto}>
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_TYPES.join(",")}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      <p style={{ fontFamily: font.display, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", margin: "16px 0 4px" }}>
        {me.user.fullName}
      </p>
      <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: "0 0 10px", wordBreak: "break-all" }}>
        {me.user.email}
      </p>
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          backgroundColor: "var(--color-bg-surface-3)",
          border: "1px solid var(--color-border-strong)",
          color: "var(--color-text-secondary)",
          padding: "3px 10px",
          borderRadius: 999,
        }}
      >
        {roleLabel(me)}
      </span>

      <div style={{ width: "100%", height: 1, backgroundColor: "var(--color-border-subtle)", margin: "20px 0 16px" }} />

      <dl style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", margin: 0 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <dt style={rowLabelStyle}>{row.label}</dt>
            <dd style={{ ...rowValueStyle, margin: 0, color: row.color ?? rowValueStyle.color }}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AboutCard({ me, showToast }: { me: Me; showToast: ShowToast }) {
  const updateProfile = useMutation(api.users.updateProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [showInShowcase, setShowInShowcase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLearner = me.tracks.some((t) => t.isStudent || t.isAlumni);
  const showcaseOn = me.user.showInShowcase !== false;

  function startEditing() {
    setFullName(me.user.fullName);
    setBio(me.user.bio ?? "");
    setPortfolioUrl(me.user.portfolioUrl ?? "");
    setShowInShowcase(showcaseOn);
    setError(null);
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ fullName, bio, portfolioUrl, showInShowcase });
      setEditing(false);
      showToast("Profile updated");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="about-heading" style={{ ...cardStyle, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 id="about-heading" style={{ ...monoLabelStyle, margin: 0 }}>
          About
        </h2>
        {!editing && (
          <button type="button" style={smallButtonStyle} onClick={startEditing}>
            Edit profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="profile-name" style={fieldLabelStyle}>
              Name
            </label>
            <input
              id="profile-name"
              value={fullName}
              maxLength={PROFILE_LIMITS.fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={controlStyle}
              {...focusHandlers}
            />
          </div>
          <div>
            <label htmlFor="profile-bio" style={fieldLabelStyle}>
              Bio
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              maxLength={PROFILE_LIMITS.bio}
              rows={4}
              placeholder="A few lines about you and what you're working towards"
              onChange={(e) => setBio(e.target.value)}
              style={{ ...controlStyle, height: "auto", padding: "10px 14px", lineHeight: "22px", resize: "vertical" }}
              {...focusHandlers}
            />
            <p style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", margin: "6px 0 0", textAlign: "right" }}>
              {bio.length}/{PROFILE_LIMITS.bio}
            </p>
          </div>
          <div>
            <label htmlFor="profile-portfolio" style={fieldLabelStyle}>
              Portfolio link
            </label>
            <input
              id="profile-portfolio"
              type="url"
              inputMode="url"
              value={portfolioUrl}
              maxLength={PROFILE_LIMITS.portfolioUrl}
              placeholder="https://"
              onChange={(e) => setPortfolioUrl(e.target.value)}
              style={controlStyle}
              {...focusHandlers}
            />
          </div>
          {isLearner && (
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showInShowcase}
                onChange={(e) => setShowInShowcase(e.target.checked)}
                style={{ marginTop: 3, accentColor: "#6366F1" }}
              />
              <span style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)" }}>
                Show my passed missions in the Community showcase
              </span>
            </label>
          )}
          {error && (
            <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: 0 }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" style={ghostButtonStyle} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...smallButtonStyle,
                backgroundColor: "var(--color-indigo)",
                borderColor: "var(--color-indigo)",
                color: "#fff",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 14,
              lineHeight: "22px",
              color: me.user.bio ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {me.user.bio ?? "No bio yet. Add a few lines so your cohort knows who you are."}
          </p>
          {me.user.portfolioUrl && (
            <a
              href={me.user.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: font.body,
                fontSize: 14,
                color: "#A5B4FC",
                textDecoration: "none",
                wordBreak: "break-all",
              }}
            >
              {me.user.portfolioUrl.replace(/^https?:\/\//, "")}
              <ExternalLink aria-hidden style={{ width: 13, height: 13, flexShrink: 0 }} />
            </a>
          )}
          {isLearner && (
            <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>
              {showcaseOn
                ? "Your passed missions appear in the Community showcase."
                : "Your work is hidden from the Community showcase."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ProgressCard({ track }: { track: LearnerTrack }) {
  const overview = useQuery(api.curriculum.overview, { trackId: track.trackId });
  const missions = useQuery(api.missions.list, { trackId: track.trackId });

  const recent = missions
    ? missions.missions
        .filter((m) => m.submittedAt !== null)
        .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))
        .slice(0, 5)
    : [];

  return (
    <section aria-labelledby="progress-heading" style={{ ...cardStyle, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 id="progress-heading" style={{ ...monoLabelStyle, margin: 0 }}>
          Progress
        </h2>
        <Link href="/learn" style={{ fontFamily: font.body, fontSize: 13, fontWeight: 500, color: "#A5B4FC", textDecoration: "none" }}>
          Open curriculum
        </Link>
      </div>

      {overview === undefined || missions === undefined ? (
        <LoadingLine>Loading progress…</LoadingLine>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <Stat
              label="Modules"
              done={overview.totals.completedModules}
              total={overview.totals.modules}
            />
            <Stat label="Missions" done={missions.stats.done} total={missions.stats.total} />
          </div>

          <h3 style={{ ...monoLabelStyle, margin: "24px 0 10px" }}>Recent work</h3>
          {recent.length === 0 ? (
            <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
              Nothing submitted yet. Your missions will show up here once you hand them in.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recent.map((m, i) => (
                <li key={m._id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)" }}>
                  <Link
                    href={`/missions/${m.slug}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontFamily: font.body,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.title}
                      </span>
                      <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                        {m.submittedAt !== null ? `Submitted ${shortDate(m.submittedAt)}` : ""}
                        {m.version !== null && m.version > 1 ? ` · v${m.version}` : ""}
                      </span>
                    </span>
                    <MissionStatusIndicator status={m.status} reviewType={m.reviewType} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function CertificatesCard() {
  const certificates = useQuery(api.certificates.mine, {});
  if (!certificates || certificates.length === 0) return null;

  return (
    <section aria-labelledby="certificates-heading" style={{ ...cardStyle, padding: 24 }}>
      <h2 id="certificates-heading" style={{ ...monoLabelStyle, margin: "0 0 12px" }}>
        Certificates
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {certificates.map((c, i) => (
          <li key={c._id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)" }}>
            <Link
              href={`/certificates/${c.code}`}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", textDecoration: "none" }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "rgba(99,102,241,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Award aria-hidden style={{ width: 16, height: 16, color: "#A5B4FC" }} />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {c.trackName}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  {[c.cohortName, `Issued ${shortDate(c.issuedAt)}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 500, color: "#A5B4FC" }}>View</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div style={{ padding: 16, borderRadius: 10, backgroundColor: "var(--color-bg-surface-2)", border: "1px solid var(--color-border-subtle)" }}>
      <p style={{ ...monoLabelStyle, margin: 0 }}>{label}</p>
      <p style={{ fontFamily: font.display, fontSize: 24, fontWeight: 600, color: "var(--color-text-primary)", margin: "6px 0 10px" }}>
        {done}
        <span style={{ fontSize: 15, color: "var(--color-text-tertiary)", fontWeight: 500 }}> / {total}</span>
      </p>
      <ProgressBar value={total === 0 ? 0 : done / total} label={`${label} complete`} />
    </div>
  );
}
