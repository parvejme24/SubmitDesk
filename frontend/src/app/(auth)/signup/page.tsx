import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Student sign up" };

export default function SignupPage() {
  return (
    <Card className="w-full glass-strong shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">Create a student account</CardTitle>
        <CardDescription>Submit your projects and get mentor feedback.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
