
import { CriteriaDescriptions, UniversityType } from "./types";

export const IVY_LEAGUE_CRITERIA_DESCRIPTIONS: CriteriaDescriptions = {
  academics: {
    1: "学术顶尖，极具竞争力。GPA 4.0+（未加权），最具挑战性的课程（最多AP/IB课程），SAT 1580+/ACT 35-36，可能有学术论文、国际科研奖项或奥赛金牌。",
    2: "学术非常强。GPA 3.9-4.0，AP/IB课程9+，SAT 1550+/ACT 34+，在全国级学术竞赛中有优秀成绩或有科研经历。",
    3: "学术优秀，符合常青藤录取标准。GPA 3.8-3.9，AP/IB课程7+，SAT 1500+/ACT 33+，可能在州级学术竞赛中获奖或有较强的学术活动。",
    4: "学术具备竞争力，但未达顶尖水平。GPA 3.7-3.8，修过一定数量的高级课程，SAT 1450+/ACT 31+，但没有学术竞赛或研究经历。",
    5: "学术低于常青藤平均录取者水平。GPA 3.5-3.7，课程挑战性一般，SAT 1300-1450，学术表现一般，缺乏学术突破。",
    6: "学术远低于录取标准。GPA <3.5，课程挑战性低，SAT <1300，无学术亮点。"
  },
  extracurriculars: {
    1: "全国或国际级影响力。创办或领导全国性组织，在国际级比赛（ISEF、奥赛等）获奖，或在社交/公益/创业方面有广泛社会影响。",
    2: "州级或全国级影响力。担任重要领导职位（如全国性组织创始人、学生会主席），在全国竞赛中获奖（DECA、FBLA、AMC 10/12 金奖）。",
    3: "学校或地区级影响力。担任学生组织主席或领导（如校报主编、体育队长），或在州级比赛中获奖（州级科学展、州级辩论赛冠军）。",
    4: "持续参与但影响力有限。在学校组织中积极参与但未担任领导角色，或在地方性竞赛有一定成绩。",
    5: "参与度较低。加入了一些俱乐部或志愿活动但无长期投入或领导力。",
    6: "课外活动无亮点。几乎无活动参与，或仅在高年级加入一些俱乐部但未投入。"
  },
  athletics: {
    1: "NCAA级别运动员，有体育教练推荐。可能是全国或州级冠军，被常青藤体育队认可。",
    2: "优秀运动员，在州级或全国比赛中表现突出。可能是全州最佳球员，或在全国性体育赛事中获得奖项。",
    3: "高中校队主力选手，在地方比赛中有成绩。",
    4: "普通校队成员，未获显著奖项。",
    5: "参加过体育活动，但无正式校队经验。",
    6: "无运动参与。"
  },
  personalQualities: {
    1: "极具人格魅力、领导力、影响力。可能是社区变革者、创新者，在推荐信和个人文书中展现出色的使命感和社会责任感。",
    2: "展现卓越的领导力和人格魅力。推荐信和个人文书高度评价其影响力和团队合作精神。",
    3: "良好的人格品质和领导力。展现出较强的责任心和团队合作能力。",
    4: "普通个性，无明显领导力或影响力。推荐信评价较好，但缺乏突出特点。",
    5: "个性较弱，缺乏领导力或影响力。推荐信普通，没有展现出个人特色。",
    6: "个性存在问题。推荐信可能有负面评价，表现出不成熟或缺乏团队精神。"
  },
  recommendations: {
    1: "教师认为申请者是他们职业生涯中最杰出的学生之一。推荐信极力称赞，给出具体例证。",
    2: "推荐信非常强烈。展现申请者的领导力、人格魅力，给予高度评价。",
    3: "推荐信良好。对申请者给予正面评价，但缺乏独特性。",
    4: "推荐信普通。评价虽正面，但没有强调申请者的卓越之处。",
    5: "推荐信较弱。仅为一般评价，未能体现申请者亮点。",
    6: "推荐信有负面信息或非常普通。"
  },
  interview: {
    1: "面试表现极其出色。展现极强的沟通能力、亲和力、思辨能力，给人留下深刻印象。",
    2: "面试表现优秀。展现领导力、热情和对学校的极大兴趣。",
    3: "面试表现良好。交流流畅，但未特别突出。",
    4: "面试表现一般。未展现特别的个人魅力或优势。",
    5: "面试表现较差。未能有效表达自己，或对学校缺乏了解。",
    6: "面试表现糟糕。可能出现不尊重面试官、缺乏热情或沟通不畅等问题。"
  }
};

export const TOP30_CRITERIA_DESCRIPTIONS: CriteriaDescriptions = {
  academics: {
    1: "学术非常强。GPA 3.9+，AP/IB课程7+，SAT 1500+/ACT 33+，可能在全国级学术竞赛中有成绩。",
    2: "学术优秀。GPA 3.8-3.9，AP/IB课程5-7，SAT 1450+/ACT 31+，有特色的学术项目经历。",
    3: "学术良好，GPA 3.7-3.8，AP/IB课程4+，SAT 1400+/ACT 30+，学术表现稳定。",
    4: "学术中上。GPA 3.6-3.7，有一些AP/IB课程，SAT 1350+/ACT 28+，缺乏明显的学术特色。",
    5: "学术一般。GPA 3.3-3.6，少量高级课程，SAT 1250-1350，学业表现平平。",
    6: "学术低于录取标准。GPA <3.3，基础课程，SAT <1250，学业成绩不足。"
  },
  extracurriculars: {
    1: "州级或全国级影响力。担任重要领导职位，在区域或全国竞赛中获奖。",
    2: "学校或地区级领导力，在地区活动中表现突出，有持续性项目参与。",
    3: "校内活动积极参与者，可能有地区级竞赛经历，但影响力有限。",
    4: "参与多项活动，但未担任领导角色或取得明显成就。",
    5: "课外活动很少，无长期投入或显著表现。",
    6: "几乎没有课外活动参与经历。"
  },
  athletics: {
    1: "校队优秀运动员，可能在区域比赛中获奖。",
    2: "学校代表队成员，积极参与比赛。",
    3: "校队普通成员，有运动经历。",
    4: "参与校内非正式运动活动。",
    5: "很少参与体育活动。",
    6: "无体育经历。"
  },
  personalQualities: {
    1: "展现出色的领导力和创新精神，推荐信中有具体事例证明。",
    2: "个性鲜明，有一定领导能力，在团队中表现积极。",
    3: "良好的团队合作能力，积极参与社区活动。",
    4: "性格稳定，但无突出特点。",
    5: "个性较内向，参与度不高。",
    6: "人际交往或团队合作存在困难。"
  },
  recommendations: {
    1: "推荐信很强，提及具体优点和成就。",
    2: "推荐信正面，有力支持申请。",
    3: "推荐信良好，但可能缺乏具体例证。",
    4: "推荐信中规中矩，无特别亮点。",
    5: "推荐信较弱或过于笼统。",
    6: "推荐信内容平平或含有负面评价。"
  },
  interview: {
    1: "面试表现优秀，展现清晰的思路和良好的沟通能力。",
    2: "面试表现良好，能够自信表达。",
    3: "面试中等水平，回答基本问题无障碍。",
    4: "面试表现一般，缺乏深度思考。",
    5: "面试准备不足，回答不完整。",
    6: "面试表现差，沟通不畅或未能充分展示自己。"
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
    1: "State-level or regional athletic achievements recognized by UC coaches or recruitment.",
    2: "Significant athletic contributions at the school or district level, potential recruit interest.",
    3: "Regular participation in school athletics with demonstrated commitment.",
    4: "Some athletics participation without competitive distinction.",
    5: "Limited participation in sports or physical activities.",
    6: "No athletic involvement."
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
    1: "UC does not conduct interviews, but the application demonstrates exceptional communication skills and self-presentation.",
    2: "Application materials show excellent articulation of ideas and experiences.",
    3: "Good communication through written materials, clear expression of thoughts.",
    4: "Adequate self-expression in application materials.",
    5: "Unclear or imprecise communication in application materials.",
    6: "Poor communication skills evident in application materials."
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

