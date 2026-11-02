import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Building2, User, Check } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { organizationService } from "@/services/organization.service";

const steps = [
  { id: 1, title: "Organization Info", icon: Building2 },
  { id: 2, title: "Admin Details", icon: User },
  { id: 3, title: "Review", icon: Check },
];

const OrganizationSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Organization Info
    organizationName: "",
    organizationType: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    website: "",
    studentCount: "",
    // Admin Details
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const missingFields: string[] = [];
    if (!formData.organizationName) missingFields.push("Organization Name");
    if (!formData.organizationType) missingFields.push("Organization Type");
    if (!formData.address) missingFields.push("Address");
    if (!formData.city) missingFields.push("City");
    if (!formData.state) missingFields.push("State/Province");
    if (!formData.country) missingFields.push("Country");
    if (!formData.phone) missingFields.push("Phone Number");
    if (!formData.studentCount) missingFields.push("Estimated Student Count");
    if (!formData.adminFirstName) missingFields.push("Admin First Name");
    if (!formData.adminLastName) missingFields.push("Admin Last Name");
    if (!formData.adminEmail) missingFields.push("Admin Email");
    if (!formData.adminPhone) missingFields.push("Admin Phone");
    if (!formData.adminPassword) missingFields.push("Password");
    if (!formData.confirmPassword) missingFields.push("Confirm Password");

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: missingFields.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await organizationService.register({
        organizationName: formData.organizationName,
        organizationType: formData.organizationType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        phone: formData.phone,
        website: formData.website,
        studentCount: formData.studentCount,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        adminPassword: formData.adminPassword,
      });

      toast({
        title: "Organization Registered!",
        description: "Your organization has been successfully registered. You can now sign in.",
      });
      navigate("/signin");
    } catch (error: any) {
      let message = "Registration failed. Please try again.";
      const responseData = error?.response?.data;
      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData);
          message = parsed?.message || parsed?.key || message;
        } catch {
          message = responseData || message;
        }
      } else if (responseData) {
        message = responseData?.message || responseData?.key || message;
      }
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                placeholder="Enter your school/organization name"
                value={formData.organizationName}
                onChange={(e) => handleInputChange("organizationName", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationType">Organization Type *</Label>
              <Select value={formData.organizationType} onValueChange={(v) => handleInputChange("organizationType", v)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="primary">Primary School</SelectItem>
                  <SelectItem value="secondary">Secondary School</SelectItem>
                  <SelectItem value="high">High School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="coaching">Coaching Center</SelectItem>
                  <SelectItem value="vocational">Vocational Institute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  placeholder="https://www.yourschool.edu"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentCount">Estimated Student Count *</Label>
                <Select value={formData.studentCount} onValueChange={(v) => handleInputChange("studentCount", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="1-100">1 - 100</SelectItem>
                    <SelectItem value="101-500">101 - 500</SelectItem>
                    <SelectItem value="501-1000">501 - 1000</SelectItem>
                    <SelectItem value="1001-5000">1001 - 5000</SelectItem>
                    <SelectItem value="5000+">5000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">First Name *</Label>
                <Input
                  id="adminFirstName"
                  placeholder="John"
                  value={formData.adminFirstName}
                  onChange={(e) => handleInputChange("adminFirstName", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminLastName">Last Name *</Label>
                <Input
                  id="adminLastName"
                  placeholder="Doe"
                  value={formData.adminLastName}
                  onChange={(e) => handleInputChange("adminLastName", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@yourschool.edu"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPhone">Admin Phone *</Label>
              <Input
                id="adminPhone"
                placeholder="+1 234 567 8900"
                value={formData.adminPhone}
                onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password *</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Create a strong password"
                value={formData.adminPassword}
                onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Organization Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Organization Name</p>
                  <p className="font-medium">{formData.organizationName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{formData.organizationType?.replace("-", " ") || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {formData.address ? `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{formData.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Website</p>
                  <p className="font-medium">{formData.website || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student Count</p>
                  <p className="font-medium">{formData.studentCount || "-"}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Admin Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{formData.adminFirstName} {formData.adminLastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{formData.adminEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{formData.adminPhone || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
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
              Register Your <span className="text-primary">Organization</span>
            </CardTitle>
            <CardDescription className="text-base">
              Set up your school or institution on Campusza
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${currentStep >= step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                    }
                  `}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Title */}
            <h3 className="text-lg font-semibold mb-6 text-center">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h3>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              {currentStep < 3 ? (
                <Button variant="hero" onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Registering..." : "Complete Registration"}
                </Button>
              )}
            </div>

            {/* Sign In Link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/signin" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationSignup;
