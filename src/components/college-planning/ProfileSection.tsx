import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";
import ProfileDisplay from "./ProfileDisplay";
import ProfileEditForm from "./ProfileEditForm";
import { ProfileFormData } from "@/types/profile";

export default function ProfileSection() {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || "",
      grade: profile?.grade || null,
      school: profile?.school || null,
      interested_majors: profile?.interested_majors?.join(", ") || "",
      graduation_school: profile?.graduation_school || null,
      background_intro: profile?.background_intro || null,
      social_media: {
        instagram: profile?.social_media?.instagram || "",
        linkedin: profile?.social_media?.linkedin || "",
        twitter: profile?.social_media?.twitter || "",
      },
      personal_website: profile?.personal_website || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        full_name: data.full_name,
        grade: data.grade,
        school: data.school,
        interested_majors: data.interested_majors.split(",").map(m => m.trim()),
        graduation_school: data.graduation_school,
        background_intro: data.background_intro,
        social_media: data.social_media,
        personal_website: data.personal_website,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const isCounselor = profile?.user_type === 'counselor';

  return (
    <>
      <ProfileDisplay profile={profile} onEdit={() => setIsEditing(true)} />

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-[90vw] w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileEditForm 
            form={form} 
            onSubmit={onSubmit}
            isCounselor={isCounselor}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}