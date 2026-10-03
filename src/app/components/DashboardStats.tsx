import React from "react";

interface DashboardStatsProps {
  stats: {
    total: number;
    PENDING: number;
    INTERVIEW: number;
    REJECTED: number;
    HIRED: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  // Explicitly added the 'Rejected' card to show the brutal reality
  const statCards = [
    {
      title: "Total Applications",
      value: stats.total,
      titleColor: "text-slate-500",
      numColor: "text-slate-900",
    },
    {
      title: "Pending",
      value: stats.PENDING,
      titleColor: "text-amber-600",
      numColor: "text-amber-700",
    },
    {
      title: "Interviews Lined Up",
      value: stats.INTERVIEW,
      titleColor: "text-blue-600",
      numColor: "text-blue-700",
    },
    {
      title: "Rejected",
      value: stats.REJECTED,
      titleColor: "text-red-600",
      numColor: "text-red-700",
    },
    {
      title: "Hired",
      value: stats.HIRED,
      titleColor: "text-green-600",
      numColor: "text-green-700",
    },
  ];

  return (
    // Strictly changed to lg:grid-cols-5 taake panchon dabbe ek line mein saans le sakein
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1"
        >
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${card.titleColor} truncate`}
          >
            {card.title}
          </span>
          <span className={`text-3xl font-extrabold ${card.numColor}`}>
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
