"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Plus, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createEventAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form-controls";
import { createEventSchema, type CreateEventValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const RECOMMENDED_THEMES = [
  "AI & ML",
  "Open Innovation",
  "Web3",
  "HealthTech",
  "FinTech",
  "EdTech",
  "Cybersecurity",
  "Smart Automation",
  "Sustainability",
  "Cloud & DevOps",
  "Mobile Apps",
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateEventDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [customTheme, setCustomTheme] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      slug: "",
      organizer: "",
      description: "",
      themes: ["Open Innovation"],
      registration_deadline: "",
      event_start: "",
      team_min_size: 2,
      team_max_size: 4,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = form;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle, { shouldValidate: true });
    if (!isSlugManuallyEdited) {
      setValue("slug", slugify(newTitle), { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createEventAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${values.title}" is now live!`, {
        description: "Teams and students can now register and recruit.",
      });
      setOpen(false);
      reset();
      setIsSlugManuallyEdited(false);
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
          <Plus className="h-4 w-4" />
          <span>Add Hackathon</span>
          <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-indigo-700/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
            <ShieldCheck className="h-3 w-3" /> Admin
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Admin Portal</span>
          </div>
          <DialogTitle>Host a New Hackathon</DialogTitle>
          <DialogDescription>
            Publish a campus or national hackathon. Students can immediately register and form teams.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="event_title">Hackathon Title</Label>
            <Input
              id="event_title"
              placeholder="e.g. KIT Hack Fest 2026"
              aria-invalid={!!errors.title}
              {...register("title", { onChange: handleTitleChange })}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Slug & Organizer */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="event_slug">URL Slug</Label>
                <span className="text-[11px] text-zinc-500">Lowercase & hyphens</span>
              </div>
              <Input
                id="event_slug"
                placeholder="kit-hack-fest-2026"
                aria-invalid={!!errors.slug}
                {...register("slug", {
                  onChange: () => setIsSlugManuallyEdited(true),
                })}
              />
              <FieldError message={errors.slug?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="event_organizer">Organizer / Club</Label>
              <Input
                id="event_organizer"
                placeholder="e.g. Developer Student Club, KIT"
                aria-invalid={!!errors.organizer}
                {...register("organizer")}
              />
              <FieldError message={errors.organizer?.message} />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="event_description">Description / Brief</Label>
            <Textarea
              id="event_description"
              placeholder="What will participants build? Any special rules, eligibility, or prizes?"
              rows={3}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Themes / Tracks */}
          <div className="flex flex-col gap-2">
            <Label>Hackathon Themes / Tracks</Label>
            <Controller
              control={control}
              name="themes"
              render={({ field }) => {
                const themes = field.value || [];
                const addTheme = (theme: string) => {
                  const trimmed = theme.trim();
                  if (!trimmed || themes.includes(trimmed)) return;
                  field.onChange([...themes, trimmed]);
                };
                const removeTheme = (themeToRemove: string) => {
                  field.onChange(themes.filter((t) => t !== themeToRemove));
                };
                const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTheme(customTheme);
                    setCustomTheme("");
                  }
                };

                return (
                  <div className="flex flex-col gap-2.5">
                    {/* Active theme tags */}
                    {themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                        {themes.map((theme) => (
                          <span
                            key={theme}
                            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-200"
                          >
                            {theme}
                            <button
                              type="button"
                              onClick={() => removeTheme(theme)}
                              className="rounded p-0.5 text-indigo-300 hover:text-white"
                              title={`Remove ${theme}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Custom input */}
                    <div className="flex gap-2">
                      <Input
                        value={customTheme}
                        onChange={(e) => setCustomTheme(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type custom track & press Enter (e.g. Clean Energy, LLMs)..."
                        className="h-9 text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          addTheme(customTheme);
                          setCustomTheme("");
                        }}
                        disabled={!customTheme.trim()}
                        className="h-9 shrink-0 gap-1 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Track
                      </Button>
                    </div>

                    {/* Recommendations */}
                    <div className="flex flex-wrap gap-1.5">
                      {RECOMMENDED_THEMES.map((opt) => {
                        const isSelected = themes.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (isSelected) removeTheme(opt);
                              else addTheme(opt);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              isSelected
                                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            <FieldError message={errors.themes?.message} />
          </div>

          {/* Dates: Registration Deadline & Event Start */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="datetime-local"
                aria-invalid={!!errors.registration_deadline}
                {...register("registration_deadline")}
                className="[color-scheme:dark]"
              />
              <FieldError message={errors.registration_deadline?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="event_start">Event Starts</Label>
              <Input
                id="event_start"
                type="datetime-local"
                aria-invalid={!!errors.event_start}
                {...register("event_start")}
                className="[color-scheme:dark]"
              />
              <FieldError message={errors.event_start?.message} />
            </div>
          </div>

          {/* Team Min & Max Sizes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="team_min_size">Min Team Size</Label>
              <Input
                id="team_min_size"
                type="number"
                min={1}
                max={10}
                aria-invalid={!!errors.team_min_size}
                {...register("team_min_size")}
              />
              <FieldError message={errors.team_min_size?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="team_max_size">Max Team Size</Label>
              <Input
                id="team_max_size"
                type="number"
                min={1}
                max={10}
                aria-invalid={!!errors.team_max_size}
                {...register("team_max_size")}
              />
              <FieldError message={errors.team_max_size?.message} />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Hackathon"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

