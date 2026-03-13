"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/lib/types";
import { toast } from "sonner";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "member" });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = () => {
    fetch("/api/team").then((r) => r.json()).then(setMembers);
  };

  const handleAdd = async () => {
    if (!form.name) return;
    try {
      await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("Team member added!");
      setDialogOpen(false);
      setForm({ name: "", email: "", role: "member" });
      fetchMembers();
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this team member?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    toast.success("Member removed");
    fetchMembers();
  };

  const roleColors: Record<string, string> = {
    lead: "bg-amber-100 text-amber-700",
    member: "bg-blue-100 text-blue-700",
    designer: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team</h2>
          <p className="text-muted-foreground">{members.length} members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={!form.name}>Add Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[member.role] || ""}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
