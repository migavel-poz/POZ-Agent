"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/providers/user-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { ALL_POST_TYPES, POST_TYPE_LABELS } from "@/lib/constants";
import { PromptTemplate, PostType } from "@/lib/types";
import { toast } from "sonner";

export default function TemplatesPage() {
  const { currentUser } = useUser();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [form, setForm] = useState({
    name: "",
    post_type: "problem_solution" as PostType,
    system_prompt: "",
    user_prompt_template: "",
    example_output: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast.success("Template updated!");
      } else {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, created_by: currentUser?.id }),
        });
        toast.success("Template created!");
      }
      setDialogOpen(false);
      setEditingTemplate(null);
      setForm({ name: "", post_type: "problem_solution", system_prompt: "", user_prompt_template: "", example_output: "" });
      fetchTemplates();
    } catch {
      toast.error("Failed to save template");
    }
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      post_type: template.post_type,
      system_prompt: template.system_prompt,
      user_prompt_template: template.user_prompt_template,
      example_output: template.example_output || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    toast.success("Template deleted");
    fetchTemplates();
  };

  const groupedTemplates = ALL_POST_TYPES.reduce((acc, type) => {
    acc[type] = templates.filter((t) => t.post_type === type);
    return acc;
  }, {} as Record<PostType, PromptTemplate[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prompt Templates</h2>
          <p className="text-muted-foreground">Manage AI prompt templates for consistent content</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingTemplate(null); setForm({ name: "", post_type: "problem_solution", system_prompt: "", user_prompt_template: "", example_output: "" }); }
        }}>
          <DialogTrigger asChild>
            <Button>Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Post Type</Label>
                  <Select value={form.post_type} onValueChange={(v) => setForm({ ...form, post_type: v as PostType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_POST_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{POST_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Instructions for the AI on how to write this type of post..."
                />
              </div>
              <div className="space-y-2">
                <Label>User Prompt Template</Label>
                <Textarea
                  value={form.user_prompt_template}
                  onChange={(e) => setForm({ ...form, user_prompt_template: e.target.value })}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder='Use {{topic}} and {{additional_context}} as placeholders'
                />
              </div>
              <div className="space-y-2">
                <Label>Example Output (optional)</Label>
                <Textarea
                  value={form.example_output}
                  onChange={(e) => setForm({ ...form, example_output: e.target.value })}
                  rows={4}
                  className="font-mono text-sm"
                  placeholder="An example of the ideal output..."
                />
              </div>
              <Button onClick={handleSave} disabled={!form.name || !form.system_prompt}>
                {editingTemplate ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {ALL_POST_TYPES.map((type) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <PostTypeBadge type={type} />
            <span className="text-sm text-muted-foreground">({groupedTemplates[type]?.length || 0} templates)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(groupedTemplates[type] || []).map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.is_default === 1 && (
                        <CardDescription className="text-xs">Default template</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>Delete</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{template.system_prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
