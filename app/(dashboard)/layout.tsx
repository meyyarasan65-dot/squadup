import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { NotificationListener } from "@/components/real-time/NotificationListener";
import { countIncomingInvites } from "@/lib/queries";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (!session.profile) redirect("/login?error=oauth_exchange");

  const { profile } = session;
  const pendingInvites = await countIncomingInvites(profile.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        user={{
          name: profile.full_name,
          avatarUrl: profile.avatar_url,
          githubUsername: profile.github_username,
        }}
        pendingInvites={pendingInvites}
      />
      <NotificationListener userId={profile.id} />
      <main className="container flex-1 py-6 sm:py-10">{children}</main>
    </div>
  );
}
