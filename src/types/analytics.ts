export interface TimeAnalytics {
  submissionsByHour: Record<number, number>;
  submissionsByDayOfWeek: Record<number, number>;
  peakHour: number | null;
  peakDayOfWeek: number | null;
  avgTimeBetweenSubmissions: number; // in seconds
  last7DaysCount: number;
  last30DaysCount: number;
  weeklyGrowth: number; // percentage
  trendDirection: 'growing' | 'stable' | 'declining';
}

export interface FieldAnalytics {
  label: string;
  type: string;
  totalResponses: number;
  completionRate: number;
  emptyResponses: number;
  
  // Text/Textarea/Email fields
  avgLength?: number;
  avgWordCount?: number;
  minLength?: number;
  maxLength?: number;
  
  // Number fields
  min?: number;
  max?: number;
  avg?: number;
  median?: number;
  
  // Choice fields (select, radio, checkbox)
  distribution?: Record<string, number>;
  mostPopular?: string;
  leastPopular?: string;
  
  // Date fields
  earliestDate?: string;
  latestDate?: string;
  monthDistribution?: Record<string, number>;
  
  // File fields
  totalFiles?: number;
  fileTypes?: Record<string, number>;
  totalSize?: number;
  avgFileSize?: number;
}

export interface EngagementMetrics {
  overallCompletionRate: number;
  responseVelocity: number; // submissions per hour
  totalFields: number;
  requiredFields: number;
}

export interface EnhancedAnalytics {
  // Basic metrics
  totalSubmissions: number;
  submissionsByDate: Record<string, number>;
  avgPerDay: number;
  firstSubmission: string | null;
  lastSubmission: string | null;
  
  // Time-based analytics
  timeAnalytics: TimeAnalytics;
  
  // Field analytics
  fieldStats: Record<string, FieldAnalytics>;
  
  // Engagement metrics
  engagementMetrics: EngagementMetrics;
}





