-- 0021_drop_image_map.sql
-- E-005 / T-043 (Phase C).
--
-- `image_map` was an ad-hoc, UNTRACKED table (no prior migration declared it)
-- used purely as a cache for the image-orphan scanner: it mapped a note's
-- committed-file SHA to the image paths that note referenced, so the scanner
-- could skip re-fetching unchanged .md from GitHub.
--
-- With note content now in `notes.content_md` (migration 0020), the scanner
-- reads references directly from the DB (useImageCleanup.js) — cheap, always
-- current, and immune to the SHA-drift that made it flag every live image as
-- orphaned (T-002). The cache is obsolete and nothing references it, so drop
-- it. This also removes the untracked-schema drift risk (the concern that
-- would otherwise call for "adopting" it into a migration): a dropped table
-- cannot drift.
--
-- Safe: the table held only derived cache data, regenerable by a scan.

drop table if exists public.image_map;
