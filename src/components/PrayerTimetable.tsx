import { useState } from "react";

import type { DailyPrayerSchedule, OtherTimeRow, PrayerRow } from "@/lib/prayer-times";

export function PrayerTimetable({ schedule }: { schedule: DailyPrayerSchedule }) {
  const [showOtherTimes, setShowOtherTimes] = useState(false);
  const { tahajjud, ishraq, zawal, jummah } = schedule.otherTimes;
  const rows: (PrayerRow | OtherTimeRow)[] = showOtherTimes
    ? schedule.prayers.flatMap((prayer): (PrayerRow | OtherTimeRow)[] => {
        switch (prayer.name) {
          case "Fajr":
            return [tahajjud, prayer];
          case "Sunrise":
            return [prayer, ishraq];
          case "Zuhr":
            return [zawal, prayer, jummah];
          default:
            return [prayer];
        }
      })
    : schedule.prayers;

  return (
    <section id="prayer-times" className="section-shell prayer-section">
      <div className="section-heading-row">
        <div>
          <h2>Prayer times</h2>
          <p className="section-intro">
            <time dateTime={schedule.dateKey}>{schedule.displayDate}</time> · Lahore (PKT)
          </p>
        </div>
        <button
          type="button"
          className="other-times-toggle"
          aria-pressed={showOtherTimes}
          aria-controls="daily-prayer-table"
          onClick={() => setShowOtherTimes((shown) => !shown)}
        >
          <span>Other times</span>
          <span className="other-times-track" aria-hidden="true">
            <span className="other-times-thumb" />
          </span>
        </button>
      </div>

      <div
        id="daily-prayer-table"
        className="prayer-table"
        role="table"
        aria-label="Daily prayer start and congregation times"
      >
        <div className="prayer-row prayer-table-heading" role="row">
          <span role="columnheader">PRAYER / TIME</span>
          <span role="columnheader">START</span>
          <span role="columnheader">JAMĀ‘AT</span>
        </div>
        {rows.map((prayer, index) => (
          <div
            className={`prayer-row${"kind" in prayer ? ` prayer-row--${prayer.kind}` : ""}`}
            role="row"
            key={prayer.name}
          >
            <span className="prayer-name" role="cell">
              <span className="prayer-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="prayer-label">
                <span className="prayer-title">
                  {prayer.name}
                  {prayer.note ? <span className="prayer-note">{prayer.note}</span> : null}
                </span>
                {"detail" in prayer ? <span className="prayer-detail">{prayer.detail}</span> : null}
              </span>
            </span>
            <span className="prayer-time" role="cell">
              {prayer.start ?? <span aria-label="Not applicable">—</span>}
            </span>
            <span className="prayer-time" role="cell">
              {prayer.jamaat ?? <span aria-label="Not applicable">—</span>}
            </span>
          </div>
        ))}
      </div>
      <p className="schedule-note">
        Calculated starts: Karachi method · Hanafi Asr. Jamaat times follow the LUMS Masjid
        timetable; Maghrib is 5 minutes after sunset. All times are Pakistan Standard Time.
      </p>
      {showOtherTimes ? (
        <p className="schedule-note">
          Tahajjud shows the preferred last third before today’s Fajr; it may also be prayed after
          Isha. Ishraq is estimated at 20 minutes after sunrise. Zawal marks solar noon, when prayer
          should be avoided.
        </p>
      ) : null}
    </section>
  );
}
