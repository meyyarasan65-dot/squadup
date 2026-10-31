"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { ChipToggleGroup } from "@/components/shared/ChipToggleGroup";
import { TechStackInput } from "@/components/teams/TechStackInput";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form-controls";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import type { TeamFormValues } from "@/lib/schemas";

interface TeamFormFieldsProps {
  register: UseFormRegister<TeamFormValues>;
  control: Control<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
}

/** Fields shared by the create and edit team forms. */
export function TeamFormFields({ register, control, errors }: TeamFormFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="team_name">Team name</Label>
        <Input
          id="team_name"
          placeholder="Null Pointers"
          aria-invalid={!!errors.team_name}
          {...register("team_name")}
        />
        <FieldError message={errors.team_name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pitch">Pitch</Label>
        <Textarea
          id="pitch"
          placeholder="What are you building, and why will it win?"
          aria-invalid={!!errors.pitch}
          {...register("pitch")}
        />
        <FieldError message={errors.pitch?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Open roles</Label>
        <Controller
          control={control}
          name="target_roles"
          render={({ field }) => (
            <ChipToggleGroup
              ariaLabel="Open roles"
              options={ROLES}
              value={field.value}
              onChange={field.onChange}
              label={(r) => ROLE_LABELS[r]}
            />
          )}
        />
        <FieldError message={errors.target_roles?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Desired tech stack <span className="font-normal text-zinc-500">(type custom or pick recommended)</span>
        </Label>
        <Controller
          control={control}
          name="tech_stack"
          render={({ field }) => (
            <TechStackInput
              value={field.value}
              onChange={field.onChange}
              max={15}
            />
          )}
        />
        <FieldError message={errors.tech_stack?.message} />
      </div>
    </>
  );
}
