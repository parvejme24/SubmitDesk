import { redirect } from "next/navigation";

// proxy.ts sends logged-in users to their dashboard; anyone reaching this goes to login.
export default function Home() {
  redirect("/login");
}
