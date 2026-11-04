
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import MainNav from "@/components/layout/MainNav";
import FoundersSection from "@/components/about/FoundersSection";
import { useLanguage } from "@/i18n/LanguageProvider";

interface UpdateItem {
  id: string;
  content: string;
  date: string;
  title: string;
}

export default function About() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useProfile();
  const { t, lang } = useLanguage();

  const isAdmin = profile?.user_type === 'admin';

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdates();
    supabase.auth.getSession().then(({ data }) => setSessionUserId(data.session?.user.id ?? null));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSessionUserId(null);
  }

  async function fetchUpdates() {
    try {
      const { data, error } = await supabase
        .from('platform_updates')
        .select('id, title, content, date')
        .order('date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  }

  async function addUpdate() {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('platform_updates')
        .insert([{
          title: newUpdate.title,
          content: newUpdate.content,
          date: new Date().toISOString(),
        }]);
      
      if (error) throw error;
      
      toast.success("Update added successfully");
      setNewUpdate({ title: '', content: '' });
      setShowUpdateForm(false);
      fetchUpdates();
    } catch (error) {
      console.error('Error adding update:', error);
      toast.error("Failed to add update");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav isAuthenticated={!!sessionUserId} userId={sessionUserId} onLogout={handleLogout} />
      <div className="container mx-auto px-4 pb-20 pt-28 sm:pt-32">
        <div className="mx-auto max-w-5xl space-y-16">
          <section>
            <h1 className="font-serif text-4xl font-semibold text-pine">{t("about.title")}</h1>
            <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-foreground/85">
              <p>{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
              <p>{t("about.p3")}</p>
              <p>{t("about.p4")}</p>
            </div>
          </section>

          <FoundersSection />

          <section className="max-w-3xl">
            <h2 className="font-serif text-3xl font-semibold text-pine">{t("about.updates")}</h2>
            <div className="mt-6">
          {isAdmin && (
            <div className="mb-6">
              {!showUpdateForm ? (
                <Button 
                  onClick={() => setShowUpdateForm(true)}
                  className="mb-4"
                >
                  Add New Update
                </Button>
              ) : (
                <div className="p-4 border rounded-md shadow-sm space-y-4 bg-muted/40">
                  <h3 className="font-medium">Add New Platform Update</h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        id="title"
                        value={newUpdate.title}
                        onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Update title"
                      />
                    </div>
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium mb-1">Content</label>
                      <Textarea
                        id="content"
                        value={newUpdate.content}
                        onChange={(e) => setNewUpdate(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Update content"
                        rows={4}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addUpdate}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Update'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowUpdateForm(false);
                          setNewUpdate({ title: '', content: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-6">
            {updates.length > 0 ? (
              updates.map((update) => (
                <div key={update.id} className="border-l-4 border-primary pl-4 py-1">
                  <h3 className="font-bold text-lg">{update.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(update.date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="prose prose-sm">
                    {update.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{t("about.noUpdates")}</p>
            )}
          </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
