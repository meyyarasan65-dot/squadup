"use client";

import { useFormStatus } from "react-dom";
import { signInWithGithubAction } from "@/app/actions/auth";
import { GithubIcon } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full bg-white text-zinc-950 shadow-none hover:bg-zinc-200" loading={pending}>
      {!pending && <GithubIcon />}
      {pending ? "Redirecting to GitHub…" : "Continue with GitHub"}
    </Button>
  );
}

export function LoginButton({ next }: { next: string }) {
  return (
    <form action={signInWithGithubAction}>
      <input type="hidden" name="next" value={next} />
      <SubmitButton />
    </form>
  );
}
