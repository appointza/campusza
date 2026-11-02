import { 
  Users, 
  ClipboardList, 
  Calendar, 
  FileText, 
  Bell, 
  Shield 
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student Management",
    description: "Comprehensive student profiles with academic records, attendance history, and personal information.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ClipboardList,
    title: "Attendance Tracking",
    description: "Digital attendance system with real-time updates and automated parent notifications.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Calendar,
    title: "Schedule Management",
    description: "Create and manage class schedules, exams, and school events effortlessly.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: FileText,
    title: "Grade Reports",
    description: "Generate detailed academic reports and transcripts with just a few clicks.",
    color: "bg-purple/10 text-purple",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Keep parents and staff informed with instant notifications and announcements.",
    color: "bg-cyan/10 text-cyan",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure access control with customizable permissions for admins and staff.",
    color: "bg-orange/10 text-orange",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Manage Your School</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful features designed to simplify school administration and improve communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
