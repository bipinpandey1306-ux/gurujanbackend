import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BadgeCheck, Trash2, Save } from "lucide-react";
import { SuperadminUser } from "@/lib/api-client-mock";

interface UserReachRowProps {
  user: SuperadminUser;
  currentUser: any;
  onVerify: (id: string, val: boolean) => void;
  onBlock: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
  onSaveReach: (id: string, mult: number, min: number) => void;
}

export default function UserReachRow({
  user,
  currentUser,
  onVerify,
  onBlock,
  onDelete,
  onSaveReach,
}: UserReachRowProps) {
  const [mult, setMult] = useState(user.reachMultiplier ?? 1.0);
  const [min, setMin] = useState(user.minReach ?? 0);
  const isSelf = user.id === currentUser?.id;

  const handleSave = () => {
    onSaveReach(user.id, Number(mult), Number(min));
  };

  const isEmailHashed = !user.email.includes("@");

  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {user.name[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-xs text-foreground leading-tight">{user.name}</p>
              {user.isVerified && (
                <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {isEmailHashed ? (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-lg">
            Hashed (Secure)
          </Badge>
        ) : (
          <span className="text-xs font-mono text-muted-foreground">{user.email}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={user.role === "superadmin" ? "default" : "outline"} className="text-[10px] uppercase tracking-wider font-bold">
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={user.isVerified}
          disabled={isSelf}
          onCheckedChange={(checked) => onVerify(user.id, checked)}
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={user.isBlocked}
          disabled={isSelf}
          onCheckedChange={(checked) => onBlock(user.id, checked)}
          className={user.isBlocked ? "data-[state=checked]:bg-destructive" : ""}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-16">
            <Label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Multiplier</Label>
            <Input
              type="number"
              value={mult}
              onChange={(e) => setMult(Number(e.target.value))}
              className="h-8 text-xs px-2"
              min={0}
              step={0.1}
            />
          </div>
          <div className="w-20">
            <Label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Min Views</Label>
            <Input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="h-8 text-xs px-2"
              min={0}
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 mt-4"
            title="Save Reach Settings"
          >
            <Save size={15} />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {!isSelf ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 size={15} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you absolutely sure you want to delete <strong>{user.name}</strong>? This action will permanently remove their profile, categories, albums, media uploads, and all blog posts from the database. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="text-[10px] text-muted-foreground italic font-semibold px-2">Owner</span>
        )}
      </TableCell>
    </TableRow>
  );
}
