import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Card className="w-full glass-strong shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">Welcome back</CardTitle>
        <CardDescription>Log in as a student or mentor.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
