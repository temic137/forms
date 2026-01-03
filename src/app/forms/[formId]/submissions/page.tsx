"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { Field } from "@/types/form";
import { EnhancedAnalytics } from "@/types/analytics";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { BarChart } from "@/components/analytics/BarChart";
import { FieldAnalyticsCard } from "@/components/analytics/FieldAnalyticsCard";
import ShareButton from "@/components/ShareButton";
import { QuizScore } from "@/lib/scoring";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
// import IntegrationButton from "@/components/IntegrationButton";

interface Submission {
  id: string;
  answersJson: Record<string, unknown>;
  score?: QuizScore | null;
  createdAt: string;
  files: Array<{
    id: string;
    fieldId: string;
    originalName: string;
    path: string;
  }>;
}

export default function SubmissionsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { status } = useSession();
  const router = useRouter();
  const [formId, setFormId] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<EnhancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'fields' | 'insights'>('responses');

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !formId) return "";
    return `${window.location.origin}/f/${formId}`;
  }, [formId]);

  useEffect(() => {
    params.then((p) => setFormId(p.formId));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setFormTitle(data.form.title);
        setFields(data.form.fields);
        setSubmissions(data.submissions);
      } else if (response.status === 401) {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  }, [formId, router]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, [formId]);

  useEffect(() => {
    if (status === "authenticated" && formId) {
      fetchSubmissions();
      fetchAnalytics();
    }
  }, [status, formId, fetchSubmissions, fetchAnalytics]);

  useEffect(() => {
    if (analytics) {
      setActiveTab('overview');
    }
  }, [analytics]);

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = fields.map((f) => f.label).join(",");
    const rows = submissions.map((submission) => {
      return fields
        .map((field) => {
          const value = submission.answersJson[field.id];
          return `"${String(value || "").replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formTitle}-submissions.csv`;
    a.click();
  };

  const exportToJSON = () => {
    const data = submissions.map((submission) => ({
      id: submission.id,
      submittedAt: submission.createdAt,
      answers: submission.answersJson,
      files: submission.files,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formTitle}-submissions.json`;
    a.click();
  };

  const copyToClipboard = () => {
    if (submissions.length === 0) return;

    const headers = fields.map((f) => f.label).join("\t");
    const rows = submissions.map((submission) => {
      return fields
        .map((field) => {
          const value = submission.answersJson[field.id];
          return String(value || "").replace(/\n/g, " ");
        })
        .join("\t");
    });

    const text = [headers, ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  const exportToExcel = () => {
    if (submissions.length === 0) return;

    const data = submissions.map((submission) => {
      const row: Record<string, unknown> = {
        'Submission ID': submission.id,
        'Submitted At': new Date(submission.createdAt).toLocaleString(),
      };

      if (submission.score) {
        row['Score'] = `${submission.score.percentage.toFixed(0)}%`;
        row['Passed'] = submission.score.passed ? 'Yes' : 'No';
      }

      fields.forEach((field) => {
        const value = submission.answersJson[field.id];
        if (field.type === 'file') {
          const files = submission.files.filter((f) => f.fieldId === field.id);
          row[field.label] = files.map((f) => f.originalName).join(', ');
        } else {
          row[field.label] = String(value || "");
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    XLSX.writeFile(workbook, `${formTitle}-submissions.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadSubmissionPDF = async () => {
    // Create a new PDF document
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Add Title
    pdf.setFontSize(16);
    pdf.text(`Response #${submissions.indexOf(selectedSubmission!) + 1}`, margin, yPosition);
    yPosition += 10;

    // Add Submission Date
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Submitted: ${new Date(selectedSubmission!.createdAt).toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    // Add Score if exists
    if (selectedSubmission?.score) {
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text(`Score: ${selectedSubmission.score.percentage.toFixed(0)}% (${selectedSubmission.score.passed ? 'Passed' : 'Failed'})`, margin, yPosition);
      yPosition += 15;
    }

    // Add Fields and Answers
    pdf.setFontSize(12);
    pdf.setTextColor(0);

    fields.forEach((field) => {
      // Check for page break
      if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      // Field Label
      pdf.setFont("helvetica", "bold");
      const labelLines = pdf.splitTextToSize(field.label, pageWidth - (margin * 2));
      pdf.text(labelLines, margin, yPosition);
      yPosition += (labelLines.length * 7);

      // Field Value
      pdf.setFont("helvetica", "normal");
      let valueText = "";

      if (field.type === 'file') {
        const files = selectedSubmission!.files.filter((f) => f.fieldId === field.id);
        valueText = files.map(f => f.originalName).join(', ') || "(No files)";
      } else {
        valueText = String(selectedSubmission!.answersJson[field.id] || "—");
      }

      const valueLines = pdf.splitTextToSize(valueText, pageWidth - (margin * 2));
      pdf.text(valueLines, margin, yPosition);
      yPosition += (valueLines.length * 7) + 10; // Add spacing between fields
    });

    pdf.save(`submission-${selectedSubmission?.id}.pdf`);
  };

  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-paper paper-texture font-paper"
      >
        <div className="flex items-center gap-3 text-black/60">
          <Spinner size="lg" variant="primary" />
          <span className="font-bold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-paper paper-texture bg-paper">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="paper-button p-2 bg-white text-black border-2 border-black/20 hover:border-black/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold mb-1 text-black">
                {formTitle}
              </h1>
              <p className="text-sm text-black/60 font-bold">
                {submissions.length} response{submissions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {formId && (
            <div className="flex items-center gap-2">
              {/* <IntegrationButton formId={formId} /> */}
              <ShareButton url={shareUrl || undefined} label="Share" />
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
            {analytics && (
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-bold transition-all whitespace-nowrap text-sm rounded-lg border-2 ${activeTab === 'overview'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black/10 hover:border-black/30'
                  }`}
              >
                Overview
              </button>
            )}
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-4 py-2 font-bold transition-all whitespace-nowrap text-sm rounded-lg border-2 ${activeTab === 'responses'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black/10 hover:border-black/30'
                }`}
            >
              Responses
            </button>
            {analytics && (
              <>
                <button
                  onClick={() => setActiveTab('fields')}
                  className={`px-4 py-2 font-bold transition-all whitespace-nowrap text-sm rounded-lg border-2 ${activeTab === 'fields'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black/10 hover:border-black/30'
                    }`}
                >
                  Field Analytics
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`px-4 py-2 font-bold transition-all whitespace-nowrap text-sm rounded-lg border-2 ${activeTab === 'insights'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black/10 hover:border-black/30'
                    }`}
                >
                  Time Insights
                </button>
              </>
            )}
          </div>
        </div>

        {/* Analytics Content */}
        {analytics && activeTab === 'overview' && (
          <div className="space-y-8 mb-8">
            {/* Quiz Performance (if available) */}
            {analytics.quizAnalytics && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold font-paper text-black">
                  Quiz Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <AnalyticsCard
                    title="Average Score"
                    value={`${analytics.quizAnalytics.averageScore}%`}
                    icon={
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    subtitle={`Median: ${analytics.quizAnalytics.medianScore}%`}
                  />
                  <AnalyticsCard
                    title="Pass Rate"
                    value={`${analytics.quizAnalytics.passRate}%`}
                    icon={
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    subtitle="Students passed"
                  />
                  <AnalyticsCard
                    title="Highest Score"
                    value={`${analytics.quizAnalytics.topScore}%`}
                    icon={
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    }
                    subtitle={`Lowest: ${analytics.quizAnalytics.lowScore}%`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <BarChart
                    title="Score Distribution"
                    data={analytics.quizAnalytics.scoreDistribution}
                    color="#000000"
                    height={300}
                  />
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AnalyticsCard
                title="Total Responses"
                value={analytics.totalSubmissions}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                trend={
                  analytics.timeAnalytics.weeklyGrowth !== 0 ? {
                    value: analytics.timeAnalytics.weeklyGrowth,
                    direction: analytics.timeAnalytics.weeklyGrowth > 0 ? 'up' : 'down',
                  } : undefined
                }
                subtitle="Weekly growth"
              />

              <AnalyticsCard
                title="Avg per Day"
                value={analytics.avgPerDay}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                subtitle={`Trend: ${analytics.timeAnalytics.trendDirection}`}
              />

              <AnalyticsCard
                title="Completion Rate"
                value={`${Math.round(analytics.engagementMetrics.overallCompletionRate)}%`}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                subtitle="Required fields filled"
              />

              <AnalyticsCard
                title="Last 7 Days"
                value={analytics.timeAnalytics.last7DaysCount}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                subtitle={`${analytics.timeAnalytics.last30DaysCount} in last 30 days`}
              />
            </div>

            {/* Submissions Over Time */}
            <TimeSeriesChart
              title="Submissions Over Time"
              data={analytics.submissionsByDate}
              color="#000000"
              height={250}
            />

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="paper-card p-6 border-2 border-black/10 bg-white">
                <h4 className="text-lg font-bold font-paper mb-4 text-black">Response Velocity</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-black/10">
                    <span className="text-sm font-bold font-paper text-black/60">Submissions per Hour</span>
                    <span className="text-sm font-bold font-paper text-black">
                      {analytics.engagementMetrics.responseVelocity.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-bold font-paper text-black/60">Avg Time Between</span>
                    <span className="text-sm font-bold font-paper text-black">
                      {analytics.timeAnalytics.avgTimeBetweenSubmissions < 3600
                        ? `${Math.round(analytics.timeAnalytics.avgTimeBetweenSubmissions / 60)} min`
                        : `${(analytics.timeAnalytics.avgTimeBetweenSubmissions / 3600).toFixed(1)} hrs`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="paper-card p-6 border-2 border-black/10 bg-white">
                <h4 className="text-lg font-bold font-paper mb-4 text-black">Form Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-black/10">
                    <span className="text-sm font-bold font-paper text-black/60">Total Fields</span>
                    <span className="text-sm font-bold font-paper text-black">
                      {analytics.engagementMetrics.totalFields}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-black/10">
                    <span className="text-sm font-bold font-paper text-black/60">Required Fields</span>
                    <span className="text-sm font-bold font-paper text-black">
                      {analytics.engagementMetrics.requiredFields}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-black/10">
                    <span className="text-sm font-bold font-paper text-black/60">First Response</span>
                    <span className="text-sm font-bold font-paper text-black">
                      {analytics.firstSubmission
                        ? new Date(analytics.firstSubmission).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-bold font-paper text-black/60">Latest Response</span>
                    <span className="text-sm font-bold font-paper text-black">
                      {analytics.lastSubmission
                        ? new Date(analytics.lastSubmission).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Field Analytics Tab */}
        {analytics && activeTab === 'fields' && (
          <div className="space-y-6 mb-8">
            <div className="text-sm font-bold font-paper text-black/60">
              Detailed analytics for each field in your form
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analytics.fieldStats).map(([fieldId, fieldAnalytics]) => (
                <FieldAnalyticsCard
                  key={fieldId}
                  fieldId={fieldId}
                  analytics={fieldAnalytics}
                  totalSubmissions={analytics.totalSubmissions}
                />
              ))}
            </div>
          </div>
        )}

        {/* Time Insights Tab */}
        {analytics && activeTab === 'insights' && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BarChart
                title="Submissions by Hour of Day"
                data={analytics.timeAnalytics.submissionsByHour}
                labels={{
                  0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
                  6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
                  12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
                  18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
                }}
                color="#000000"
                height={350}
              />

              <BarChart
                title="Submissions by Day of Week"
                data={analytics.timeAnalytics.submissionsByDayOfWeek}
                labels={{
                  0: 'Sunday',
                  1: 'Monday',
                  2: 'Tuesday',
                  3: 'Wednesday',
                  4: 'Thursday',
                  5: 'Friday',
                  6: 'Saturday',
                }}
                color="#4b5563"
                height={350}
              />
            </div>

            <div className="mt-6 py-4 border-t border-black/10">
              <h4 className="text-lg font-bold font-paper mb-4 text-black">Peak Activity Times</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="paper-card p-4 border-2 border-black/10 bg-white">
                  <div className="text-xs uppercase tracking-wide mb-1 font-bold font-paper text-black/60">
                    Peak Hour
                  </div>
                  <div className="text-xl font-bold font-paper text-black">
                    {analytics.timeAnalytics.peakHour !== null
                      ? analytics.timeAnalytics.peakHour === 0
                        ? '12 AM'
                        : analytics.timeAnalytics.peakHour < 12
                          ? `${analytics.timeAnalytics.peakHour} AM`
                          : analytics.timeAnalytics.peakHour === 12
                            ? '12 PM'
                            : `${analytics.timeAnalytics.peakHour - 12} PM`
                      : 'N/A'}
                  </div>
                  <div className="text-xs mt-1 font-bold font-paper text-black/60">
                    Most submissions received
                  </div>
                </div>

                <div className="paper-card p-4 border-2 border-black/10 bg-white">
                  <div className="text-xs uppercase tracking-wide mb-1 font-bold font-paper text-black/60">
                    Peak Day
                  </div>
                  <div className="text-xl font-bold font-paper text-black">
                    {analytics.timeAnalytics.peakDayOfWeek !== null
                      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][analytics.timeAnalytics.peakDayOfWeek]
                      : 'N/A'}
                  </div>
                  <div className="text-xs mt-1 font-bold font-paper text-black/60">
                    Most active day of week
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        {activeTab === 'responses' && submissions.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
            <button
              onClick={exportToCSV}
              className="paper-button px-4 py-2 bg-white text-black border-2 border-black/10 hover:border-black/30 font-bold font-paper"
            >
              Export as CSV
            </button>
            <button
              onClick={exportToExcel}
              className="paper-button px-4 py-2 bg-white text-black border-2 border-black/10 hover:border-black/30 font-bold font-paper"
            >
              Export to Excel
            </button>
            <button
              onClick={copyToClipboard}
              className="paper-button px-4 py-2 bg-white text-black border-2 border-black/10 hover:border-black/30 font-bold font-paper"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={exportToJSON}
              className="paper-button px-4 py-2 bg-white text-black border-2 border-black/10 hover:border-black/30 font-bold font-paper"
            >
              Export as JSON
            </button>
            <button
              onClick={handlePrint}
              className="paper-button px-4 py-2 bg-white text-black border-2 border-black/10 hover:border-black/30 font-bold font-paper"
            >
              Print / PDF
            </button>
          </div>
        )}

        {/* Submissions List */}
        {activeTab === 'responses' && (
          submissions.length === 0 ? (
            <div className="text-center py-12 font-paper">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 mx-auto text-black/20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-bold mb-1 text-black"
              >
                No responses yet
              </h3>
              <p className="text-sm text-black/60 font-bold">
                Share your form to start collecting responses
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border-2 border-black/10 bg-white paper-card">
              <table className="w-full text-left text-sm font-paper">
                <thead className="bg-black/5 text-black/60 font-bold">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 whitespace-nowrap">Submitted At</th>
                    {analytics?.quizAnalytics && (
                      <th className="px-4 py-3 whitespace-nowrap">Score</th>
                    )}
                    {fields.map((field) => (
                      <th key={field.id} className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {submissions.map((submission, index) => (
                    <tr
                      key={submission.id}
                      className="group transition-colors hover:bg-black/5 cursor-pointer"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-black">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-black/60">
                        {new Date(submission.createdAt).toLocaleString()}
                      </td>
                      {analytics?.quizAnalytics && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {submission.score ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${submission.score.passed
                                ? 'bg-white text-black border-black'
                                : 'bg-black text-white border-black'
                                }`}
                            >
                              {submission.score.percentage.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-black/40">-</span>
                          )}
                        </td>
                      )}
                      {fields.map((field) => (
                        <td
                          key={field.id}
                          className="px-4 py-3 max-w-[200px] truncate font-bold text-black"
                        >
                          {field.type === 'file' ? (
                            <span className="text-xs opacity-70">
                              {submission.files.filter(f => f.fieldId === field.id).length} file(s)
                            </span>
                          ) : (
                            String(submission.answersJson[field.id] || '—')
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(submission);
                          }}
                          className="p-1 rounded hover:bg-black/10 transition-colors text-black/40 hover:text-black"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              id="submission-modal-content"
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="paper-card p-6 border-2 border-black/10 bg-white">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold font-paper text-black">
                      Response #{submissions.indexOf(selectedSubmission) + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadSubmissionPDF}
                        className="p-2 rounded-lg transition-all hover:bg-black/5 text-black/60 hover:text-black"
                        title="Download as PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setSelectedSubmission(null)}
                        className="p-2 rounded-lg transition-all hover:bg-black/5 text-black/60 hover:text-black"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-bold font-paper text-black/60">
                    Submitted: {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </div>
                  {selectedSubmission.score && (
                    <div
                      className="mt-4 p-4 rounded-lg border-2 border-black/10 bg-black/5"
                    >
                      <div className="flex items-center justify-between mb-2 font-paper font-bold">
                        <span className="text-black">
                          Quiz Score
                        </span>
                        <span
                          className="text-2xl"
                          style={{ color: selectedSubmission.score.passed ? '#000000' : '#000000' }}
                        >
                          {selectedSubmission.score.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm space-y-1 font-paper font-bold text-black/60">
                        <div>Points: {selectedSubmission.score.earnedPoints.toFixed(1)} / {selectedSubmission.score.totalPoints}</div>
                        <div>
                          Status:{' '}
                          <span className="text-black">
                            {selectedSubmission.score.passed ? 'Passed ✓' : 'Not Passed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <div key={field.id}>
                        <div
                          className="text-sm font-bold font-paper mb-1 text-black/60"
                        >
                          {field.label}
                        </div>
                        <div className="font-paper font-bold text-black">
                          {field.type === 'file' ? (
                            <div className="space-y-2">
                              {selectedSubmission.files
                                .filter((f) => f.fieldId === field.id)
                                .map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-3 py-2 rounded-lg transition-all border-2 border-black/10 hover:border-black/30 bg-white"
                                  >
                                    📎 {file.originalName}
                                  </a>
                                ))}
                            </div>
                          ) : (
                            String(selectedSubmission.answersJson[field.id] || '—')
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
