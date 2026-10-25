"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useSignup } from "@/hooks/use-auth";
import { ApiError, applyServerErrors } from "@/lib/api";
import { signupSchema, type SignupValues } from "@/schemas/auth";

const fields = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name", placeholder: "Your name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@gmail.com" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    description: "At least 8 characters, with an uppercase letter and a number.",
  },
] as const;

export function SignupForm() {
  const router = useRouter();
  const signup = useSignup();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    signup.mutate(values, {
      onSuccess: () => {
        toast.success("Welcome! Your student account is ready.");
        router.replace("/student");
        router.refresh();
      },
      onError: (e) => {
        if (e instanceof ApiError && applyServerErrors(e, form.setError, ["name", "email", "password"])) return;
        setServerError(e.message);
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <FieldGroup>
        {fields.map((f) => (
          <Controller
            key={f.name}
            name={f.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                {f.type === "password" ? (
                  <PasswordInput
                    {...field}
                    id={f.name}
                    autoComplete={f.autoComplete}
                    aria-invalid={fieldState.invalid}
                  />
                ) : (
                  <Input
                    {...field}
                    id={f.name}
                    type={f.type}
                    autoComplete={f.autoComplete}
                    placeholder={"placeholder" in f ? f.placeholder : undefined}
                    aria-invalid={fieldState.invalid}
                  />
                )}
                {"description" in f && !fieldState.invalid && <FieldDescription>{f.description}</FieldDescription>}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ))}
      </FieldGroup>

      <Button type="submit" className="w-full" size="lg" disabled={signup.isPending}>
        {signup.isPending && <Spinner />}
        {signup.isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
