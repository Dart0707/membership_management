import { useMemo, useState } from "react";
import type { AttendanceRecord, Activity } from "@/lib/gym-members";
import { ACTIVITIES } from "@/lib/gym-members";
import { AttendanceIcon } from "@/components/icons";

export default function AttendanceTab({ attendance, referenceDate }: {
  attendance: AttendanceRecord[];
  referenceDate: string;
}) {
  const [selectedDate, setSelectedDate] = useState(referenceDate);
  const [activityFilter, setActivityFilter] = useState<"ALL" | Activity>("ALL");

  const dailyAttendance = useMemo(
    () => attendance.filter((record) =>
      record.date === selectedDate &&
      (activityFilter === "ALL" || record.activity === activityFilter)
    ),
    [attendance, selectedDate, activityFilter]
  );
  const activityCounts = ACTIVITIES.map((activity) => ({
    activity,
    count: attendance.filter((record) => record.date === selectedDate && record.activity === activity).length,
  })).filter((item) => item.count > 0);

  return (
    <div className="space-y-5">
      <section className="bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-[#e4e6f0]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#151d3d] flex items-center gap-2">
              <AttendanceIcon />
              <span>Daily Attendance</span>
            </h2>
            <p className="text-xs text-[#5d70c7] mt-1">
              Review who checked in and which activity they attended.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#151d3d]">
              Date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-xl border border-[#e4e6f0] bg-white px-3 py-2 text-sm text-[#151d3d] focus:outline-none focus:border-[#5d70c7]"
              />
            </label>
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value as "ALL" | Activity)}
              className="rounded-xl border border-[#e4e6f0] bg-white px-3 py-2 text-sm text-[#151d3d] focus:outline-none focus:border-[#5d70c7]"
            >
              <option value="ALL">All activities</option>
              {ACTIVITIES.map((activity) => <option key={activity} value={activity}>{activity}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#e4e6f0] bg-white px-4 py-3">
            <div className="text-2xl font-bold text-[#151d3d]">{dailyAttendance.length}</div>
            <div className="text-[11px] uppercase tracking-wider text-[#5d70c7]">Check-ins</div>
          </div>
          {activityCounts.map(({ activity, count }) => (
            <div key={activity} className="rounded-xl border border-[#e4e6f0] bg-white px-4 py-3">
              <div className="text-2xl font-bold text-[#6f80d2]">{count}</div>
              <div className="text-[11px] uppercase tracking-wider text-[#5d70c7] truncate">{activity}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-[#e4e6f0]/30">
        <div className="overflow-x-auto">
          <table className="min-w-[620px] w-full text-left text-xs text-[#151d3d]">
            <thead className="bg-white text-[#5d70c7] uppercase tracking-wider font-semibold border-b border-[#e4e6f0]">
              <tr>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Member</th>
                <th className="p-3.5">Member ID</th>
                <th className="p-3.5">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e6f0]/60">
              {dailyAttendance.length > 0 ? dailyAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-[#e4e6f0]/40 transition">
                  <td className="p-3.5 font-mono">{new Date(record.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
                  <td className="p-3.5 font-semibold">{record.memberName}</td>
                  <td className="p-3.5 font-mono text-[#5d70c7]">{record.memberId}</td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-[#5d70c7]/10 border border-[#5d70c7]/30 px-2.5 py-1 font-semibold text-[#6f80d2]">
                      {record.activity}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#8795db]">
                    No attendance recorded for this date and activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
