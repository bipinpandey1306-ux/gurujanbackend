import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, Download, Upload, ShieldAlert, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { localStore } from "@/lib/local-store";

export default function BackupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDownloadBackup = async () => {
    try {
      const dump = await localStore.getDatabaseDump();
      const blob = new Blob([dump], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blog-publisher-pro-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Backup Downloaded",
        description: "Your local database has been successfully exported.",
      });
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download database backup.",
        variant: "destructive",
      });
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await localStore.restoreDatabaseDump(content);
        await queryClient.invalidateQueries();
        toast({
          title: "Restore Complete",
          description: "All database stores have been successfully restored.",
        });
      } catch (err: any) {
        toast({
          title: "Restore Failed",
          description: err.message || "Invalid backup file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Workspace Database Backup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Export or restore system records, configurations, comments, and media schemas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-border/50 shadow-sm glass-card flex flex-col rounded-2xl">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
              <div className="flex items-center gap-2">
                <Database size={20} className="text-primary" />
                <CardTitle className="font-serif text-lg font-bold tracking-tight">Database Operations</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Manage local browser IndexedDB snapshots containing platform data.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col justify-between flex-1 gap-6">
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Your blog content, media metadata, category tags, profile credentials, and comment sections are stored locally inside the browser's IndexedDB. Download periodic backup archives to secure system state, or upload a JSON backup snapshot to restore all database entries.
                </p>

                {/* Caution Alert Block */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive-foreground">
                  <div className="p-1 rounded bg-destructive/10 text-destructive flex-shrink-0">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-destructive leading-none mb-1">Destructive Action Warning</h5>
                    <p className="text-[11px] text-destructive/80 leading-relaxed font-medium">
                      Restoring a database snapshot will overwrite all active user configurations, blogs, and local uploads currently loaded on this machine. Ensure you download a backup of the current database before uploading another file.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3.5 pt-2">
                <Button onClick={handleDownloadBackup} size="sm" className="gap-2 px-4 h-10 rounded-xl font-semibold shadow-md shadow-primary/10">
                  <Download size={15} /> Download System Backup
                </Button>
                
                <label className="inline-flex">
                  <span className="inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-10 px-4 gap-2 cursor-pointer border border-border/60 hover-lift">
                    <Upload size={15} /> Restore System Backup
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleUploadBackup}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Quick FAQ / Info Panel */}
          <Card className="border border-border/50 shadow-sm glass-card flex flex-col rounded-2xl">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <CardTitle className="font-serif text-base font-bold tracking-tight">Important FAQ</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs leading-relaxed text-muted-foreground font-medium">
              <div>
                <h5 className="font-bold text-foreground mb-1">What is saved in backups?</h5>
                <p>All database tables: Users, Blogs, Categories, Albums, Media uploads metadata, and Messages.</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <h5 className="font-bold text-foreground mb-1">Are physical media files exported?</h5>
                <p>Only the image filenames and database references are stored. Local blob data uploaded in custom albums should be archived separately.</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <h5 className="font-bold text-foreground mb-1">When should I backup?</h5>
                <p>Prior to executing significant database deletions or user account purges inside the User Directory control screen.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
