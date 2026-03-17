"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  employee: "Employee",
  admin: "Admin",
  designer: "Designer",
  superadmin: "Super Admin",
};

const roleBadgeClass: Record<string, string> = {
  employee: "bg-muted text-muted-foreground",
  admin: "bg-blue-100 text-blue-700",
  designer: "bg-purple-100 text-purple-700",
  superadmin: "bg-red-100 text-red-700",
};

export function Header() {
  const router = useRouter();
  const { currentUser, authRole } = useUser();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        {currentUser && (
          <>
            <span className="text-sm font-medium">{currentUser.name}</span>
            {authRole && (
              <Badge variant="secondary" className={roleBadgeClass[authRole] || ""}>
                {roleLabels[authRole] || authRole}
              </Badge>
            )}
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
