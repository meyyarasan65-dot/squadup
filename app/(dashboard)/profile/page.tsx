import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GithubStatsPanel } from "@/components/profile/GithubStatsPanel";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SyncStatusWatcher } from "@/components/profile/SyncStatusWatcher";
import { PageHeader } from "@/components/shared/PageHeader";
import { getSessionProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile & Verified Skills",
  description: "Manage your hackathon preferences, target role, and GitHub-verified codebase skills.",
};

interface ProfilePageProps {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");
  const me = session.profile;
  const { welcome } = await searchParams;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <PageHeader
        title="Developer Profile & Skills"
        description="Your verified language tags are computed from real code repository byte counts to eliminate skill exaggeration."
      />

      <SyncStatusWatcher
        syncedAt={me.github_stats.synced_at}
        isWelcome={welcome === "1"}
      />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProfileForm profile={me} />
        </div>

        <div className="lg:col-span-5">
          <GithubStatsPanel
            stats={me.github_stats}
            skills={me.verified_skills}
            githubUsername={me.github_username}
          />
        </div>
      </div>
    </div>
  );
}

