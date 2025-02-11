
export default function About() {
  return (
    <div className="container mx-auto px-4 py-12">
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
          <h2 className="text-3xl font-bold mb-6">About Developer</h2>
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
    </div>
  );
}
