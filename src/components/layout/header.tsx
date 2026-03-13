"use client";

import { useUser } from "@/providers/user-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Header() {
  const { currentUser, setCurrentUser, teamMembers } = useUser();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Logged in as:</span>
        <Select
          value={currentUser?.id?.toString() || ""}
          onValueChange={(val) => {
            const member = teamMembers.find((m) => m.id === Number(val));
            if (member) setCurrentUser(member);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
