"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { TeamMember } from "@/lib/types";

interface UserContextType {
  currentUser: TeamMember | null;
  setCurrentUser: (user: TeamMember) => void;
  teamMembers: TeamMember[];
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  teamMembers: [],
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((members: TeamMember[]) => {
        setTeamMembers(members);
        const savedId = localStorage.getItem("currentUserId");
        if (savedId) {
          const saved = members.find((m) => m.id === Number(savedId));
          if (saved) {
            setCurrentUserState(saved);
          } else if (members.length > 0) {
            setCurrentUserState(members[0]);
            localStorage.setItem("currentUserId", String(members[0].id));
          }
        } else if (members.length > 0) {
          setCurrentUserState(members[0]);
          localStorage.setItem("currentUserId", String(members[0].id));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setCurrentUser = (user: TeamMember) => {
    setCurrentUserState(user);
    localStorage.setItem("currentUserId", String(user.id));
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, teamMembers, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
