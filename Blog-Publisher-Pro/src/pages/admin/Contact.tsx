import { useListContactMessages, useDeleteContactMessage, getListContactMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Mail, Eye, MailOpen } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminContact() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<any>(null);
  const del = useDeleteContactMessage();

  const { data, isLoading } = useListContactMessages();
  const messages = data?.messages ?? [];
  const unread = messages.filter((m: any) => !m.isRead).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  if (user?.role !== "superadmin") {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif">Unauthorized Access</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            This page is restricted to the Super Admin.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Contact Messages</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {messages.length} messages received{unread > 0 ? `, ${unread} unread` : ""}
            </p>
          </div>
        </div>

        {/* Messages Card */}
        <Card className="border border-border/50 shadow-sm glass-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse border border-border/40" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <Mail size={44} className="text-muted-foreground/40 mb-3" />
                <p className="font-serif text-lg font-bold text-foreground mb-1">No messages yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">Incoming contact submissions from your public page will appear here.</p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border/40"
              >
                <AnimatePresence>
                  {messages.map((msg: any) => (
                    <motion.div 
                      key={msg.id} 
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -10 }}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/40 transition-colors border-l-2 ${!msg.isRead ? "bg-primary/[0.02] border-l-primary" : "border-l-transparent"}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${!msg.isRead ? "bg-primary/10 border-primary/10" : "bg-muted border-border/50"}`}>
                        {msg.isRead ? <MailOpen size={15} className="text-muted-foreground" /> : <Mail size={15} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{msg.name}</span>
                          <span className="text-xs text-muted-foreground font-medium">{msg.email}</span>
                          {!msg.isRead && <Badge variant="default" className="text-[10px] tracking-wider uppercase px-2 py-0.25 rounded-full font-bold">New</Badge>}
                        </div>
                        {msg.subject && (
                          <p className="text-xs text-foreground font-bold mb-0.5">{msg.subject}</p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed font-medium">{msg.message}</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1 font-semibold">{format(new Date(msg.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Dialog open={viewing?.id === msg.id} onOpenChange={(v) => { if (!v) setViewing(null); }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setViewing(msg)}>
                              <Eye size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-md">
                            <DialogHeader>
                              <DialogTitle className="font-serif font-bold text-lg">{msg.subject || "Message from " + msg.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs font-semibold text-muted-foreground/85">
                                <div>
                                  <span>From: </span>
                                  <span className="text-foreground">{msg.name}</span>
                                </div>
                                <div className="hidden sm:block">·</div>
                                <div>
                                  <span>Email: </span>
                                  <a href={`mailto:${msg.email}`} className="text-primary hover:underline">{msg.email}</a>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground/75 font-semibold">{format(new Date(msg.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
                              <div className="bg-muted/40 rounded-xl p-4 text-xs text-foreground leading-relaxed whitespace-pre-wrap border border-border/40 font-medium">
                                "{msg.message}"
                              </div>
                              <div className="flex justify-end">
                                <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Your message")}`}>
                                  <Button size="sm" className="rounded-xl text-xs font-semibold shadow-lg shadow-primary/10">Reply by email</Button>
                                </a>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif font-bold text-lg">Delete message?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Are you sure you want to delete this contact message? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del.mutate({ id: msg.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListContactMessagesQueryKey() }) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
