const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const Job = require('../models/Job');

exports.summary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [apps, resumes, interviews, jobs] = await Promise.all([
      Application.find({ userId }).sort({ createdAt: -1 }),
      Resume.find({ userId }).select('score createdAt skills').sort({ createdAt: 1 }),
      Interview.find({ userId, status: 'completed' }).select('score role createdAt').sort({ createdAt: 1 }),
      Job.find({ userId }).select('matchScore missingSkills createdAt'),
    ]);

    const statuses = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
    const statusCounts = Object.fromEntries(statuses.map((s) => [s, 0]));
    apps.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

    // Funnel is cumulative: an offer also passed screening and interview.
    const reached = (list) => apps.filter((a) => list.includes(a.status)).length;
    const funnel = [
      { stage: 'Applied', count: reached(['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']) },
      { stage: 'Screening', count: reached(['Screening', 'Interview', 'Offer']) },
      { stage: 'Interview', count: reached(['Interview', 'Offer']) },
      { stage: 'Offer', count: reached(['Offer']) },
    ];

    // Applications per month.
    const byMonth = {};
    apps.forEach((a) => {
      const d = new Date(a.applicationDate || a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const overTime = Object.keys(byMonth).sort().map((month) => ({ month, count: byMonth[month] }));

    // Skills distribution from the latest resume.
    const latest = resumes[resumes.length - 1];
    // Skills the user has vs. skills that keep showing up as missing in job matches.
    const have = latest ? latest.skills : [];
    const missingCounts = {};
    jobs.forEach((j) => j.missingSkills.forEach((s) => { missingCounts[s] = (missingCounts[s] || 0) + 1; }));
    const topMissing = Object.entries(missingCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const interviewedCount = statusCounts.Interview + statusCounts.Offer;
    const appliedTotal = funnel[0].count;

    res.json({
      totals: {
        applications: apps.length,
        interviews: interviewedCount,
        offers: statusCounts.Offer,
      },
      statusCounts,
      funnel,
      overTime,
      interviewConversion: {
        applied: appliedTotal,
        interviewed: interviewedCount,
        rate: appliedTotal ? Math.round((interviewedCount / appliedTotal) * 100) : 0,
      },
      skills: have,
      topMissingSkills: topMissing,
      resumeScoreHistory: resumes.map((r) => ({ date: r.createdAt, score: r.score })),
      interviewScoreHistory: interviews.map((i) => ({ date: i.createdAt, score: i.score, role: i.role })),
      recentApplications: apps.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
};
