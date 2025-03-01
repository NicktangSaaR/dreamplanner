
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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

  const isAdmin = profile?.user_type === 'admin';

  useEffect(() => {
    fetchUpdates();
  }, []);

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

  return <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold mb-6">About Us</h1>
          <div className="prose prose-lg space-y-6">
            <p>
              DreamPlanner is an all-in-one platform designed to help students take control of their academic journey and college planning. By creating a personal account, students can efficiently manage their courses, calculate their GPA, and plan extracurricular activities. DreamPlanner also enables students to build a customized college list, tailored to universities worldwide, making the application process more organized and strategic.
            </p>
            <p>
              To enhance productivity, DreamPlanner offers a built-in Note feature and a To-Do List, allowing students to keep track of important tasks, organize reminders, and collaborate seamlessly with their college counselors.
            </p>
            <p>
              For International Education Consultants (IEC)and school counselors, DreamPlanner provides a Counselor Account feature that connects directly with students' profiles. This allows counselors to track student progress in real-time, provide personalized guidance, and monitor key milestones throughout the college application process.
            </p>
            <p>
              With DreamPlanner, students and counselors can work together to create a structured and stress-free approach to academic success and college admissions
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Recent Updates</h2>
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
                <div className="p-4 border rounded-md shadow-sm space-y-4 bg-gray-50">
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
                    {new Date(update.date).toLocaleDateString('en-US', {
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
              <p className="text-muted-foreground italic">No recent updates available.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">About The Developer</h2>
          <div className="prose prose-lg space-y-6">
            <p>
              Nick Tang, the driving force behind DreamPlanner, brings 12 years of expertise in college admissions, essay coaching, and interview preparation for top universities in the U.S., Canada, and the U.K.
            </p>
            <p>
              With a background in top-tier management consulting and a UCLA College Counseling Certificate, Nick combines strategic insight with a keen ability to help students craft compelling applications. His passion for mentoring has also led him to coach numerous teams in business competitions worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>;
}
