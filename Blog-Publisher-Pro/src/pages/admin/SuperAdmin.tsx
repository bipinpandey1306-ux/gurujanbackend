import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import UserReachRow from "@/components/superadmin/UserReachRow";
import GrowthAnalysis from "@/components/superadmin/GrowthAnalysis";
import { useAuth } from "@workspace/replit-auth-web";

const SUPERADMIN_PATH = "/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard";
import {
  useSuperadminUsers,
  useSuperadminStats,
  useSuperadminVerifyUser,
  useSuperadminBlockUser,
  useSuperadminDeleteUser,
  useSuperadminUpdateUserReach,
  useSuperadminChangePassword,
  SuperadminUser
} from "@/lib/api-client-mock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Users,
  FileText,
  Eye,
  ShieldCheck,
  UserX,
  BadgeCheck,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Save,
  Lock
} from "lucide-react";

// Imported from @/components/superadmin/UserReachRow

export default function SuperAdminPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const { data: usersData, isLoading: loadingUsers } = useSuperadminUsers();
  const { data: statsData, isLoading: loadingStats } = useSuperadminStats();

  const verifyMut = useSuperadminVerifyUser();
  const blockMut = useSuperadminBlockUser();
  const deleteMut = useSuperadminDeleteUser();
  const reachMut = useSuperadminUpdateUserReach();
  const passwordMut = useSuperadminChangePassword();

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Actions handlers
  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await verifyMut.mutateAsync({ id, isVerified });
      toast({
        title: "Success",
        description: `Verification status updated successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update verification status.",
        variant: "destructive",
      });
    }
  };

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await blockMut.mutateAsync({ id, isBlocked });
      toast({
        title: "Success",
        description: isBlocked ? "User has been blocked." : "User has been unblocked.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update block status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync({ id });
      toast({
        title: "Success",
        description: "User account and all associated data deleted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user account.",
        variant: "destructive",
      });
    }
  };

  const handleSaveReach = async (id: string, reachMultiplier: number, minReach: number) => {
    try {
      await reachMut.mutateAsync({ id, reachMultiplier, minReach });
      toast({
        title: "Success",
        description: "User reach settings updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update reach settings.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setChangingPw(true);
    try {
      await passwordMut.mutateAsync({ currentPassword, newPassword });
      toast({
        title: "Success",
        description: "Super Admin password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setChangingPw(false);
    }
  };

  if (currentUser?.role !== "superadmin") {
    return (
      <SuperAdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold font-serif">Unauthorized Access</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            You do not have the required permissions to view this admin panel. This page is restricted to the Super Admin.
          </p>
        </div>
      </SuperAdminLayout>
    );
  }

  const [location, setLocation] = useLocation();

  let activeTab = "overview";
  if (location.endsWith("/users")) {
    activeTab = "users";
  } else if (location.endsWith("/security")) {
    activeTab = "security";
  }

  useEffect(() => {
    if (location === SUPERADMIN_PATH) {
      setLocation(`${SUPERADMIN_PATH}/overview`);
    }
  }, [location, setLocation]);

  const handleTabChange = (value: string) => {
    setLocation(`${SUPERADMIN_PATH}/${value}`);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Super Admin Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user verifications, reach multipliers, and system configuration settings.
          </p>
        </div>

        <Tabs value={activeTab} className="space-y-6">

          {/* 1. GLOBAL OVERVIEW PANEL */}
          <TabsContent value="overview" className="space-y-8 animate-fadeIn">
            {/* Dynamic Statistics Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="glass-card shadow-sm border border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Users</p>
                    <h3 className="text-xl font-bold font-serif leading-tight mt-0.5">
                      {loadingStats ? "..." : statsData?.totalUsers}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card shadow-sm border border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Blogs</p>
                    <h3 className="text-xl font-bold font-serif leading-tight mt-0.5">
                      {loadingStats ? "..." : statsData?.totalBlogs}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card shadow-sm border border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Verified Users</p>
                    <h3 className="text-xl font-bold font-serif leading-tight mt-0.5">
                      {loadingStats ? "..." : statsData?.verifiedUsers}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card shadow-sm border border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <UserX size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Blocked Users</p>
                    <h3 className="text-xl font-bold font-serif leading-tight mt-0.5">
                      {loadingStats ? "..." : statsData?.blockedUsers}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="grid-colspan-2 lg:col-span-1 glass-card shadow-sm border border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Eye size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Global Views</p>
                    <h3 className="text-xl font-bold font-serif leading-tight mt-0.5">
                      {loadingStats ? "..." : statsData?.totalViews}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            <GrowthAnalysis stats={statsData} loading={loadingStats} />

            <Card className="glass-card shadow-sm border border-border/50 p-6 rounded-2xl bg-gradient-to-tr from-primary/5 via-transparent to-accent/5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <TrendingUp size={24} />
                </div>
                <div className="space-y-1.5 max-w-xl">
                  <h4 className="font-serif font-bold text-base text-foreground">Understanding Reach & Virality Rules</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By default, the Gurujan publishing platform implements an **automated virality algorithm** for all new blog posts.
                    During the first **72 hours** after publication, posts will automatically receive an impression view boost starting at **1,500 views** and decaying slowly to **100 views** to encourage fresh publishing.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    As Super Admin, you can manually control reaching guidelines for any user account under the **User Management** page:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    <li>**Multiplier:** Multiplies the raw view count recorded for their blogs (e.g. `2.0` doubles their views).</li>
                    <li>**Min Views:** Defines the absolute minimum view count their posts will ever show, even after the initial 72-hour viral window decays.</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 2. USER MANAGEMENT DIRECTORY */}
          <TabsContent value="users" className="space-y-6 animate-fadeIn">
            <Card className="glass-card shadow-sm border border-border/55 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
                <CardTitle className="font-serif text-lg">System User Directory</CardTitle>
                <CardDescription className="text-xs">
                  Authorize blue ticks, disable/block accounts, and configure views reach parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Fetching user directories...
                  </div>
                ) : usersData?.users && usersData.users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Author Name</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Email</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Role</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-center">Blue Tick</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-center">Blocked</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider w-[220px]">Reach Controls</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData.users.map((u) => (
                          <UserReachRow
                            key={u.id}
                            user={u}
                            currentUser={currentUser}
                            onVerify={handleVerify}
                            onBlock={handleBlock}
                            onDelete={handleDelete}
                            onSaveReach={handleSaveReach}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No users registered in the database.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. SECURITY GATEWAY PANEL */}
          <TabsContent value="security" className="space-y-6 animate-fadeIn">
            <Card className="glass-card shadow-sm border border-border/55 rounded-2xl max-w-md">
              <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
                <CardTitle className="font-serif text-lg">Change Admin Password</CardTitle>
                <CardDescription className="text-xs">
                  Update the login password for the Super Admin account.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-pw" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Current Password
                    </Label>
                    <Input
                      id="current-pw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 rounded-xl bg-background/50 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      New Password
                    </Label>
                    <Input
                      id="new-pw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 rounded-xl bg-background/50 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 rounded-xl bg-background/50 text-xs"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full h-11 hover-lift rounded-xl font-semibold mt-4 shadow-sm"
                  >
                    {changingPw ? "Updating password..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
