# Lums Masjid Daily Compass

make a home page for the lums masjid. 
LUMS Masjid logo
title: "LUMS MASJID" 
Image of the masjid as hero bg
Prayer Times:
Fajr - start and jamat time
Sunrise time
Zuhr start time and jamat time
Asr Start and jamat (hanafi)
Maghrib start + jamat time
isha start + jamat time

Upcoming events:
Should have names of masjid events, their date/time, and if a registration link is available then it should be shown.

Important Announcements and Notices.

An option to sign up for the email newsletter

keep it really really beautiful and dark themed. every feature, every icon should be well thought and have a purpose, make the typography look intentional and non AI slop. Think each and every element several times, contest it, then keep it only if it makes sense, also keep it minimalistic

the tiles given in the image exist inside the mosque, you may use them as you wish as part of the design.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lums-masjid-daily-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0b0076ea-414d-4dea-80c5-7b6ce30b173a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Prayer times

The homepage loads today's schedule from a TanStack server function. Start times
are calculated locally with Adhan using the LUMS mosque coordinates, the University
of Islamic Sciences, Karachi method (18° Fajr and Isha), and Hanafi Asr. No external
prayer-time API or database is required. Times use the library's nearest-minute
rounding and are displayed in `Asia/Karachi` with explicit AM/PM labels.

`src/lib/prayer-times.ts` contains the jamaat timetable transcribed from both sides
of the supplied LUMS Masjid prayer card. Each period begins on the 1st or 16th and
repeats annually. Zuhr/Jumu'ah jamaat is 1:30 PM. Maghrib jamaat is five minutes
after the calculated daily sunset; the card's example sunsets are not reused.

The page refreshes the schedule at Lahore midnight and checks for expiry when a
visitor returns to the tab. Tests cover all timetable periods, timezone and date
boundaries, leap day, and prayer-window consistency across a full year.

The optional **Other times** toggle adds Tahajjud (the preferred last third before
today's Fajr, calculated from the previous sunset), Ishraq (estimated 20 minutes
after sunrise), Zawal (solar noon, without Dhuhr's safety adjustment), and Friday's
1:30 PM Jummah jamaat. Tahajjud and Ishraq use softer text than the fard prayers;
Zawal is labeled as a time to avoid prayer. Tahajjud remains permissible after
Isha; the displayed last third is its preferred period, not its earliest time.

## Upcoming events

Weekly Spiritual Talk meets every Thursday post Isha; Seerah Circle meets every
Monday post Maghrib. The homepage computes each event's next occurrence from the
same Lahore date used by the prayer timetable, then sorts by occurrence date.
On Sunday, Monday's Seerah Circle appears before Thursday's talk. Today's events
remain visible until Lahore midnight because no precise start/end times have
been specified. The existing midnight and tab-focus refresh updates both lists.
