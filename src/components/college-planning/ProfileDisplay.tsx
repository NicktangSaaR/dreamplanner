import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit, Globe } from "lucide-react";
import { Profile } from "@/hooks/useProfile";

interface ProfileDisplayProps {
  profile: Profile | null;
  onEdit: () => void;
}

export default function ProfileDisplay({ profile, onEdit }: ProfileDisplayProps) {
  const isCounselor = profile?.user_type === 'counselor';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isCounselor ? "Counselor Profile" : "Student Profile"}</CardTitle>
        <Button onClick={onEdit} size="sm">
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
          {isCounselor ? (
            <>
              <div>
                <Label>Graduation School</Label>
                <p className="text-sm">{profile?.graduation_school || "Not set"}</p>
              </div>
              <div className="col-span-2">
                <Label>Background</Label>
                <p className="text-sm whitespace-pre-wrap">{profile?.background_intro || "Not set"}</p>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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
  );
}