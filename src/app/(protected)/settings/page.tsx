import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyProfileUrl } from "./copy-profile-url";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Profile editing and account export are planned next.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as {session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <p>
              Public profile:{" "}
              <a className="text-primary hover:underline" href={`/u/${session.user.handle}`}>
                /u/{session.user.handle}
              </a>
            </p>
            <CopyProfileUrl handle={session.user.handle!} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
