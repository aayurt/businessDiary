"use client"

import * as React from "react"
import {
  FolderPlus,
  FilePlus,
  ChevronRight,
  LayoutDashboard,
  Home,
  BookOpen,
  Pencil,
  Check,
  X,
  MoreHorizontal,
  Trash2,
  LogOut,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  useProjects,
  useCreateProject,
  useRenameProject,
  useDeleteProject,
} from "@/lib/hooks/use-projects"
import {
  useCreateFile,
  useDeleteFile,
} from "@/lib/hooks/use-file"
import type { Project } from "@/types/project"

function getInitials(user?: { name?: string | null; email?: string | null }) {
  if (user?.name) {
    const parts = user.name.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
  }
  return (user?.email?.[0] ?? "?").toUpperCase()
}

export function AppSidebar() {
  const session = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const renameProject = useRenameProject()
  const deleteProject = useDeleteProject()
  const createFile = useCreateFile()
  const deleteFile = useDeleteFile()

  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = React.useState(false)
  const [newFileTitle, setNewFileTitle] = React.useState("")
  const [newFileProjectId, setNewFileProjectId] = React.useState<string | null>(null)
  const [editingFileId, setEditingFileId] = React.useState<string | null>(null)
  const [editingFileTitle, setEditingFileTitle] = React.useState("")
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = React.useState("")
  const [deletingProjectId, setDeletingProjectId] = React.useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    createProject.mutate(newProjectName.trim())
    setNewProjectName("")
    setIsNewProjectDialogOpen(false)
  }

  const handleCreateFile = async () => {
    const projectId = newFileProjectId
    if (!projectId || !newFileTitle.trim()) return

    createFile.mutate(
      { projectId, title: newFileTitle.trim() },
      {
        onSuccess: (data) => {
          router.push(`/editor/${data.id}`)
        },
      },
    )

    setIsNewFileDialogOpen(false)
    setNewFileTitle("")
    setNewFileProjectId(null)
  }

  const openNewFileDialog = (projectId: string) => {
    setNewFileProjectId(projectId)
    setNewFileTitle("")
    setIsNewFileDialogOpen(true)
  }

  const startRenamingFile = (file: { id: string; title: string }) => {
    setEditingFileId(file.id)
    setEditingFileTitle(file.title)
  }

  const cancelRenamingFile = () => {
    setEditingFileId(null)
    setEditingFileTitle("")
  }

  const saveRenameFile = (fileId: string) => {
    const newTitle = editingFileTitle.trim()
    if (!newTitle) {
      cancelRenamingFile()
      return
    }
    const project = projects?.find((p) => p.files.some((f) => f.id === fileId))
    if (!project) return
    setEditingFileId(null)
    setEditingFileTitle("")
  }

  const startRenamingProject = (project: Project) => {
    setEditingProjectId(project.id)
    setEditingProjectName(project.name)
  }

  const cancelRenamingProject = () => {
    setEditingProjectId(null)
    setEditingProjectName("")
  }

  const saveRenameProject = () => {
    const projectId = editingProjectId
    const newName = editingProjectName.trim()
    if (!projectId || !newName) {
      cancelRenamingProject()
      return
    }
    renameProject.mutate({ projectId, name: newName })
    setEditingProjectId(null)
    setEditingProjectName("")
  }

  const openDeleteDialog = (projectId: string) => {
    setDeletingProjectId(projectId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteProject = () => {
    const projectId = deletingProjectId
    if (!projectId) return
    deleteProject.mutate(projectId)
    setIsDeleteDialogOpen(false)
    setDeletingProjectId(null)
  }

  const handleDeleteFile = (fileId: string) => {
    deleteFile.mutate(fileId)
  }

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" onClick={() => router.push("/")}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Business Diary</span>
                  <span className="text-xs text-muted-foreground">v1.0</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Home" onClick={() => router.push("/")}>
                    <Home className="size-4" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Dashboard" onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-1">
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsNewProjectDialogOpen(true)}
              >
                <FolderPlus className="size-4" />
              </Button>
            </div>
            <SidebarGroupContent>
              {isLoading ? (
                <div className="space-y-2 px-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
              <SidebarMenu>
                {projects?.map((project) => (
                  <Collapsible key={project.id} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={project.name}
                          className="w-full"
                        >
                          <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          {editingProjectId === project.id ? (
                            <div className="flex flex-1 items-center gap-1 min-w-0">
                              <Input
                                value={editingProjectName}
                                onChange={(e) => setEditingProjectName(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation()
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    saveRenameProject()
                                  }
                                  if (e.key === "Escape") {
                                    cancelRenamingProject()
                                  }
                                }}
                                onBlur={saveRenameProject}
                                className="h-6 text-sm px-1 py-0"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div
                                className="h-5 w-5 shrink-0 flex items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  saveRenameProject()
                                }}
                              >
                                <Check className="size-3" />
                              </div>
                            </div>
                          ) : (
                            <span className="flex-1 truncate">{project.name}</span>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {editingProjectId !== project.id && (
                        <>
                          <SidebarMenuAction
                            onClick={() => openNewFileDialog(project.id)}
                          >
                            <FilePlus className="size-3" />
                          </SidebarMenuAction>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction>
                                <MoreHorizontal className="size-3" />
                              </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => startRenamingProject(project)}>
                                <Pencil className="size-3.5 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteDialog(project.id)}
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {project.files.map((file) => (
                            <SidebarMenuSubItem key={file.id}>
                              {editingFileId === file.id ? (
                                <div className="flex items-center gap-1 px-2 py-1">
                                  <Input
                                    value={editingFileTitle}
                                    onChange={(e) => setEditingFileTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        saveRenameFile(file.id)
                                      }
                                      if (e.key === "Escape") {
                                        cancelRenamingFile()
                                      }
                                    }}
                                    onBlur={() => saveRenameFile(file.id)}
                                    className="h-7 text-sm px-1 py-0"
                                    autoFocus
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => saveRenameFile(file.id)}
                                  >
                                    <Check className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={cancelRenamingFile}
                                  >
                                    <X className="size-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="group/FileAction flex items-center relative">
                                  <SidebarMenuSubButton
                                    isActive={pathname === `/editor/${file.id}`}
                                    onClick={() => router.push(`/editor/${file.id}`)}
                                    className="flex-1 min-w-0"
                                  >
                                    <span className="flex-1 truncate">{file.title}</span>
                                  </SidebarMenuSubButton>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <div className="absolute right-1 flex h-6 w-5 items-center justify-center rounded-md opacity-0 group-hover/FileAction:opacity-100 transition-opacity text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
                                        <MoreHorizontal className="size-3" />
                                      </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRenamingFile(file); }}>
                                        <Pencil className="size-3.5 mr-2" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteFile(file.id)
                                        }}
                                      >
                                        <Trash2 className="size-3.5 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </SidebarMenuSubItem>
                          ))}
                          {project.files.length === 0 && (
                            <div className="px-4 py-2 text-xs text-muted-foreground italic">
                              No entries yet
                            </div>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-2 py-1.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {getInitials(session?.data?.user)}
                </div>
                <div className="flex flex-1 flex-col truncate text-sm group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{session?.data?.user?.name ?? "User"}</span>
                  <span className="truncate text-xs text-muted-foreground">{session?.data?.user?.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => signOut({ redirectTo: "/auth/signin" })}
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Entry title"
              value={newFileTitle}
              onChange={(e) => setNewFileTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile} disabled={!newFileTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? Its entries will be unlinked but not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
