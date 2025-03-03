
export interface RawProfile {
  id: string;
  user_type: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
  social_media: any;
  personal_website: string | null;
  graduation_school: string | null;
  background_intro: string | null;
  application_year: string | null;
  career_interest_test: any;
  email: string | null;
  status: string | null;
  [key: string]: any;
}

export const transformProfile = (rawProfile: RawProfile | null) => {
  if (!rawProfile) return null;
  
  let socialMedia = null;
  try {
    if (rawProfile.social_media) {
      if (typeof rawProfile.social_media === 'string') {
        socialMedia = JSON.parse(rawProfile.social_media);
      } else {
        socialMedia = rawProfile.social_media;
      }
    }
  } catch (error) {
    console.error("Error parsing social_media:", error);
    socialMedia = null;
  }

  let careerInterestTest = null;
  try {
    if (rawProfile.career_interest_test) {
      if (typeof rawProfile.career_interest_test === 'string') {
        careerInterestTest = JSON.parse(rawProfile.career_interest_test);
      } else {
        careerInterestTest = rawProfile.career_interest_test;
      }
    }
  } catch (error) {
    console.error("Error parsing career_interest_test:", error);
    careerInterestTest = null;
  }

  // Return a properly typed profile object
  return {
    id: rawProfile.id,
    user_type: rawProfile.user_type,
    full_name: rawProfile.full_name,
    grade: rawProfile.grade,
    school: rawProfile.school,
    interested_majors: rawProfile.interested_majors,
    social_media: socialMedia,
    personal_website: rawProfile.personal_website,
    graduation_school: rawProfile.graduation_school,
    background_intro: rawProfile.background_intro,
    application_year: rawProfile.application_year,
    career_interest_test: careerInterestTest,
    email: rawProfile.email,
    status: rawProfile.status,
    created_at: rawProfile.created_at,
    updated_at: rawProfile.updated_at
  };
};
