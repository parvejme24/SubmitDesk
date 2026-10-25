"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCapIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormAlert } from "@/components/shared/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useLogin } from "@/hooks/use-auth";
import { ApiError, applyServerErrors } from "@/lib/api";
import { QUICK_ACCOUNTS } from "@/lib/quick-login";
import { homeFor } from "@/lib/format";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import type { Role } from "@/types";

const roleIcons = { MENTOR: ShieldCheckIcon, STUDENT: GraduationCapIcon } as const;

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [quickRole, setQuickRole] = useState<Role | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const signIn = (values: LoginValues) => {
    setServerError(null);
    login.mutate(values, {
      onSuccess: ({ data }) => {
        router.replace(homeFor(data.user.role));
        router.refresh();
      },
      onError: (e) => {
        setQuickRole(null);
        if (e instanceof ApiError && applyServerErrors(e, form.setError, ["email", "password"])) return;
        setServerError(e.message);
      },
    });
  };

  const onSubmit = form.handleSubmit(signIn);

  const quickLogin = (account: (typeof QUICK_ACCOUNTS)[number]) => {
    setQuickRole(account.role);
    form.clearErrors();
    form.setValue("email", account.email);
    form.setValue("password", account.password);
    signIn({ email: account.email, password: account.password });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
        {login.isPending && !quickRole && <Spinner />}
        {login.isPending && !quickRole ? "Logging in..." : "Log in"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or sign in as
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACCOUNTS.map((account) => {
          const Icon = roleIcons[account.role];
          const loading = login.isPending && quickRole === account.role;
          const role = account.role === "MENTOR" ? "Mentor" : "Student";
          return (
            <motion.div key={account.role} whileTap={{ scale: 0.97 }}>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start gap-2.5 px-3 py-2 text-left"
                onClick={() => quickLogin(account)}
                disabled={login.isPending}
                aria-label={`Sign in as ${account.name}, ${role.toLowerCase()}`}
              >
                {loading ? <Spinner /> : <Icon className="text-primary" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{account.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{role}</span>
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New student?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
