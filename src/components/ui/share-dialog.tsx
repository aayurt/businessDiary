"use client"

import * as React from "react"
import {
  Copy,
  Check,
  Link,
  Globe,
  Lock,
  Users,
  Loader2,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useFileAccess, useGrantAccess, useRevokeAccess } from "@/lib/hooks/use-file"
import type { PrivacyMode, FileAccess } from "@/types/file"

const PRIVACY_OPTIONS: { value: PrivacyMode; label: string; icon: typeof Globe; description: string }[] = [
  { value: "PUBLIC", label: "Public", icon: Globe, description: "Anyone with the link can view" },
  { value: "SHARED", label: "Shared", icon: Users, description: "Only people with access can view" },
  { value: "PRIVATE", label: "Private", icon: Lock, description: "Only you can view" },
]

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  privacy: PrivacyMode
  onPrivacyChange: (privacy: PrivacyMode) => void
}

function AccessRow({
  grant,
  onRevoke,
  isCurrentUser,
}: {
  grant: FileAccess
  onRevoke: (id: string) => void
  isCurrentUser: boolean
}) {
  const [showConfirm, setShowConfirm] = React.useState(false)
  const displayName = grant.user?.name ?? grant.email
  const displayEmail = grant.user ? grant.email : null

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {displayEmail && (
            <span className="text-xs text-muted-foreground truncate">{displayEmail}</span>
          )}
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive"
          onClick={() => setShowConfirm(true)}
          disabled={isCurrentUser}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for <strong>{displayName}</strong>?
              They will no longer be able to view this entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onRevoke(grant.id)
                setShowConfirm(false)
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ShareDialog({
  open,
  onOpenChange,
  fileId,
  privacy,
  onPrivacyChange,
}: ShareDialogProps) {
  const [email, setEmail] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  const { data: accessGrants, isLoading: isLoadingAccess } = useFileAccess(open ? fileId : "")
  const grantAccess = useGrantAccess()
  const revokeAccess = useRevokeAccess()

  const shareUrl = React.useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/shared/${fileId}`
  }, [fileId])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleGrant = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    try {
      await grantAccess.mutateAsync({ fileId, email: trimmed })
      setEmail("")
      toast.success("Access granted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grant access")
    }
  }

  const handleRevoke = async (accessId: string) => {
    try {
      await revokeAccess.mutateAsync({ fileId, accessId })
      toast.success("Access revoked")
    } catch {
      toast.error("Failed to revoke access")
    }
  }

  const PrivateIcon = PRIVACY_OPTIONS.find((o) => o.value === privacy)?.icon ?? Lock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrivateIcon className="h-4 w-4" />
            Share Entry
          </DialogTitle>
          <DialogDescription>
            Control who can view this entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            {PRIVACY_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isSelected = privacy === opt.value
              return (
                <Button
                  key={opt.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="flex-1 flex-col gap-1 h-auto py-3"
                  onClick={() => onPrivacyChange(opt.value)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-normal">{opt.label}</span>
                </Button>
              )
            })}
          </div>

          {privacy !== "PRIVATE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Shareable link</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground truncate">
                  <Link className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{shareUrl}</span>
                </div>
                <Button variant="outline" size="icon" className="shrink-0" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {privacy !== "PRIVATE" && (
            <>
              <Separator />

              <div className="space-y-3">
                <label className="text-sm font-medium">Grant access</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGrant()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGrant}
                    disabled={!email.trim() || grantAccess.isPending}
                  >
                    {grantAccess.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Grant"
                    )}
                  </Button>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {isLoadingAccess ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : accessGrants && accessGrants.length > 0 ? (
                    accessGrants.map((grant) => (
                      <AccessRow
                        key={grant.id}
                        grant={grant}
                        onRevoke={handleRevoke}
                        isCurrentUser={false}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      {privacy === "PUBLIC"
                        ? "This entry is public. Anyone with the link can view it."
                        : "No users have been granted access yet."}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
