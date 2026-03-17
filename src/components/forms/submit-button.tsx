"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="disabled:cursor-not-allowed disabled:opacity-70">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
