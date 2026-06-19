import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Users,
  Lock,
  LogOut,
  Menu,
  X,
  BadgeCheck,
  Tag,
  Mail,
  Database,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUPERADMIN_PATH = "/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard";

const adminNavItems = [
  { href: SUPERADMIN_PATH + "/overview", label: "System Overview", icon: Shield },
  { href: SUPERADMIN_PATH + "/users", label: "User Directory", icon: Users },
  { href: "/portal/categories", label: "Categories", icon: Tag },
  { href: "/portal/contact", label: "Messages", icon: Mail },
  { href: "/portal/backup", label: "Workspace Backup", icon: Database },
  { href: SUPERADMIN_PATH + "/security", label: "Security Portal", icon: Lock },
];

function SuperAdminSidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col h-full bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/50">
      <div className="p-5 border-b border-sidebar-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <Link 
            href={SUPERADMIN_PATH + "/overview"} 
            className="flex items-center gap-2.5" 
            onClick={onClose}
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Gurujan Logo" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-sidebar-foreground leading-tight tracking-tight">
                Admin Console
              </p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider mt-0.5">
                Gurujan Administration
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
            <Avatar className="h-8.5 w-8.5 ring-2 ring-amber-500/10">
              <AvatarImage src={user.profileImageUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-amber-500 text-white font-semibold">
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
                Super Admin Account
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
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

      <div className="p-4 border-t border-sidebar-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl h-10 px-3.5 gap-3"
          onClick={() => logout()}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

function SuperAdminLoginGate() {
  const { isAuthenticated, login, error, clearError } = useAuth();
  const [location] = useLocation();
  
  if (isAuthenticated) {
    return null;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email) && email.length <= 100;

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
  const isPasswordValid = passwordRegex.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSuperadminGate = location.startsWith(SUPERADMIN_PATH);
    await login(email, password, isSuperadminGate);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-amber-500/5" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-rose-500/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg p-8 border border-border/60 rounded-2xl bg-card/60 backdrop-blur-xl shadow-xl glass-card relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-tr from-amber-500 to-rose-500 shadow-amber-500/20 text-white">
            <span className="text-white font-serif font-bold text-base">SA</span>
          </div>
        </div>
        
        <h1 className="font-serif text-3xl font-bold text-center text-foreground mb-1 text-gradient bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
          Super Admin Portal
        </h1>
        <p className="text-muted-foreground text-center text-xs mb-6 leading-relaxed max-w-xs mx-auto">
          Access the Gurujan system administration console to manage authors, verification privileges, and view metrics.
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
              Admin Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@gurujan.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clearError();
              }}
              className="h-11 rounded-xl bg-background/50 text-xs px-4"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
              Admin Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              className="h-11 rounded-xl bg-background/50 text-xs px-4"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!isEmailValid || !isPasswordValid}
            className="w-full h-11 hover-lift rounded-xl font-semibold mt-6 shadow-md bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-600 hover:to-rose-600"
          >
            Sign In to Console
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "superadmin") {
    return <SuperAdminLoginGate />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-56 xl:w-64 flex-shrink-0">
        <div className="fixed inset-y-0 w-56 xl:w-64">
          <SuperAdminSidebar />
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
              <SuperAdminSidebar onClose={() => setSidebarOpen(false)} />
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
            <span className="font-serif font-bold text-sm text-foreground">Admin Console</span>
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
