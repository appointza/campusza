import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { userService } from "@/services/user.service";
import { onboardingService } from "@/services/onboarding.service";
import { authenticationService } from "@/services/authentication.service";
import {
  getSignInReturnPath,
  isAdminRole,
  persistAuthSession,
  resolvePostLoginPath,
  syncSuperAdminFlagFromApi,
  isSuperAdminFromStorage,
} from "@/utils/auth-session";

type StaffEmailStatus = "none" | "ready" | "setup_required";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"staff" | "student">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [studentDob, setStudentDob] = useState("");
  const [emailStatus, setEmailStatus] = useState<StaffEmailStatus>("none");
  const [setupEmailSent, setSetupEmailSent] = useState(false);

  useEffect(() => {
    setSetupEmailSent(false);
    if (loginMode !== "staff") {
      setEmailStatus("none");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed.includes("@") || trimmed.length < 5) {
      setEmailStatus("none");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await authenticationService.checkSignInEmail(trimmed);
        if (!cancelled) {
          setEmailStatus(res.status === "setup_required" || res.status === "ready" ? res.status : "none");
        }
      } catch {
        if (!cancelled) setEmailStatus("none");
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email, loginMode]);

  const needsPasswordSetup = emailStatus === "setup_required";

  const returnTo = getSignInReturnPath(
    (location.state as { from?: string } | null)?.from,
    searchParams.get("return")
  );

  const handleSendPasswordEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await authenticationService.forgotPassword(trimmed);
      setSetupEmailSent(true);
      toast({
        title: "Email sent",
        description: res.message || "Check your inbox to set your password.",
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not send email. Try again.";
      toast({ title: "Could not send email", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSignIn = async () => {
    if (needsPasswordSetup) {
      await handleSendPasswordEmail();
      return;
    }

    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Email and password are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await userService.login({ email, password });
      const session = persistAuthSession(result as unknown as Record<string, unknown>);
      if (!session) {
        toast({
          title: "Sign in failed",
          description: "Could not read session from server response.",
          variant: "destructive",
        });
        return;
      }

      if (session.email) {
        await syncSuperAdminFlagFromApi(session.email);
      }

      const isAdmin = isAdminRole(session.role);
      const superAdmin = isSuperAdminFromStorage();

      toast({
        title: "Welcome back!",
        description: `Signed in as ${isAdmin ? "Administrator" : "Staff Member"}`,
      });

      if (!isAdmin) {
        navigate(resolvePostLoginPath(session.role, returnTo));
        return;
      }

      if (superAdmin) {
        toast({
          title: "Welcome back!",
          description: "Signed in as platform administrator",
        });
        navigate(resolvePostLoginPath(session.role, returnTo));
        return;
      }

      try {
        const setup = await onboardingService.getStatus();
        if (setup.complete) {
          navigate(resolvePostLoginPath(session.role, returnTo));
        } else {
          navigate("/admin/onboarding");
        }
      } catch {
        navigate("/admin/onboarding");
      }
    } catch (error: unknown) {
      let message = "Sign in failed. Please try again.";
      const responseData = (error as { response?: { data?: unknown } })?.response?.data;
      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData) as { message?: string; key?: string };
          message = parsed?.message || parsed?.key || message;
        } catch {
          message = responseData || message;
        }
      } else if (responseData && typeof responseData === "object") {
        const data = responseData as { message?: string; key?: string };
        message = data?.message || data?.key || message;
      }

      if (
        message.toLowerCase().includes("complete account setup") ||
        message.toLowerCase().includes("link sent to your email")
      ) {
        setEmailStatus("setup_required");
        await handleSendPasswordEmail();
        return;
      }

      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignIn = async () => {
    if (!mobile.trim() || !studentDob.trim()) {
      toast({
        title: "Missing credentials",
        description: "Mobile number and date of birth are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await userService.loginWithMobile({ mobile: mobile.trim(), password: studentDob.trim() });
      const session = persistAuthSession(result as unknown as Record<string, unknown>);
      if (!session) {
        toast({
          title: "Sign in failed",
          description: "Could not read session from server response.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Welcome!", description: "Signed in as student." });
      navigate(resolvePostLoginPath(session.role, returnTo));
    } catch (error: unknown) {
      let message = "Sign in failed. Please try again.";
      const responseData = (error as { response?: { data?: unknown } })?.response?.data;
      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData) as { message?: string; key?: string };
          message = parsed?.message || parsed?.key || message;
        } catch {
          message = responseData || message;
        }
      } else if (responseData && typeof responseData === "object") {
        const data = responseData as { message?: string; key?: string };
        message = data?.message || data?.key || message;
      }
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Campusza Logo" className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
            </div>
            <CardTitle className="text-2xl font-display font-bold">
              Welcome to <span className="text-primary">Campusza</span>
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your school management dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs value={loginMode} onValueChange={(v) => setLoginMode(v as "staff" | "student")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="staff">Staff / Admin</TabsTrigger>
                <TabsTrigger value="student">Student</TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@school.edu"
                    className="h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                {needsPasswordSetup ? (
                  setupEmailSent ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Check your email, set your password, then sign in below.
                    </p>
                  ) : null
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  variant="hero"
                  className="w-full h-12 mt-2"
                  onClick={handleStaffSignIn}
                  disabled={loading}
                >
                  {loading
                    ? needsPasswordSetup
                      ? "Sending…"
                      : "Signing in…"
                    : needsPasswordSetup
                      ? setupEmailSent
                        ? "Resend email"
                        : "Set password"
                      : "Sign In"}
                </Button>

                {needsPasswordSetup && setupEmailSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={async () => {
                      setSetupEmailSent(false);
                      const trimmed = email.trim();
                      if (!trimmed.includes("@")) return;
                      try {
                        const res = await authenticationService.checkSignInEmail(trimmed);
                        if (res.status === "ready") {
                          setEmailStatus("ready");
                        } else {
                          setEmailStatus("setup_required");
                          toast({
                            title: "Almost there",
                            description: "Open the link in your email to set your password first.",
                          });
                        }
                      } catch {
                        setEmailStatus("ready");
                      }
                    }}
                  >
                    I set my password — sign in
                  </Button>
                ) : null}
              </TabsContent>

              <TabsContent value="student" className="mt-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in with your registered mobile number and date of birth as the password.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="signin-mobile">Mobile number</Label>
                  <Input
                    id="signin-mobile"
                    type="tel"
                    placeholder="9876543210"
                    className="h-12"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-student-dob">Date of birth</Label>
                  <Input
                    id="signin-student-dob"
                    type="date"
                    className="h-12"
                    value={studentDob}
                    onChange={(e) => setStudentDob(e.target.value)}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full h-12 mt-2"
                  onClick={handleStudentSignIn}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In as Student"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center space-y-3">
              {!needsPasswordSetup && loginMode === "staff" ? (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    const trimmed = email.trim();
                    if (!trimmed.includes("@")) {
                      toast({ title: "Enter your email first", variant: "destructive" });
                      return;
                    }
                    void handleSendPasswordEmail();
                  }}
                >
                  Forgot your password?
                </button>
              ) : null}
              <div className="text-sm text-muted-foreground">
                New organization?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
