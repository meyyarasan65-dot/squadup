/** Re-mounts on every dashboard navigation, giving route changes a soft fade-in. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">{children}</div>;
}
