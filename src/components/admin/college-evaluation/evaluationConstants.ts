
import { CriteriaDescriptions, UniversityType } from "./types";

export const IVY_LEAGUE_CRITERIA_DESCRIPTIONS: CriteriaDescriptions = {
  academics: {
    1: "Outstanding academic profile. GPA 4.0+ (unweighted), most challenging courses (maximum AP/IB courses), SAT 1580+/ACT 35-36, potential academic papers, international research awards, or Olympiad gold medals.",
    2: "Very strong academic profile. GPA 3.9-4.0, 9+ AP/IB courses, SAT 1550+/ACT 34+, excellent performance in national academic competitions or research experience.",
    3: "Excellent academic profile, meets Ivy League standards. GPA 3.8-3.9, 7+ AP/IB courses, SAT 1500+/ACT 33+, possible state-level academic awards or strong academic activities.",
    4: "Competitive academics, but not top tier. GPA 3.7-3.8, some advanced courses, SAT 1450+/ACT 31+, but lacks academic competitions or research experience.",
    5: "Below average Ivy League applicant. GPA 3.5-3.7, ordinary course rigor, SAT 1300-1450, average academic performance, lacking academic distinction.",
    6: "Well below admission standards. GPA <3.5, low course rigor, SAT <1300, no academic highlights."
  },
  extracurriculars: {
    1: "National or international impact. Founded or led national organizations, won international competitions (ISEF, Olympiads), or made significant social impact through social/charitable/entrepreneurial work.",
    2: "State or national level impact. Held important leadership positions (e.g., founder of national organization, student body president), won national competitions (DECA, FBLA, AMC 10/12 gold).",
    3: "School or regional impact. Served as chair or leader of student organizations (e.g., newspaper editor-in-chief, sports team captain), or won state competitions (state science fair, state debate champion).",
    4: "Consistent participation but limited impact. Active in school organizations but without leadership roles, or has some achievements in local competitions.",
    5: "Low participation. Joined some clubs or volunteer activities but without long-term commitment or leadership.",
    6: "No extracurricular highlights. Almost no activity participation, or only joined some clubs in later grades without commitment."
  },
  athletics: {
    1: "NCAA level athlete with coach recommendation. Possibly a national or state champion, recognized by Ivy League athletic teams.",
    2: "Excellent athlete with outstanding performance in state or national competitions. Possibly a state MVP or award recipient in national sporting events.",
    3: "Key player on high school team with achievements in local competitions.",
    4: "Regular team member without significant awards.",
    5: "Participated in sports activities but without formal team experience.",
    6: "No athletic participation."
  },
  personalQualities: {
    1: "Exceptional charisma, leadership, and influence. Possibly a community change-maker, innovator, showing outstanding sense of mission and social responsibility in recommendations and personal essays.",
    2: "Demonstrates excellent leadership and charisma. Recommendation letters and personal essays highly praise their influence and team spirit.",
    3: "Good personal qualities and leadership. Shows strong sense of responsibility and teamwork abilities.",
    4: "Average personality, no obvious leadership or influence. Good recommendation letters but lacks distinctive characteristics.",
    5: "Weak personality, lacking leadership or influence. Ordinary recommendation letters without personal uniqueness.",
    6: "Personality issues. Recommendation letters may contain negative evaluations, showing immaturity or lack of team spirit."
  },
  recommendations: {
    1: "Teachers consider the applicant one of the most outstanding students in their career. Strongly supportive recommendations with specific examples.",
    2: "Very strong recommendation letters. Showcase applicant's leadership, charisma, and provide high evaluations.",
    3: "Good recommendation letters. Positive evaluations but lack uniqueness.",
    4: "Average recommendation letters. Positive but don't emphasize the applicant's excellence.",
    5: "Weak recommendation letters. Only general evaluations without highlighting applicant strengths.",
    6: "Recommendation letters contain negative information or are very ordinary."
  },
  interview: {
    1: "Exceptional interview performance. Demonstrates strong communication skills, approachability, critical thinking, and leaves a profound impression.",
    2: "Excellent interview performance. Shows leadership, enthusiasm, and strong interest in the school.",
    3: "Good interview performance. Communicates fluently but doesn't particularly stand out.",
    4: "Average interview performance. Fails to demonstrate special personal charm or strengths.",
    5: "Poor interview performance. Unable to express themselves effectively or lacks knowledge about the school.",
    6: "Terrible interview performance. Possibly shows disrespect to the interviewer, lacks enthusiasm, or has communication issues."
  }
};

export const TOP30_CRITERIA_DESCRIPTIONS: CriteriaDescriptions = {
  academics: {
    1: "Very strong academics. GPA 3.9+, 7+ AP/IB courses, SAT 1500+/ACT 33+, possibly with achievements in national academic competitions.",
    2: "Excellent academics. GPA 3.8-3.9, 5-7 AP/IB courses, SAT 1450+/ACT 31+, distinctive academic project experience.",
    3: "Good academics. GPA 3.7-3.8, 4+ AP/IB courses, SAT 1400+/ACT 30+, stable academic performance.",
    4: "Above average academics. GPA 3.6-3.7, some AP/IB courses, SAT 1350+/ACT 28+, lacking obvious academic distinctions.",
    5: "Average academics. GPA 3.3-3.6, few advanced courses, SAT 1250-1350, mediocre academic performance.",
    6: "Below admission standards. GPA <3.3, basic courses, SAT <1250, insufficient academic achievement."
  },
  extracurriculars: {
    1: "State or national level impact. Important leadership positions, awards in regional or national competitions.",
    2: "School or regional leadership, outstanding performance in regional activities, continuous project participation.",
    3: "Active participant in school activities, possibly with regional competition experience, but limited impact.",
    4: "Participates in multiple activities but without leadership roles or significant achievements.",
    5: "Very few extracurricular activities, no long-term commitment or significant performance.",
    6: "Almost no extracurricular activity experience."
  },
  athletics: {
    1: "Excellent school team athlete, possibly with awards in regional competitions.",
    2: "School representative team member, actively participates in competitions.",
    3: "Regular team member with athletic experience.",
    4: "Participates in informal school sports activities.",
    5: "Rarely participates in sports activities.",
    6: "No athletic experience."
  },
  personalQualities: {
    1: "Demonstrates outstanding leadership and innovation, with specific examples in recommendation letters.",
    2: "Distinctive personality, some leadership ability, active in teams.",
    3: "Good teamwork ability, actively participates in community activities.",
    4: "Stable personality but no outstanding characteristics.",
    5: "More introverted personality, low participation.",
    6: "Difficulties in interpersonal communication or teamwork."
  },
  recommendations: {
    1: "Strong recommendation letters mentioning specific strengths and achievements.",
    2: "Positive recommendation letters strongly supporting the application.",
    3: "Good recommendation letters but possibly lacking specific examples.",
    4: "Standard recommendation letters without special highlights.",
    5: "Weak or overly general recommendation letters.",
    6: "Mediocre recommendation letters or containing negative evaluations."
  },
  interview: {
    1: "Excellent interview performance showing clear thinking and good communication skills.",
    2: "Good interview performance, able to express confidently.",
    3: "Average interview level, no obstacles in answering basic questions.",
    4: "Average interview performance, lacking depth of thought.",
    5: "Inadequate interview preparation, incomplete answers.",
    6: "Poor interview performance, communication issues or inability to fully present oneself."
  }
};

export const UC_SYSTEM_CRITERIA_DESCRIPTIONS: CriteriaDescriptions = {
  academics: {
    1: "GPA 4.3-4.5 (UC Capped Weighted), extensive number of UC-approved honors/AP/IB courses, in the top 9% of CA high school class.",
    2: "GPA 4.0-4.3 (UC Capped Weighted), significant number of UC-approved honors/AP/IB courses, strong academic record within the state.",
    3: "GPA 3.8-4.0 (UC Capped Weighted), good number of UC-approved honors/AP courses, solid academic performance.",
    4: "GPA 3.6-3.8 (UC Capped Weighted), some honors/AP courses, meets UC academic requirements.",
    5: "GPA 3.4-3.6 (UC Capped Weighted), minimal honors/AP courses, meets minimum UC academic requirements.",
    6: "GPA <3.4 (UC Capped Weighted), may not fully satisfy UC's comprehensive review criteria."
  },
  extracurriculars: {
    1: "Significant, sustained involvement with depth and leadership impact at regional or state level. Shows initiative in creating opportunities.",
    2: "Consistent involvement in multiple activities over time, showing leadership and positive impact in the community.",
    3: "Active participation in school activities, some volunteer experience, demonstrates commitment.",
    4: "Some activity involvement but lacks depth or continuity. Limited leadership experience.",
    5: "Limited extracurricular activities with minimal engagement.",
    6: "Very few or no extracurricular activities."
  },
  athletics: {
    1: "Exceptional talent or skill in a specific area (arts, music, leadership, etc.) with state or national recognition.",
    2: "Strong development of a personal talent with awards or recognition at school or regional level.",
    3: "Clear demonstration of talent development with consistent practice and improvement.",
    4: "Some evidence of personal talent but limited recognition or achievement.",
    5: "Basic development of a talent or skill without significant accomplishments.",
    6: "No demonstrated personal talents or skills in application materials."
  },
  personalQualities: {
    1: "Exceptional demonstration of UC's comprehensive review factors: creativity, intellectual curiosity, leadership, and resilience. Compelling personal insight questions.",
    2: "Strong personal qualities aligned with UC values, meaningful contributions to community, clear goals.",
    3: "Good character traits, shows responsibility and growth potential in personal insight questions.",
    4: "Adequate personal qualities but lacks distinction. Basic personal insight questions.",
    5: "Limited evidence of personal development or character strengths in application.",
    6: "Concerning issues in personal character or minimal development shown in application materials."
  },
  recommendations: {
    1: "Outstanding Personal Insight Questions (PIQs) that clearly demonstrate the student's unique strengths and contributions.",
    2: "Strong PIQ responses that effectively communicate personal qualities and experiences.",
    3: "Competent PIQ responses that meet expectations but may lack distinctive elements.",
    4: "Adequate PIQ responses that fulfill basic requirements without depth.",
    5: "Below average PIQ responses that miss opportunities to highlight strengths.",
    6: "Poor quality PIQ responses with limited self-reflection or insight."
  },
  interview: {
    1: "Not applicable for UC System",
    2: "Not applicable for UC System",
    3: "Not applicable for UC System",
    4: "Not applicable for UC System",
    5: "Not applicable for UC System",
    6: "Not applicable for UC System"
  }
};

export function getUniversityCriteriaDescriptions(universityType: UniversityType): CriteriaDescriptions {
  switch (universityType) {
    case 'ivyLeague':
      return IVY_LEAGUE_CRITERIA_DESCRIPTIONS;
    case 'top30':
      return TOP30_CRITERIA_DESCRIPTIONS;
    case 'ucSystem':
      return UC_SYSTEM_CRITERIA_DESCRIPTIONS;
    default:
      return IVY_LEAGUE_CRITERIA_DESCRIPTIONS;
  }
}

