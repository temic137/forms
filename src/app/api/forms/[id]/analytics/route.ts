import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: formId } = await context.params;

    // Verify form belongs to user and get form fields
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { 
        userId: true,
        fieldsJson: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get submissions with files
    const submissions = await prisma.submission.findMany({
      where: { formId },
      select: {
        id: true,
        createdAt: true,
        answersJson: true,
        score: true,
        files: {
          select: {
            size: true,
            mimeType: true,
            fieldId: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalSubmissions = submissions.length;
    const fields = form.fieldsJson as Array<{ id: string; label: string; type: string; required?: boolean; options?: string[] }>;

    // ===== BASIC METRICS =====
    const submissionsByDate: Record<string, number> = {};
    const submissionsByHour: Record<number, number> = {};
    const submissionsByDayOfWeek: Record<number, number> = {};
    
    submissions.forEach((submission) => {
      const date = new Date(submission.createdAt);
      const dateStr = date.toLocaleDateString();
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      submissionsByDate[dateStr] = (submissionsByDate[dateStr] || 0) + 1;
      submissionsByHour[hour] = (submissionsByHour[hour] || 0) + 1;
      submissionsByDayOfWeek[dayOfWeek] = (submissionsByDayOfWeek[dayOfWeek] || 0) + 1;
    });

    // ===== TIME-BASED ANALYTICS =====
    const dates = Object.keys(submissionsByDate).sort();
    const avgPerDay = dates.length > 0 ? totalSubmissions / dates.length : 0;
    
    // Peak submission hour
    const peakHour = Object.entries(submissionsByHour)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
    
    // Peak day of week (0 = Sunday, 6 = Saturday)
    const peakDayOfWeek = Object.entries(submissionsByDayOfWeek)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
    
    // Recent activity (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentSubmissions = submissions.filter(s => new Date(s.createdAt) >= last7Days).length;
    const previousWeekSubmissions = submissions.filter(s => {
      const date = new Date(s.createdAt);
      return date >= last14Days && date < last7Days;
    }).length;
    
    const weeklyGrowth = previousWeekSubmissions > 0
      ? ((recentSubmissions - previousWeekSubmissions) / previousWeekSubmissions) * 100
      : recentSubmissions > 0 ? 100 : 0;

    // Last 30 days activity
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30DaysSubmissions = submissions.filter(s => new Date(s.createdAt) >= last30Days).length;

    // Average time between submissions
    const timeDiffs: number[] = [];
    for (let i = 1; i < submissions.length; i++) {
      const diff = new Date(submissions[i].createdAt).getTime() - new Date(submissions[i - 1].createdAt).getTime();
      timeDiffs.push(diff);
    }
    const avgTimeBetweenSubmissions = timeDiffs.length > 0
      ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
      : 0;

    // ===== FIELD-SPECIFIC ANALYTICS =====
    const fieldStats: Record<string, any> = {};
    
    fields.forEach((field) => {
      const fieldId = field.id;
      const fieldType = field.type;
      const responses = submissions.map(s => (s.answersJson as Record<string, any>)[fieldId]).filter(v => v !== undefined && v !== null && v !== '');
      
      const stat: any = {
        label: field.label,
        type: fieldType,
        totalResponses: responses.length,
        completionRate: totalSubmissions > 0 ? (responses.length / totalSubmissions) * 100 : 0,
        emptyResponses: totalSubmissions - responses.length,
      };

      // Type-specific analytics
      if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'email') {
        const textResponses = responses.filter(r => typeof r === 'string');
        const lengths = textResponses.map(r => r.length);
        const wordCounts = textResponses.map(r => r.split(/\s+/).filter(w => w.length > 0).length);
        
        stat.avgLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
        stat.avgWordCount = wordCounts.length > 0 ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;
        stat.minLength = lengths.length > 0 ? Math.min(...lengths) : 0;
        stat.maxLength = lengths.length > 0 ? Math.max(...lengths) : 0;
      } else if (fieldType === 'number') {
        const numResponses = responses.map(r => Number(r)).filter(n => !isNaN(n));
        
        if (numResponses.length > 0) {
          const sorted = [...numResponses].sort((a, b) => a - b);
          stat.min = sorted[0];
          stat.max = sorted[sorted.length - 1];
          stat.avg = numResponses.reduce((a, b) => a + b, 0) / numResponses.length;
          stat.median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        }
      } else if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
        // Choice distribution
        const distribution: Record<string, number> = {};
        responses.forEach(r => {
          const value = Array.isArray(r) ? r.join(', ') : String(r);
          distribution[value] = (distribution[value] || 0) + 1;
        });
        
        stat.distribution = distribution;
        stat.mostPopular = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
        stat.leastPopular = Object.entries(distribution)
          .sort(([, a], [, b]) => a - b)[0]?.[0] || null;
      } else if (fieldType === 'date') {
        const dateResponses = responses.map(r => new Date(String(r))).filter(d => !isNaN(d.getTime()));
        
        if (dateResponses.length > 0) {
          const sorted = [...dateResponses].sort((a, b) => a.getTime() - b.getTime());
          stat.earliestDate = sorted[0].toISOString();
          stat.latestDate = sorted[sorted.length - 1].toISOString();
          
          // Date distribution by month
          const monthDistribution: Record<string, number> = {};
          dateResponses.forEach(d => {
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthDistribution[monthKey] = (monthDistribution[monthKey] || 0) + 1;
          });
          stat.monthDistribution = monthDistribution;
        }
      } else if (fieldType === 'file') {
        // File upload analytics
        const fileUploads = submissions.flatMap(s => 
          s.files.filter(f => f.fieldId === fieldId)
        );
        
        const fileTypes: Record<string, number> = {};
        let totalSize = 0;
        
        fileUploads.forEach(file => {
          const type = file.mimeType.split('/')[0] || 'other';
          fileTypes[type] = (fileTypes[type] || 0) + 1;
          totalSize += file.size;
        });
        
        stat.totalFiles = fileUploads.length;
        stat.fileTypes = fileTypes;
        stat.totalSize = totalSize;
        stat.avgFileSize = fileUploads.length > 0 ? totalSize / fileUploads.length : 0;
      }

      fieldStats[fieldId] = stat;
    });

    // ===== ENGAGEMENT METRICS =====
    // Completion rate (percentage of required fields filled)
    const requiredFields = fields.filter(f => f.required);
    let totalRequiredFieldsFilled = 0;
    let totalRequiredFieldsExpected = requiredFields.length * totalSubmissions;
    
    submissions.forEach(submission => {
      const answers = submission.answersJson as Record<string, any>;
      requiredFields.forEach(field => {
        const value = answers[field.id];
        if (value !== undefined && value !== null && value !== '') {
          totalRequiredFieldsFilled++;
        }
      });
    });
    
    const overallCompletionRate = totalRequiredFieldsExpected > 0
      ? (totalRequiredFieldsFilled / totalRequiredFieldsExpected) * 100
      : 100;

    // Response velocity (submissions per hour during active periods)
    const submissionTimes = submissions.map(s => new Date(s.createdAt).getTime());
    const firstSubmissionTime = submissionTimes[0];
    const lastSubmissionTime = submissionTimes[submissionTimes.length - 1];
    const activeHours = (lastSubmissionTime - firstSubmissionTime) / (1000 * 60 * 60);
    const responseVelocity = activeHours > 0 ? totalSubmissions / activeHours : 0;

    // ===== TREND ANALYSIS =====
    // Calculate trend direction (last 5 vs previous 5 submissions dates)
    let trendDirection = 'stable';
    if (dates.length >= 10) {
      const recentDates = dates.slice(-5);
      const previousDates = dates.slice(-10, -5);
      
      const recentAvg = recentDates.reduce((sum, date) => sum + submissionsByDate[date], 0) / 5;
      const previousAvg = previousDates.reduce((sum, date) => sum + submissionsByDate[date], 0) / 5;
      
      if (recentAvg > previousAvg * 1.2) trendDirection = 'growing';
      else if (recentAvg < previousAvg * 0.8) trendDirection = 'declining';
    }

    // ===== QUIZ ANALYTICS =====
    let quizAnalytics: any = undefined;
    const scoredSubmissions = submissions.filter(s => s.score && typeof s.score === 'object');
    
    if (scoredSubmissions.length > 0) {
      const scores = scoredSubmissions.map(s => (s.score as any).percentage || 0);
      const passedCount = scoredSubmissions.filter(s => (s.score as any).passed).length;
      
      const scoreDistribution: Record<string, number> = {};
      // Initialize buckets
      for (let i = 0; i < 100; i += 10) {
        scoreDistribution[`${i}-${i + 10}%`] = 0;
      }
      
      scores.forEach(score => {
        const rangeStart = Math.min(Math.floor(score / 10) * 10, 90);
        const bucket = `${rangeStart}-${rangeStart + 10}%`;
        scoreDistribution[bucket] = (scoreDistribution[bucket] || 0) + 1;
      });

      const sumScores = scores.reduce((a, b) => a + b, 0);
      const sortedScores = [...scores].sort((a, b) => a - b);

      quizAnalytics = {
        averageScore: Math.round(sumScores / scores.length),
        medianScore: sortedScores.length % 2 === 0 
          ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2 
          : sortedScores[Math.floor(sortedScores.length / 2)],
        passRate: Math.round((passedCount / scoredSubmissions.length) * 100),
        topScore: sortedScores[sortedScores.length - 1],
        lowScore: sortedScores[0],
        scoreDistribution
      };
    }

    // ===== RETURN ENHANCED ANALYTICS =====
    return NextResponse.json({
      // Basic metrics
      totalSubmissions,
      submissionsByDate,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      firstSubmission: submissions[0]?.createdAt || null,
      lastSubmission: submissions[submissions.length - 1]?.createdAt || null,
      
      // Time-based analytics
      timeAnalytics: {
        submissionsByHour,
        submissionsByDayOfWeek,
        peakHour: peakHour ? parseInt(peakHour) : null,
        peakDayOfWeek: peakDayOfWeek ? parseInt(peakDayOfWeek) : null,
        avgTimeBetweenSubmissions: Math.round(avgTimeBetweenSubmissions / 1000), // in seconds
        last7DaysCount: recentSubmissions,
        last30DaysCount: last30DaysSubmissions,
        weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
        trendDirection,
      },
      
      // Field analytics
      fieldStats,
      
      // Engagement metrics
      engagementMetrics: {
        overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
        responseVelocity: Math.round(responseVelocity * 100) / 100, // submissions per hour
        totalFields: fields.length,
        requiredFields: requiredFields.length,
      },

      // Quiz analytics
      quizAnalytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
