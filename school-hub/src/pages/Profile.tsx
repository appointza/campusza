import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userService, type UserLoginRes } from "@/services/user.service";
import type { UserRole } from "@/config/navigation";
import { Eye, EyeOff } from "lucide-react";

function readStoredUser(): UserLoginRes | null {
  const raw = localStorage.getItem("campusza_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserLoginRes;
  } catch {
    return null;
  }
}

function layoutRoleFromUser(u: UserLoginRes | null): UserRole {
  const r = (u?.role || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "admin_staff") return "admin_staff";
  if (r === "staff") return "staff";
  if (r === "student") return "student";
  if (r === "parent") return "parent";
  return "staff";
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<UserLoginRes | null>(() => readStoredUser());
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = readStoredUser();
    if (!u?.userId) {
      navigate("/signin");
      return;
    }
    setSession(u);
    setEmail(u.email || "");
  }, [navigate]);

  const role = layoutRoleFromUser(session);
  const displayName = session?.email?.split("@")[0] || "User";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.userId) return;

    if (!currentPassword.trim()) {
      toast({
        title: "Current password required",
        description: "Enter your current password to save changes.",
        variant: "destructive",
      });
      return;
    }

    const emailChanged = email.trim().toLowerCase() !== (session.email || "").toLowerCase();
    const wantsPassword = newPassword.length > 0 || confirmPassword.length > 0;

    if (!emailChanged && !wantsPassword) {
      toast({
        title: "Nothing to update",
        description: "Change your email or enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (wantsPassword) {
      if (newPassword.length < 6) {
        toast({
          title: "Password too short",
          description: "New password must be at least 6 characters.",
          variant: "destructive",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "Confirm the new password.",
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        userId: session.userId,
        currentPassword,
        newEmail: emailChanged ? email.trim() : undefined,
        newPassword: wantsPassword ? newPassword : undefined,
      });

      localStorage.setItem("campusza_user", JSON.stringify(updated));
      setSession(updated);
      setEmail(updated.email || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Profile updated",
        description: "Your account details have been saved.",
      });
    } catch (error: unknown) {
      let message = "Could not update profile.";
      const err = error as { response?: { data?: unknown } };
      const data = err?.response?.data;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data) as { message?: string };
          message = parsed?.message || message;
        } catch {
          message = data || message;
        }
      } else if (data && typeof data === "object" && "message" in data) {
        message = String((data as { message?: string }).message || message);
      }
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout role={role} userName={displayName}>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Update your email and password</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Account</CardTitle>
            <CardDescription>
              {session.organizationName ? (
                <>
                  {session.organizationName}
                  {session.organizationSlug ? ` · ${session.organizationSlug}` : ""}
                </>
              ) : (
                "Signed-in account"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-current-password">Current password</Label>
                <div className="relative">
                  <Input
                    id="profile-current-password"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Required to confirm any change.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="profile-new-password">New password (optional)</Label>
                <div className="relative">
                  <Input
                    id="profile-new-password"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-confirm-password">Confirm new password</Label>
                <Input
                  id="profile-confirm-password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11"
                />
              </div>

              <Button type="submit" variant="hero" className="w-full h-11" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
