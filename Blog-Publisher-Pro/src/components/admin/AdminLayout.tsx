import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  FileText,
  Tag,
  Image,
  MessageSquare,
  BarChart3,
  User,
  Mail,
  HardDrive,
  LogOut,
  Globe,
  Menu,
  X,
  BadgeCheck,
  Shield,
  Lock,
  Cpu,
  Users,
  TrendingUp,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUPERADMIN_PATH = "/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/blogs", label: "Blog Posts", icon: FileText },
  { href: "/portal/categories", label: "Categories", icon: Tag },
  { href: "/portal/gallery", label: "Gallery", icon: Image },
  { href: "/portal/media", label: "Media", icon: HardDrive },
  { href: "/portal/comments", label: "Comments", icon: MessageSquare },
  { href: "/portal/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/portal/network", label: "Network", icon: Users },
  { href: "/portal/contact", label: "Messages", icon: Mail },
  { href: "/portal/profile", label: "Profile", icon: User },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isSuperadmin = user?.role === "superadmin";

  const filteredNavItems = isSuperadmin
    ? [
        ...navItems.filter(
          (item) =>
            item.label !== "Gallery" &&
            item.label !== "Media" &&
            item.label !== "Comments" &&
            item.label !== "Blog Posts" &&
            item.label !== "Dashboard"
        ),
        { href: SUPERADMIN_PATH + "/overview", label: "System Overview", icon: Shield },
        { href: SUPERADMIN_PATH + "/users", label: "User Directory", icon: Users },
        { href: SUPERADMIN_PATH + "/security", label: "Security Portal", icon: Lock }
      ]
    : navItems.filter(
        (item) =>
          item.label !== "Categories" &&
          item.label !== "Messages"
      );

  return (
    <aside className="flex flex-col h-full bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/50">
      <div className="p-5 border-b border-sidebar-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/portal" 
            className="flex items-center gap-2.5" 
            onClick={onClose}
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Gurujan Logo" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-sidebar-foreground leading-tight tracking-tight">
                User Portal
              </p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider mt-0.5">
                Gurujan Publishing
              </p>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 hover:bg-sidebar-accent/50 rounded-lg transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/30">
            <Avatar className="h-8.5 w-8.5 ring-2 ring-primary/10">
              <AvatarImage src={user.profileImageUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                {(user.firstName?.[0] ?? user.email?.[0] ?? "A").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                  {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email}
                </p>
                {user.isVerified && (
                  <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                {isSuperadmin ? "Super Admin Account" : "Author Account"}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {filteredNavItems.map(({ href, label, icon: Icon }) => {
          const exact = href === "/portal";
          const active = exact ? location === href : location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/15 border border-primary/10"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={16} className={active ? "text-primary-foreground" : "text-muted-foreground/80"} />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50 space-y-2 bg-sidebar-accent/20">
        <Link href="/" target="_blank">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent cursor-pointer transition-all hover:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border/55">
            <Globe size={16} className="text-muted-foreground" />
            View Site
          </div>
        </Link>
        {user && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 cursor-pointer transition-all bg-destructive/5 hover:text-destructive active:scale-95"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

function LoginGate() {
  const { isAuthenticated, login, register, error, clearError } = useAuth();
  const [location] = useLocation();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Fields state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [passcode, setPasscode] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Email validation regex (standard + max 100 limit check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email) && email.length <= 100;

  // Password validation regex (between 8 and 16 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
  const isPasswordValid = passwordRegex.test(password);

  const isBioValid = bio.length <= 500;
  const isNameValid = name.trim().length > 0 && name.length <= 100;

  const handleToggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setName("");
    setEmail("");
    setPassword("");
    setBio("");
    setPasscode("");
    clearError();
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    if (mode === "login") {
      const isSuperadminGate = location.startsWith(SUPERADMIN_PATH);
      await login(email, password, isSuperadminGate);
    } else {
      if (isNameValid && isEmailValid && isPasswordValid && isBioValid && passcode) {
        const success = await register(name, email, password, bio, passcode);
        if (success) {
          setName("");
          setPassword("");
          setBio("");
          setPasscode("");
          setSuccessMsg("Registration successful! Please sign in using your credentials.");
          setMode("login");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-primary/5" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-accent/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg p-8 border border-border/60 rounded-2xl bg-card/60 backdrop-blur-xl shadow-xl glass-card relative"
      >
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <img src="/logo.png" className="w-full h-full object-contain animate-pulse" alt="Gurujan Logo" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold text-center text-foreground mb-1 text-gradient">
          {mode === "login" ? "User Login" : "User Registration"}
        </h1>
        <p className="text-muted-foreground text-center text-xs mb-6 leading-relaxed max-w-xs mx-auto">
          {mode === "login" 
            ? "Sign in to access your publishing workspace, write blogs, and manage comments on Gurujan." 
            : "Register as a user to publish your thoughts and configure your personal dashboard."}
        </p>

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5"
          >
            {successMsg}
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="reg-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
              <Input 
                id="reg-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your public name" 
                className={`h-10 rounded-xl bg-background/50 text-xs ${
                  name && name.length > 100 ? "border-destructive focus-visible:ring-destructive" : "border-border/50"
                }`} 
                maxLength={100}
                required 
              />
              {mode === "register" && name && name.length > 100 && (
                <p className="text-[10px] text-destructive font-semibold">Full name cannot exceed 100 characters.</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
            <Input 
              id="reg-email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" 
              className={`h-10 rounded-xl bg-background/50 text-xs ${
                email && !isEmailValid ? "border-destructive focus-visible:ring-destructive" : "border-border/50"
              }`} 
              maxLength={100}
              required 
            />
            {mode === "register" && email && !isEmailValid && (
              <p className="text-[10px] text-destructive font-semibold">
                {email.length > 100 ? "Email address cannot exceed 100 characters." : "Please enter a valid email address."}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</Label>
            <Input 
              id="reg-password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className={`h-10 rounded-xl bg-background/50 text-xs ${
                mode === "register" && password && !isPasswordValid ? "border-destructive focus-visible:ring-destructive" : "border-border/50"
              }`}
              maxLength={32}
              required 
            />
            {mode === "register" && password && !isPasswordValid && (
              <div className="space-y-1 text-[10px] text-destructive/80 font-medium bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                <p className="font-bold text-destructive">Password strength criteria:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li className={password.length >= 8 && password.length <= 16 ? "text-green-600 dark:text-green-400 font-semibold" : ""}>Between 8 and 16 characters long</li>
                  <li className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400 font-semibold" : ""}>Contains at least one uppercase letter</li>
                  <li className={/[a-z]/.test(password) ? "text-green-600 dark:text-green-400 font-semibold" : ""}>Contains at least one lowercase letter</li>
                  <li className={/\d/.test(password) ? "text-green-600 dark:text-green-400 font-semibold" : ""}>Contains at least one number</li>
                  <li className={/[@$!%*?&]/.test(password) ? "text-green-600 dark:text-green-400 font-semibold" : ""}>Contains at least one special character (@$!%*?&)</li>
                </ul>
              </div>
            )}
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="reg-bio" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biography</Label>
                <span className={`text-[10px] font-bold ${isBioValid ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {bio.length} / 500 max characters (optional)
                </span>
              </div>
              <Textarea 
                id="reg-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3} 
                placeholder="Write a brief background about your reflections..." 
                className={`rounded-xl leading-relaxed text-xs bg-background/50 ${
                  bio && !isBioValid ? "border-destructive focus-visible:ring-destructive" : "border-border/50"
                }`}
                maxLength={500}
              />
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="reg-passcode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registration Passcode</Label>
              <Input 
                id="reg-passcode"
                type="password" 
                value={passcode} 
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter registration passcode" 
                className="h-10 rounded-xl bg-background/50 text-xs border-border/50" 
                required 
              />
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            disabled={mode === "register" && (!isNameValid || !isEmailValid || !isPasswordValid || !isBioValid || !passcode)}
            className="w-full h-11 shadow-lg hover-lift rounded-xl font-semibold mt-6 shadow-primary/20"
          >
            {mode === "login" ? "Sign In" : "Register & Start Publishing"}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-border/40 pt-4">
          <button 
            onClick={handleToggleMode}
            className="text-xs text-primary hover:underline font-semibold focus:outline-none"
          >
            {mode === "login" 
              ? "Don't have an account? Register here" 
              : "Already have an account? Sign in here"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginGate />;
  }

  const isSuperadmin = user?.role === "superadmin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-56 xl:w-64 flex-shrink-0">
        <div className="fixed inset-y-0 w-56 xl:w-64">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar Navigation Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              className="relative w-64 bg-sidebar shadow-xl h-full"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-56 xl:pl-64">
        {/* Mobile Header Bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <span className="font-serif font-bold text-sm text-foreground">User Portal</span>
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Gurujan Logo" />
          </div>
        </div>

        {/* Primary Page Content Wrapper */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
