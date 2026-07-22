-- Seed a test cohort and invite for testing signup flow

INSERT INTO cohorts (id, name, track, starts_at, ends_at, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Cohort 01',
  'design_lab',
  '2025-07-01',
  '2025-09-30',
  'active'
);

INSERT INTO invites (id, code, cohort_id, track, max_uses, use_count, active, expires_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'BDA-DL-2025-TEST',
  '11111111-1111-1111-1111-111111111111',
  'design_lab',
  10,
  0,
  true,
  '2026-12-31'
);
