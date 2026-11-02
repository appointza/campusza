import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { authenticationService } from "@/services/authentication.service";

const SetupPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [tokenMessage, setTokenMessage] = useState("");
  const [done, setDone] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = window.setInterval(() => setOtpCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [otpCooldown]);

  const reloadToken = async () => {
    if (!token) {
      setTokenMessage("This setup link is invalid or incomplete.");
      setValidating(false);
      return;
    }
    try {
      const res = await authenticationService.validateToken(token, "initial_setup");
      setTokenValid(res.valid);
      setRequiresOtp(!!res.requiresEmailOtp);
      setEmailVerified(!!res.emailVerified);
      setMaskedEmail(res.email ?? "");
      setTokenMessage(res.message ?? "");
    } catch {
      setTokenValid(false);
      setTokenMessage("This link is invalid or has expired.");
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    reloadToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await authenticationService.sendEmailOtp(token);
      setOtpCooldown(res.cooldownSeconds || 60);
      toast({ title: "Code sent", description: res.message });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Unable to send code.";
      toast({ title: "Send failed", description: message, variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authenticationService.verifyEmailOtp(token, otp);
      setEmailVerified(true);
      setRequiresOtp(false);
      toast({ title: "Email verified" });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Verification failed.";
      toast({ title: "Verification failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authenticationService.completeInitialSetup({ token, newPassword, confirmPassword });
      setDone(true);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Unable to set password.";
      toast({ title: "Setup failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const showPasswordStep = tokenValid && emailVerified && !requiresOtp;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img src={logo} alt="Campusza" className="h-12 mx-auto rounded-md" />
          <CardTitle>Set up your account</CardTitle>
          <CardDescription>
            {validating ? "Checking your link…" : tokenValid ? `Account: ${maskedEmail}` : tokenMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Your password is set. You can sign in now.</p>
              <Button asChild className="w-full">
                <Link to="/signin">Sign in</Link>
              </Button>
            </div>
          ) : tokenValid && requiresOtp && !emailVerified ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground">Verify your email with a one-time code.</p>
              <Button type="button" variant="outline" className="w-full" disabled={sendingOtp || otpCooldown > 0} onClick={handleSendOtp}>
                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : sendingOtp ? "Sending…" : "Send verification code"}
              </Button>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Verify email"}
              </Button>
            </form>
          ) : showPasswordStep ? (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving…" : "Set password"}
              </Button>
            </form>
          ) : !validating && !tokenValid ? (
            <p className="text-sm text-destructive text-center">{tokenMessage}</p>
          ) : null}
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/signin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupPasswordPage;
