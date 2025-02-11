
export interface RawProfile {
  social_media: any;
  career_interest_test: any;
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

  return {
    ...rawProfile,
    social_media: socialMedia,
    career_interest_test: careerInterestTest
  };
};
