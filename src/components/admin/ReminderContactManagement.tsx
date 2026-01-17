import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Users, Send, Mail } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Contact {
  id: string;
  name: string;
  email: string;
  notes: string | null;
}

interface ReminderContactManagementProps {
  studentId: string;
  studentName: string;
  incompleteTodosCount: number;
  onSendReminder: (emails: string[]) => Promise<void>;
  isSending: boolean;
}

export default function ReminderContactManagement({
  studentId,
  studentName,
  incompleteTodosCount,
  onSendReminder,
  isSending,
}: ReminderContactManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["reminder-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_contacts")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Contact[];
    },
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contact: { name: string; email: string; notes: string }) => {
      const { data, error } = await supabase
        .from("reminder_contacts")
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-contacts"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("联系人已添加 / Contact added!");
    },
    onError: (error) => {
      console.error("Error adding contact:", error);
      toast.error("添加联系人失败 / Failed to add contact");
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, ...contact }: { id: string; name: string; email: string; notes: string }) => {
      const { data, error } = await supabase
        .from("reminder_contacts")
        .update(contact)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-contacts"] });
      setIsEditDialogOpen(false);
      setSelectedContact(null);
      resetForm();
      toast.success("联系人已更新 / Contact updated!");
    },
    onError: (error) => {
      console.error("Error updating contact:", error);
      toast.error("更新联系人失败 / Failed to update contact");
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminder_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-contacts"] });
      setSelectedContactIds((prev) => prev.filter((id) => id !== selectedContact?.id));
      toast.success("联系人已删除 / Contact deleted!");
    },
    onError: (error) => {
      console.error("Error deleting contact:", error);
      toast.error("删除联系人失败 / Failed to delete contact");
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setNotes("");
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("请填写姓名和邮箱 / Please fill in name and email");
      return;
    }
    addContactMutation.mutate({ name: name.trim(), email: email.trim(), notes: notes.trim() });
  };

  const handleEditContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !name.trim() || !email.trim()) {
      toast.error("请填写姓名和邮箱 / Please fill in name and email");
      return;
    }
    updateContactMutation.mutate({
      id: selectedContact.id,
      name: name.trim(),
      email: email.trim(),
      notes: notes.trim(),
    });
  };

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setName(contact.name);
    setEmail(contact.email);
    setNotes(contact.notes || "");
    setIsEditDialogOpen(true);
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (contacts) {
      if (selectedContactIds.length === contacts.length) {
        setSelectedContactIds([]);
      } else {
        setSelectedContactIds(contacts.map((c) => c.id));
      }
    }
  };

  const handleSendToSelected = async () => {
    const selectedEmails = contacts
      ?.filter((c) => selectedContactIds.includes(c.id))
      .map((c) => c.email) || [];

    if (selectedEmails.length === 0) {
      toast.error("请选择至少一个联系人 / Please select at least one contact");
      return;
    }

    await onSendReminder(selectedEmails);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            提醒联系人 / Reminder Contacts
          </span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加 / Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加联系人 / Add Contact</DialogTitle>
                <DialogDescription>
                  添加一个新的提醒邮件收件人 / Add a new reminder email recipient
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddContact}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">姓名 / Name *</Label>
                    <Input
                      id="add-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="联系人姓名..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">邮箱 / Email *</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-notes">备注 / Notes</Label>
                    <Input
                      id="add-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="可选备注..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    取消 / Cancel
                  </Button>
                  <Button type="submit" disabled={addContactMutation.isPending}>
                    {addContactMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    保存 / Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : contacts && contacts.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedContactIds.length === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  全选 / Select All ({selectedContactIds.length}/{contacts.length})
                </span>
              </div>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
                  >
                    <Checkbox
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={() => handleToggleContact(contact.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.email}
                      </p>
                      {contact.notes && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Send Button */}
            {incompleteTodosCount > 0 && studentId && (
              <Button
                className="w-full"
                onClick={handleSendToSelected}
                disabled={selectedContactIds.length === 0 || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                群发提醒到 {selectedContactIds.length} 位联系人 / Send to {selectedContactIds.length} contacts
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无联系人 / No contacts yet</p>
            <p className="text-sm">点击上方按钮添加联系人</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑联系人 / Edit Contact</DialogTitle>
              <DialogDescription>
                修改联系人信息 / Update contact information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditContact}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">姓名 / Name *</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="联系人姓名..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">邮箱 / Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">备注 / Notes</Label>
                  <Input
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="可选备注..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedContact(null);
                    resetForm();
                  }}
                >
                  取消 / Cancel
                </Button>
                <Button type="submit" disabled={updateContactMutation.isPending}>
                  {updateContactMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  保存 / Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
