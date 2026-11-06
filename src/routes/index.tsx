import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, CalendarDays, Check, Clock3, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/newsletter.functions";
import heroImage from "@/assets/lums-masjid-evening.png.asset.json";
import logoImage from "@/assets/lums-masjid-logo.png.asset.json";
import tileImage from "@/assets/kashi-interlace.jpg.asset.json";

const prayers = [
  { name: "Fajr", start: "Being confirmed", jamaat: "Being confirmed" },
  { name: "Sunrise", start: "Being confirmed", jamaat: null },
  { name: "Zuhr", start: "Being confirmed", jamaat: "Being confirmed" },
  { name: "Asr", note: "Hanafi", start: "Being confirmed", jamaat: "Being confirmed" },
  { name: "Maghrib", start: "Being confirmed", jamaat: "Being confirmed" },
  { name: "Isha", start: "Being confirmed", jamaat: "Being confirmed" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUMS Masjid | Prayer, Community & Campus Life" },
      {
        name: "description",
        content:
          "Find prayer times, upcoming events and community announcements at the LUMS Masjid.",
      },
      { property: "og:title", content: "LUMS Masjid | Prayer, Community & Campus Life" },
      {
        property: "og:description",
        content: "A quiet center of prayer, learning and community at LUMS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [email, setEmail] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupMessage("");
    setIsSubmitting(true);

    try {
      await subscribeToNewsletter({ data: { email } });
      setSignupMessage("You're on the list. Thank you for joining us.");
      setEmail("");
    } catch {
      setSignupMessage("We couldn't add your email just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="site-header mx-auto flex items-center justify-between px-5 md:px-10">
        <a className="brand-lockup" href="#home" aria-label="LUMS Masjid home">
          <img className="brand-logo" src={logoImage.url} alt="" />
          <span className="brand-name">LUMS MASJID</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#prayer-times">Prayer times</a>
          <a href="#community">Community</a>
          <a className="nav-newsletter" href="#newsletter">
            Newsletter <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        </nav>
      </header>

      <section id="home" className="mosque-hero" aria-labelledby="page-title">
        <img className="mosque-hero-image" src={heroImage.url} alt="The LUMS Masjid glowing beneath the night sky" />
        <div className="mosque-hero-shade" />
        <div className="mosque-hero-content px-6 md:px-12">
          <div className="hero-caption">
            <span className="hero-caption-rule" />
            <span>AT THE HEART OF CAMPUS</span>
          </div>
          <h1 id="page-title">LUMS<br />MASJID</h1>
          <p>A quiet center of prayer, learning, and community.</p>
          <a className="hero-scroll" href="#prayer-times">
            <span>Find today’s prayer times</span>
            <ArrowDown aria-hidden="true" size={15} />
          </a>
        </div>
        <div className="hero-location">
          <MapPin aria-hidden="true" size={14} />
          <span>LUMS CAMPUS</span>
        </div>
        <div className="hero-index" aria-hidden="true">01 — 04</div>
      </section>

      <div className="tile-rule" style={{ backgroundImage: `url(${tileImage.url})` }} aria-hidden="true" />

      <section id="prayer-times" className="section-shell prayer-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow"><Clock3 aria-hidden="true" size={14} /> DAILY RHYTHM</p>
            <h2>Prayer times</h2>
            <p className="section-intro">Daily timings will be updated here by the masjid.</p>
          </div>
          <span className="update-status"><span className="status-dot" /> Times being confirmed</span>
        </div>

        <div className="prayer-table" role="table" aria-label="Daily prayer start and congregation times">
          <div className="prayer-row prayer-table-heading" role="row">
            <span role="columnheader">PRAYER</span>
            <span role="columnheader">START</span>
            <span role="columnheader">JAMĀ‘AT</span>
          </div>
          {prayers.map((prayer, index) => (
            <div className="prayer-row" role="row" key={prayer.name}>
              <span className="prayer-name" role="cell">
                <span className="prayer-number">0{index + 1}</span>
                {prayer.name}
                {prayer.note ? <span className="prayer-note">{prayer.note}</span> : null}
              </span>
              <span className="prayer-time" role="cell">{prayer.start}</span>
              <span className="prayer-time" role="cell">{prayer.jamaat ?? <span aria-label="Not applicable">—</span>}</span>
            </div>
          ))}
        </div>
        <p className="schedule-note">Exact timings will be shared once confirmed by the masjid.</p>
      </section>

      <section id="community" className="section-shell community-section">
        <div className="community-grid">
          <div className="community-block events-block">
            <p className="eyebrow"><CalendarDays aria-hidden="true" size={14} /> GATHER TOGETHER</p>
            <h2>Upcoming events</h2>
            <p className="section-intro">Lectures, gatherings, and moments to share.</p>
            <div className="empty-update">
              <span className="empty-line" />
              <p>There are no upcoming events to share just yet.</p>
              <span className="empty-detail">Check back here for the next gathering.</span>
            </div>
          </div>

          <div className="community-block notices-block">
            <p className="eyebrow"><span className="notice-mark" aria-hidden="true">✳</span> FROM THE MASJID</p>
            <h2>Announcements</h2>
            <p className="section-intro">Important notices and updates.</p>
            <article className="notice-item">
              <p className="notice-date">MASJID UPDATE</p>
              <h3>More information, soon.</h3>
              <p>Prayer timings, upcoming events, and community announcements will appear here as they are confirmed.</p>
              <span className="notice-link">We look forward to welcoming you.</span>
            </article>
          </div>
        </div>
      </section>

      <section id="newsletter" className="newsletter-section">
        <div className="newsletter-inner">
          <div className="newsletter-copy">
            <p className="eyebrow"><Mail aria-hidden="true" size={14} /> A NOTE FROM THE MASJID</p>
            <h2>Stay in the circle.</h2>
            <p>Occasional notes on prayer, gatherings, and life at the masjid.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
            <Input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="Your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              aria-describedby={signupMessage ? "newsletter-status" : undefined}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Joining…" : "Join the newsletter"}
              {signupMessage.startsWith("You're") ? <Check aria-hidden="true" size={15} /> : <ArrowUpRight aria-hidden="true" size={15} />}
            </Button>
            {signupMessage ? (
              <p id="newsletter-status" className="newsletter-status" aria-live="polite">{signupMessage}</p>
            ) : null}
          </form>
        </div>
        <div className="newsletter-tile-detail" style={{ backgroundImage: `url(${tileImage.url})` }} aria-hidden="true" />
      </section>

      <footer className="site-footer">
        <a className="footer-lockup" href="#home">
          <img src={logoImage.url} alt="" />
          <span>LUMS MASJID</span>
        </a>
        <p>A place to pause, and return.</p>
        <span className="footer-year">LAHORE UNIVERSITY OF MANAGEMENT SCIENCES</span>
      </footer>
    </main>
  );
}