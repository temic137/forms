
import { AnalyticsCard } from "@/components/analytics";

export default function AnalyticsPage() {
  // Dummy data for illustration
  const stats = [
    { title: 'Total Views', value: '1,402' },
    { title: 'Submissions', value: '356' },
    { title: 'Conversion Rate', value: '25.4%' },
    { title: 'Average Time', value: '1m 24s' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold text-black mb-8 font-paper text-center">
        Form Analytics
      </h1>
      
      {/* Responsive Grid for Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <AnalyticsCard key={stat.title} title={stat.title} value={stat.value} />
        ))}
      </div>

      {/* Other analytics components would go here */}
      <div className="mt-8">
        {/* e.g., <SubmissionChart /> */}
      </div>
    </div>
  );
}