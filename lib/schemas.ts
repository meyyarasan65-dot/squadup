import { z } from "zod";
import { ROLES } from "@/lib/constants";

// ----------------------------------------------------------------------------
// JSONB column shapes. Parsed at the DB boundary so the rest of the app only
// ever sees well-formed values.
// ----------------------------------------------------------------------------

export const verifiedSkillsSchema = z
  .record(z.string(), z.number().min(0).max(100))
  .catch({});

const topRepoSchema = z.object({
  name: z.string(),
  url: z.string(),
  stars: z.number().int().nonnegative().catch(0),
  language: z.string().nullable().catch(null),
});

export const githubStatsSchema = z
  .object({
    public_repos: z.number().int().nonnegative().catch(0),
    followers: z.number().int().nonnegative().catch(0),
    total_stars: z.number().int().nonnegative().catch(0),
    total_commits: z.number().int().nonnegative().nullable().catch(null),
    repos_analyzed: z.number().int().nonnegative().catch(0),
    top_repos: z.array(topRepoSchema).catch([]),
    synced_at: z.string().nullable().catch(null),
    source: z.enum(["oauth", "public", "seed"]).nullable().catch(null),
    partial: z.boolean().catch(false),
  })
  .partial()
  .transform((v) => ({
    public_repos: v.public_repos ?? 0,
    followers: v.followers ?? 0,
    total_stars: v.total_stars ?? 0,
    total_commits: v.total_commits ?? null,
    repos_analyzed: v.repos_analyzed ?? 0,
    top_repos: v.top_repos ?? [],
    synced_at: v.synced_at ?? null,
    source: v.source ?? null,
    partial: v.partial ?? false,
  }))
  .catch({
    public_repos: 0,
    followers: 0,
    total_stars: 0,
    total_commits: null,
    repos_analyzed: 0,
    top_repos: [],
    synced_at: null,
    source: null,
    partial: false,
  });

export const roleSchema = z.enum(ROLES);
export const hackerPaceSchema = z.enum(["all_nighter", "structured_day"]).catch("all_nighter");

export const verifiedFrameworkSchema = z.object({
  name: z.string(),
  category: z.enum([
    "Database/ORM",
    "Realtime Systems",
    "AI / ML",
    "Modern Frontend",
    "Cloud & DevOps",
    "Other",
  ]),
  weight: z.number(),
});

export const leetCodeStatsSchema = z
  .object({
    ranking: z.number().nullable().optional(),
    totalSolved: z.number().int().optional(),
    easySolved: z.number().int().optional(),
    mediumSolved: z.number().int().optional(),
    hardSolved: z.number().int().optional(),
  })
  .catch({});

export const sponsorTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  prize: z.string().optional(),
});

export const projectPitchSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      elevatorPitch: z.string(),
      sponsorAlignment: z.string(),
      technicalArchitecture: z.string(),
      roleAssignments: z.record(z.string(), z.string()),
      noveltyScore: z.number().min(1).max(10),
    }),
  ).length(3),
});

export const radarQuerySchema = z.object({
  event_id: z.string().uuid().optional(),
  missing_role: roleSchema.optional(),
  radius_minutes: z.coerce.number().int().positive().default(120),
});

// ----------------------------------------------------------------------------
// Server Action inputs
// ----------------------------------------------------------------------------

const uuid = z.string().uuid();

export const sendInviteSchema = z.object({
  teamId: uuid,
  userId: uuid,
  direction: z.enum(["team_to_user", "user_to_team"]),
});

export const respondToInviteSchema = z.object({
  inviteId: uuid,
  accept: z.boolean(),
});

export const inviteIdSchema = z.object({ inviteId: uuid });

export const profileFormSchema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(80),
  college: z.string().trim().min(2, "College is required").max(120),
  bio: z.string().trim().max(280, "Keep it under 280 characters"),
  primary_role: roleSchema,
  is_looking_for_team: z.boolean(),
  hacker_pace: hackerPaceSchema.optional().default("all_nighter"),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const availabilitySchema = z.object({ looking: z.boolean() });

const languageName = z.string().trim().min(1).max(40);

export const teamFormSchema = z.object({
  team_name: z.string().trim().min(2, "Team name is too short").max(48),
  pitch: z.string().trim().min(10, "Give people a one-line pitch").max(400),
  target_roles: z.array(roleSchema).min(1, "Pick at least one open role").max(7),
  tech_stack: z.array(languageName).max(15),
  hacker_pace: hackerPaceSchema.optional().default("all_nighter"),
  discord_webhook_url: z.string().trim().url().optional().or(z.literal("")),
  selected_tracks: z.array(z.string()).optional().default([]),
});
export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
    slug: z
      .string()
      .trim()
      .min(3, "Slug must be at least 3 characters")
      .max(60)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase alphanumeric with hyphens (e.g. kit-hack-fest-2026)",
      ),
    organizer: z.string().trim().min(2, "Organizer is required").max(100),
    description: z.string().trim().max(1000).optional().default(""),
    themes: z.array(z.string().trim().min(1)).min(1, "Add at least one theme / track").max(10),
    registration_deadline: z.string().min(1, "Registration deadline is required"),
    event_start: z.string().min(1, "Event start date is required"),
    team_min_size: z.coerce.number().int().min(1, "Minimum team size must be at least 1").default(2),
    team_max_size: z.coerce.number().int().min(1, "Maximum team size must be at least 1").default(4),
  })
  .refine(
    (data) => new Date(data.registration_deadline).getTime() <= new Date(data.event_start).getTime(),
    {
      message: "Registration deadline must be before or on the event start date",
      path: ["registration_deadline"],
    },
  )
  .refine((data) => data.team_max_size >= data.team_min_size, {
    message: "Max team size must be greater than or equal to min team size",
    path: ["team_max_size"],
  });

export type CreateEventValues = z.infer<typeof createEventSchema>;

export const createTeamSchema = teamFormSchema.extend({ event_id: uuid });
export type CreateTeamValues = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = teamFormSchema.extend({
  team_id: uuid,
  is_locked: z.boolean(),
});
export type UpdateTeamValues = z.infer<typeof updateTeamSchema>;

export const teamIdSchema = z.object({ teamId: uuid });

export const removeMemberSchema = z.object({ teamId: uuid, userId: uuid });

export const eventRegistrationSchema = z.object({
  eventId: uuid,
  register: z.boolean(),
});

/** Shape returned by every RPC in 001_init.sql. */
export const rpcResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  team_id: z.string().optional(),
  invite_id: z.string().optional(),
  dissolved: z.boolean().optional(),
});
export type RpcResult = z.infer<typeof rpcResultSchema>;
