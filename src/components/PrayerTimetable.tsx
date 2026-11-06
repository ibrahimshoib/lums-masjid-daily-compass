import { useEffect, useState } from "react";

import type { DailyPrayerSchedule, OtherTimeRow, PrayerRow } from "@/lib/prayer-times";
import { countdownParts, getPrayerStatus } from "@/lib/prayer-status";

export function PrayerTimetable({ schedule }: { schedule: DailyPrayerSchedule }) {
  const [showOtherTimes, setShowOtherTimes] = useState(false);
  // The initial clock comes from the loader for identical server/client HTML.
  // Once mounted, derive every tick from Date.now() so suspended tabs don't drift.
  const [now, setNow] = useState(() => Date.parse(schedule.calculatedAt));
  useEffect(() => {
    const syncClock = () => setNow(Date.now());
    syncClock();
    const timer = window.setInterval(syncClock, 1_000);
    window.addEventListener("focus", syncClock);
    document.addEventListener("visibilitychange", syncClock);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncClock);
      document.removeEventListener("visibilitychange", syncClock);
    };
  }, []);
  const { current, next, remainingSeconds } = getPrayerStatus(schedule.timeline, now);
  const previousNight = current && current.dateKey < schedule.dateKey ? current : null;
  const clock = countdownParts(remainingSeconds);
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

      {next ? (
        <div className="prayer-countdown">
          <div className="next-prayer-copy">
            <p className="next-prayer-caption">Next jama’at starts in</p>
            <p className="next-prayer-name" role="status" aria-live="polite" aria-atomic="true">
              {next.name}
              {next.dateKey > schedule.dateKey ? (
                <span className="next-prayer-day">Tomorrow</span>
              ) : null}
            </p>
            <p className="next-prayer-meta">
              Jamaat {next.jamaatLabel} <span aria-hidden="true">·</span> Prayer starts{" "}
              {next.startLabel}
            </p>
          </div>
          <div
            className="countdown-clock"
            role="timer"
            aria-live="off"
            aria-label={`Time until ${next.name} jamaat starts`}
          >
            {clock.map((value, index) => (
              <span className="countdown-part" key={index}>
                <span className="countdown-number">{value}</span>
                <span className="countdown-unit">{["Hours", "Minutes", "Seconds"][index]}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

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
            className={`prayer-row prayer-row--${"kind" in prayer ? prayer.kind : prayer.name === "Sunrise" ? "marker" : "fard"}${current?.name === prayer.name ? " prayer-row--current" : ""}`}
            role="row"
            aria-current={current?.name === prayer.name ? "time" : undefined}
            key={prayer.name}
          >
            <span className="prayer-name" role="cell">
              <span className="prayer-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="prayer-label">
                <span className="prayer-title">
                  {prayer.name}
                  {current?.name === prayer.name ? (
                    <span className="sr-only"> — current prayer</span>
                  ) : null}
                  {prayer.note ? <span className="prayer-note">{prayer.note}</span> : null}
                </span>
                {"detail" in prayer ? <span className="prayer-detail">{prayer.detail}</span> : null}
                {previousNight?.name === prayer.name ? (
                  <span className="prayer-detail">From last night</span>
                ) : null}
              </span>
            </span>
            <span className="prayer-time" role="cell">
              {previousNight?.name === prayer.name
                ? previousNight.startLabel
                : (prayer.start ?? <span aria-label="Not applicable">—</span>)}
            </span>
            <span className="prayer-time" role="cell">
              {previousNight?.name === prayer.name
                ? previousNight.jamaatLabel
                : (prayer.jamaat ?? <span aria-label="Not applicable">—</span>)}
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
