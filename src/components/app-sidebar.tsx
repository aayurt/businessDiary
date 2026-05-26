"use client"

import * as React from "react"
import {
  FolderPlus,
  FilePlus,
  Settings,
  ChevronRight,
  LayoutDashboard,
  Home,
  BookOpen,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Project {
  id: string
  name: string
  files: {
    id: string
    title: string
    slug: string
  }[]
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      const json = await res.json()
      if (json.success) {
        setProjects(json.data)
      }
    } catch (error) {
      console.error("Failed to fetch projects", error)
    }
  }

  React.useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async () => {
    if (!newProjectName) return
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: newProjectName }),
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        setNewProjectName("")
        setIsNewProjectDialogOpen(false)
        fetchProjects()
      }
    } catch (error) {
      console.error("Failed to create project", error)
    }
  }

  const handleCreateFile = async (projectId: string) => {
    try {
      const res = await fetch(`/api/files/projects/${projectId}`, {
        method: "POST",
        body: JSON.stringify({ title: "Untitled Entry" }),
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/editor/${json.data.id}`)
        fetchProjects()
      }
    } catch (error) {
      console.error("Failed to create file", error)
    }
  }

  return (
    <>
      <Sidebar collapsible="icon">
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
              <SidebarMenu>
                {projects.map((project) => (
                  <Collapsible key={project.id} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={project.name}>
                          <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          <span>{project.name}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/collapsible:opacity-100 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateFile(project.id)
                        }}
                      >
                        <FilePlus className="size-3" />
                      </Button>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {project.files.map((file) => (
                            <SidebarMenuSubItem key={file.id}>
                              <SidebarMenuSubButton
                                isActive={pathname === `/editor/${file.id}`}
                                onClick={() => router.push(`/editor/${file.id}`)}
                              >
                                <span>{file.title}</span>
                              </SidebarMenuSubButton>
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
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </SidebarMenuButton>
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
    </>
  )
}
