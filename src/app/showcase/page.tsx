"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { BarChart } from "@/components/analytics/BarChart";
import { FieldAnalyticsCard } from "@/components/analytics/FieldAnalyticsCard";
import DragDropFormBuilder from "@/components/builder/DragDropFormBuilder";
import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import { EnhancedAnalytics } from "@/types/analytics";

// --- MOCK DATA: ANALYTICS ---
const mockAnalytics: EnhancedAnalytics = {
    totalSubmissions: 1248,
    avgPerDay: 42,
    firstSubmission: "2023-10-01T08:00:00Z",
    lastSubmission: "2023-11-25T14:30:00Z",
    submissionsByDate: {
        "2023-11-01": 12, "2023-11-02": 18, "2023-11-03": 25, "2023-11-04": 15, "2023-11-05": 30,
        "2023-11-06": 45, "2023-11-07": 52, "2023-11-08": 48, "2023-11-09": 60, "2023-11-10": 55,
        "2023-11-11": 35, "2023-11-12": 40, "2023-11-13": 75, "2023-11-14": 82, "2023-11-15": 90,
        "2023-11-16": 85, "2023-11-17": 78, "2023-11-18": 65, "2023-11-19": 70, "2023-11-20": 95,
        "2023-11-21": 110, "2023-11-22": 105, "2023-11-23": 115, "2023-11-24": 98, "2023-11-25": 42
    },
    timeAnalytics: {
        submissionsByHour: {
            9: 45, 10: 80, 11: 120, 12: 150, 13: 140, 14: 160, 15: 145, 16: 130, 17: 90
        },
        submissionsByDayOfWeek: {
            0: 50, 1: 180, 2: 210, 3: 240, 4: 200, 5: 190, 6: 80
        },
        peakHour: 14,
        peakDayOfWeek: 3,
        avgTimeBetweenSubmissions: 450,
        last7DaysCount: 685,
        last30DaysCount: 1248,
        weeklyGrowth: 15.4,
        trendDirection: 'growing'
    },
    engagementMetrics: {
        overallCompletionRate: 88.5,
        responseVelocity: 12.5,
        totalFields: 8,
        requiredFields: 5
    },
    fieldStats: {
        "f1": {
            label: "How satisfied are you with our product?",
            type: "rating",
            totalResponses: 1248,
            completionRate: 100,
            emptyResponses: 0,
            avg: 4.6,
            distribution: { "5": 850, "4": 300, "3": 80, "2": 15, "1": 3 }
        },
        "f2": {
            label: "Which features do you use most?",
            type: "checkbox",
            totalResponses: 1240,
            completionRate: 99,
            emptyResponses: 8,
            distribution: { "AI Builder": 980, "Analytics": 750, "Integrations": 400, "Templates": 600 },
            mostPopular: "AI Builder"
        },
        "f3": {
            label: "Would you recommend us?",
            type: "radio",
            totalResponses: 1248,
            completionRate: 100,
            emptyResponses: 0,
            distribution: { "Yes, definitely": 950, "Maybe": 250, "No": 48 },
            mostPopular: "Yes, definitely"
        }
    }
};

// --- MOCK DATA: FORM BUILDER ---
const mockFormFields: Field[] = [
    {
        id: "f1",
        label: "Product Name",
        type: "text",
        required: true,
        placeholder: "e.g., SuperWidget 3000",
        order: 0
    },
    {
        id: "f2",
        label: "Launch Date",
        type: "date",
        required: true,
        order: 1
    },
    {
        id: "f3",
        label: "Category",
        type: "select",
        required: true,
        options: ["SaaS", "Mobile App", "Hardware", "Developer Tool", "Productivity"],
        order: 2
    },
    {
        id: "f4",
        label: "Key Features",
        type: "checkboxes",
        required: false,
        options: ["AI Integration", "Real-time Collab", "Analytics Dashboard", "API Access", "Dark Mode"],
        order: 3
    },
    {
        id: "f5",
        label: "Upload Pitch Deck",
        type: "file",
        required: false,
        helpText: "PDF or PPTX max 25MB",
        order: 4
    },
    {
        id: "f6",
        label: "Pricing Model",
        type: "radio",
        required: true,
        options: ["Free", "Freemium", "Paid", "Enterprise"],
        order: 5
    }
];

const mockStyling: FormStyling = {
    primaryColor: "#3b82f6",
    backgroundColor: "#ffffff",
    buttonColor: "#0f172a",
    buttonTextColor: "#ffffff",
    fontFamily: "inter",
    buttonRadius: 8
};

export default function ShowcasePage() {
    const [view, setView] = useState<"analytics" | "builder">("analytics");

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Control Bar (Hide this when screenshotting if possible, or crop it out) */}
            <div className="fixed top-4 right-4 z-50 bg-white p-2 rounded-lg shadow border flex gap-2">
                <button
                    onClick={() => setView("analytics")}
                    className={`px-4 py-2 rounded-md font-medium ${view === "analytics" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                    Analytics View
                </button>
                <button
                    onClick={() => setView("builder")}
                    className={`px-4 py-2 rounded-md font-medium ${view === "builder" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                    Builder View
                </button>
            </div>

            {view === "analytics" && (
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2">Product Launch Feedback</h1>
                            <p className="text-slate-500 text-lg">Detailed analysis of your recent campaign</p>
                        </div>
                        <div className="bg-white border rounded-lg px-4 py-2 shadow-sm">
                            <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                                ● Live Data
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <AnalyticsCard
                            title="Total Responses"
                            value={mockAnalytics.totalSubmissions}
                            icon={<span className="text-2xl">📝</span>}
                            trend={{ value: 15.4, direction: 'up' }}
                            subtitle="All time submissions"
                        />
                        <AnalyticsCard
                            title="Avg Daily"
                            value={mockAnalytics.avgPerDay}
                            icon={<span className="text-2xl">📊</span>}
                            trend={{ value: 5.2, direction: 'up' }}
                            subtitle="Consistent growth"
                        />
                        <AnalyticsCard
                            title="Completion Rate"
                            value={`${mockAnalytics.engagementMetrics.overallCompletionRate}%`}
                            icon={<span className="text-2xl">✅</span>}
                            trend={{ value: 1.2, direction: 'up' }}
                            subtitle="High engagement"
                        />
                        <AnalyticsCard
                            title="Avg Time"
                            value="4m 12s"
                            icon={<span className="text-2xl">⏱️</span>}
                            subtitle="Time to complete"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-2">
                            <TimeSeriesChart
                                title="Response Volume (Last 30 Days)"
                                data={mockAnalytics.submissionsByDate}
                                color="#3b82f6"
                                height={320}
                            />
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <BarChart
                                title="Traffic by Day"
                                data={mockAnalytics.timeAnalytics.submissionsByDayOfWeek}
                                labels={{ 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }}
                                color="#8b5cf6"
                                height={200}
                            />
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                <h3 className="text-lg font-semibold opacity-90 mb-1">Peak Activity</h3>
                                <div className="text-3xl font-bold mb-4">Wednesday, 2 PM</div>
                                <p className="opacity-80 text-sm">Best time to send email campaigns to maximize response rates.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.values(mockAnalytics.fieldStats).map((stat) => (
                            <FieldAnalyticsCard
                                key={stat.label}
                                analytics={stat}
                                fieldId="mock"
                                totalSubmissions={mockAnalytics.totalSubmissions}
                            />
                        ))}
                    </div>
                </div>
            )}

            {view === "builder" && (
                <div className="h-screen bg-white">
                    <DragDropFormBuilder
                        formTitle="Launch Sign-up Form"
                        fields={mockFormFields}
                        styling={mockStyling}
                        notifications={{ enabled: true, email: { enabled: true, recipients: ["team@example.com"], includeSubmissionData: true } }}
                        multiStepConfig={{ enabled: false, steps: [], showProgressBar: true, allowBackNavigation: true }}
                        quizMode={{ enabled: false }}
                        limitOneResponse={false}
                        saveAndEdit={false}
                        currentFormId="mock-id"
                        onFormTitleChange={() => { }}
                        onFieldsChange={() => { }}
                        onStylingChange={() => { }}
                        onNotificationsChange={() => { }}
                        onMultiStepConfigChange={() => { }}
                        onQuizModeChange={() => { }}
                        onLimitOneResponseChange={() => { }}
                        onSaveAndEditChange={() => { }}
                        onSave={() => { }}
                        onCancel={() => { }}
                        saving={false}
                    />
                </div>
            )}
        </div>
    );
}
