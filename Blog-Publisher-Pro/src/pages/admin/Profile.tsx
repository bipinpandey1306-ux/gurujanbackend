import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, Globe, Award, Briefcase, Camera, Image,
  Save, Sparkles, CheckCircle2, Info, Facebook, Twitter, Instagram, Youtube, Trash2, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@workspace/replit-auth-web";

interface ProfileForm {
  name: string;
  profileImage: string;
  coverImage: string;
  bio: string;
  phone: string;
  email: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  website: string;
  achievements: string;
  experience: string;
}

export default function AdminProfile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, isLoading } = useGetProfile({ scope: "mine" });
  const profile = data?.profile;
  const update = useUpdateProfile();
  
  const [activeTab, setActiveTab] = useState<"personal" | "background" | "social">("personal");

  const { register, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<ProfileForm>();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Register image fields programmatically so react-hook-form tracks them
  useEffect(() => {
    register("profileImage");
    register("coverImage");
  }, [register]);

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? "",
        profileImage: profile.profileImage ?? "",
        coverImage: profile.coverImage ?? "",
        bio: profile.bio ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        facebook: profile.facebook ?? "",
        twitter: profile.twitter ?? "",
        instagram: profile.instagram ?? "",
        youtube: profile.youtube ?? "",
        website: profile.website ?? "",
        achievements: profile.achievements ?? "",
        experience: profile.experience ?? "",
      });
    }
  }, [profile, reset]);

  const avatarVal = watch("profileImage");
  const coverVal = watch("coverImage");
  const nameVal = watch("name");
  const emailVal = watch("email");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (e.g. limit to 5MB to prevent MongoDB payloads exceeding 20mb)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose an image smaller than 5MB."
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue("profileImage", reader.result as string, { shouldDirty: true });
      toast({
        title: "Avatar selected",
        description: "Save changes to finalize uploading your avatar."
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose an image smaller than 5MB."
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue("coverImage", reader.result as string, { shouldDirty: true });
      toast({
        title: "Cover selected",
        description: "Save changes to finalize uploading your cover image."
      });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (formData: ProfileForm) => {
    update.mutate(
      { data: formData },
      { 
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          toast({
            title: "Profile Updated",
            description: "Your settings have been saved successfully."
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: err instanceof Error ? err.message : "Could not update your profile."
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/40" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/30">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <User size={26} className="text-primary" /> Profile Settings
            </h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium">Customize your digital workspace avatar, banner, and biography.</p>
          </div>
          <Button 
            type="submit" 
            disabled={update.isPending || !isDirty}
            className="px-5 shadow-lg shadow-primary/10 hover-lift h-9 rounded-xl font-bold text-xs gap-1.5 self-end sm:self-auto"
          >
            {update.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </Button>
        </div>

        {update.isSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-green-700 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2"
          >
            <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />
            Author profile settings updated successfully!
          </motion.div>
        )}

        {/* Visual Cover & Avatar Editor Panel */}
        <div className="relative bg-muted/20 border border-border/30 rounded-3xl p-4 md:p-6 glass-card overflow-hidden">
          {/* Cover Banner Zone */}
          <div className="h-48 md:h-56 w-full bg-muted relative rounded-2xl overflow-hidden border border-border/40 shadow-inner group">
            {coverVal ? (
              <img src={coverVal} className="w-full h-full object-cover animate-fade-in" alt="Cover banner" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center">
                <Image className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Overlay controller */}
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => coverInputRef.current?.click()}
                className="rounded-xl h-8.5 text-[11px] font-bold shadow-md hover-lift bg-background/90 text-foreground"
              >
                <Camera size={13} className="mr-1.5" /> Upload Cover Image
              </Button>
              {coverVal && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setValue("coverImage", "", { shouldDirty: true })}
                  className="rounded-xl h-8.5 text-[11px] font-bold shadow-md hover-lift"
                >
                  <Trash2 size={13} className="mr-1.5" /> Remove
                </Button>
              )}
            </div>
            
            <input 
              type="file" 
              ref={coverInputRef} 
              onChange={handleCoverUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Profile Avatar Overlapping Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between px-4 md:px-6 gap-4 -mt-12 md:-mt-16 pb-2 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end gap-4 text-center md:text-left">
              {/* Overlapping circle */}
              <div className="relative mx-auto md:mx-0 group inline-block">
                <Avatar className="w-28 h-28 md:w-32 md:h-32 ring-6 ring-background shadow-xl">
                  <AvatarImage src={avatarVal} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-tr from-primary to-accent text-white font-serif text-3xl font-bold">
                    {(nameVal ?? profile?.name ?? "A")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload action overlay */}
                <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all shadow-md active:scale-90"
                    title="Upload Avatar Image"
                  >
                    <Camera size={18} />
                  </button>
                </div>
                
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Identity details */}
              <div className="mb-2 space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">
                    {nameVal || "Author Profile"}
                  </h2>
                  <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-bold px-2.5 py-0.5 rounded-full border-primary/20 text-primary bg-primary/5">
                    {user?.role === "superadmin" ? "Super Admin" : "Verified Creator"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{emailVal || "No email set"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab selection area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Sidebar Menu - Tabs selector */}
          <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border/30 rounded-2xl glass-card self-start">
            {[
              { id: "personal", label: "Personal Details", desc: "Basic credential settings and biography details", icon: User },
              { id: "background", label: "Professional Bio", desc: "Showcase career milestones and accomplishments", icon: Award },
              { id: "social", label: "Social Portals", desc: "Expose external publishing and community handles", icon: Globe }
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    activeTab === tab.id
                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "bg-transparent border-transparent hover:bg-muted/40 hover:text-foreground text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeTab === tab.id ? "bg-white/10" : "bg-muted"}`}>
                      <IconComp size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{tab.label}</p>
                      <p className={`text-[10px] mt-0.5 leading-snug ${activeTab === tab.id ? "text-primary-foreground/75" : "text-muted-foreground/80"}`}>
                        {tab.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === "personal" && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border border-border/50 shadow-sm glass-card">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                        <User size={16} className="text-primary" /> Personal Information
                      </CardTitle>
                      <CardDescription className="text-[11px]">Primary identifiers displayed across published articles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                          <Input {...register("name")} placeholder="Your public name" maxLength={100} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                          <Input type="email" {...register("email")} placeholder="your@email.com" maxLength={100} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</Label>
                          <Input {...register("phone")} placeholder="+91..." maxLength={20} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">About Bio</Label>
                        <Textarea {...register("bio")} rows={4} placeholder="Write a short personal background description..." maxLength={500} className="rounded-xl leading-relaxed text-xs bg-background/50 border-border/50" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "background" && (
                <motion.div
                  key="background"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border border-border/50 shadow-sm glass-card">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                        <Award size={16} className="text-primary" /> Credentials & Contributions
                      </CardTitle>
                      <CardDescription className="text-[11px]">Showcase experience milestones and editorial accolades.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievements</Label>
                        <Textarea {...register("achievements")} rows={4} placeholder="List professional accomplishments..." maxLength={1000} className="rounded-xl leading-relaxed text-xs bg-background/50 border-border/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Experience</Label>
                        <Textarea {...register("experience")} rows={4} placeholder="Describe career history and editorial contributions..." maxLength={1000} className="rounded-xl leading-relaxed text-xs bg-background/50 border-border/50" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "social" && (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border border-border/50 shadow-sm glass-card">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                        <Globe size={16} className="text-primary" /> Social Channels & Links
                      </CardTitle>
                      <CardDescription className="text-[11px]">Cross-link external communication networks and profiles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Globe size={12} /> Website
                          </Label>
                          <Input {...register("website")} placeholder="https://yourwebsite.com" maxLength={200} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Twitter size={12} /> Twitter
                          </Label>
                          <Input {...register("twitter")} placeholder="@username" maxLength={200} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Instagram size={12} /> Instagram
                          </Label>
                          <Input {...register("instagram")} placeholder="https://instagram.com/username" maxLength={200} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Facebook size={12} /> Facebook
                          </Label>
                          <Input {...register("facebook")} placeholder="https://facebook.com/username" maxLength={200} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Youtube size={12} /> YouTube
                          </Label>
                          <Input {...register("youtube")} placeholder="https://youtube.com/channel/..." maxLength={200} className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
