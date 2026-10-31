"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfileAction } from "@/app/actions/profile";
import { PulseDot } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  Input,
  Label,
  Switch,
  Textarea,
} from "@/components/ui/form-controls";
import { ROLE_LABELS, ROLE_STYLES, ROLES } from "@/lib/constants";
import { profileFormSchema, type ProfileFormValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile.full_name,
      college: profile.college,
      bio: profile.bio ?? "",
      primary_role: profile.primary_role,
      is_looking_for_team: profile.is_looking_for_team,
    },
  });

  const bioValue = form.watch("bio");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated successfully", {
        description: "Your preferences and availability are active.",
      });
      router.refresh();
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-7"
      noValidate
    >
      <div className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
        <h2 className="text-base font-semibold text-white">Your Developer Profile</h2>
        <p className="text-xs text-zinc-400">
          This information is shown to team leaders and potential teammates across hackathons.
        </p>
      </div>

      {!profile.onboarded && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-300">
          <Sparkles className="h-5 w-5 shrink-0 text-indigo-400" />
          <span>
            Please select your <strong>Primary Role</strong> and save your profile to finish onboarding.
          </span>
        </div>
      )}

      {/* Name & College */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="Ada Lovelace"
            aria-invalid={!!form.formState.errors.full_name}
            {...form.register("full_name")}
          />
          <FieldError message={form.formState.errors.full_name?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="college">College / University</Label>
          <Input
            id="college"
            placeholder="Knowledge Institute of Technology"
            aria-invalid={!!form.formState.errors.college}
            {...form.register("college")}
          />
          <FieldError message={form.formState.errors.college?.message} />
        </div>
      </div>

      {/* Primary Role Selector */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <Label>Primary Role</Label>
          <span className="text-xs text-zinc-500">Core discipline for match scoring (45%)</span>
        </div>

        <Controller
          control={form.control}
          name="primary_role"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ROLES.map((role) => {
                const isSelected = field.value === role;
                const style = ROLE_STYLES[role];

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => field.onChange(role)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition-all",
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500"
                        : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px]", style)}>
                        {ROLE_LABELS[role]}
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          )}
        />
        <FieldError message={form.formState.errors.primary_role?.message} />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">About You & Hackathon Goals</Label>
          <span
            className={cn(
              "font-mono text-xs",
              (bioValue?.length ?? 0) > 260 ? "text-amber-400" : "text-zinc-500",
            )}
          >
            {bioValue?.length ?? 0} / 280
          </span>
        </div>
        <Textarea
          id="bio"
          rows={3}
          placeholder="Brief intro, what you love building, or what kind of hackathon squad you want to join..."
          aria-invalid={!!form.formState.errors.bio}
          {...form.register("bio")}
        />
        <FieldError message={form.formState.errors.bio?.message} />
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="is_looking_for_team" className="cursor-pointer text-sm font-medium text-white">
            Available for Teams
          </Label>
          <p className="text-xs text-zinc-400">
            Show up in the Matchmaker candidate feed for team leaders looking for members
          </p>
        </div>
        <Controller
          control={form.control}
          name="is_looking_for_team"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              {field.value && <PulseDot />}
              <Switch
                id="is_looking_for_team"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending} className="min-w-32">
          Save Profile
        </Button>
      </div>
    </form>
  );
}

