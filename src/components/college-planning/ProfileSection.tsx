import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { Edit, Globe, Link } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface ProfileFormData {
  full_name: string;
  grade: string;
  school: string;
  interested_majors: string;
  social_media: {
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  personal_website: string;
}

export default function ProfileSection() {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || "",
      grade: profile?.grade || "",
      school: profile?.school || "",
      interested_majors: profile?.interested_majors?.join(", ") || "",
      social_media: {
        instagram: profile?.social_media?.instagram || "",
        linkedin: profile?.social_media?.linkedin || "",
        twitter: profile?.social_media?.twitter || "",
      },
      personal_website: profile?.personal_website || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync({
      full_name: data.full_name,
      grade: data.grade,
      school: data.school,
      interested_majors: data.interested_majors.split(",").map(m => m.trim()),
      social_media: data.social_media,
      personal_website: data.personal_website,
    });
    setIsEditing(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student Profile</CardTitle>
          <Button onClick={() => setIsEditing(true)} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm">{profile?.full_name || "Not set"}</p>
            </div>
            <div>
              <Label>Grade</Label>
              <p className="text-sm">{profile?.grade || "Not set"}</p>
            </div>
            <div>
              <Label>School</Label>
              <p className="text-sm">{profile?.school || "Not set"}</p>
            </div>
            <div>
              <Label>Interested Majors</Label>
              <p className="text-sm">{profile?.interested_majors?.join(", ") || "Not set"}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Social Media</Label>
            <div className="flex gap-4">
              {profile?.social_media?.instagram && (
                <a href={profile.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                  Instagram
                </a>
              )}
              {profile?.social_media?.linkedin && (
                <a href={profile.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                  LinkedIn
                </a>
              )}
              {profile?.social_media?.twitter && (
                <a href={profile.social_media.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                  Twitter
                </a>
              )}
            </div>
          </div>
          {profile?.personal_website && (
            <div>
              <Label>Personal Website</Label>
              <a href={profile.personal_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                <Globe className="h-4 w-4" />
                {profile.personal_website}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interested_majors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interested Majors (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_media.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_media.linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_media.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personal_website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Website</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}