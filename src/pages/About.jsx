import React from "react";
import {
  Brain,
  MessageSquareText,
  Smile,
  BarChart3,
  ShieldCheck,
  Database,
  Sparkles,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: MessageSquareText,
    title: "Context-Aware Reviews",
    description:
      "CCI analyzes review text while considering the context behind the user's words.",
  },
  {
    icon: Smile,
    title: "Emoji Intelligence",
    description:
      "Emojis are analyzed alongside text to understand additional emotional signals.",
  },
  {
    icon: BarChart3,
    title: "Review Analytics",
    description:
      "Transform review data into useful sentiment, rating, product, and brand insights.",
  },
  {
    icon: Database,
    title: "Dataset Analysis",
    description:
      "Upload real review datasets and evaluate them using CCI's NLP analysis pipeline.",
  },
];

function About() {
  return (
    <div className="about-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="about-hero">

        <div className="about-hero-icon">
          <Brain size={34} />
        </div>

        <span className="about-badge">
          <Sparkles size={15} />
          Contextual Communication Intelligence
        </span>

        <h1>
          Understanding Reviews
          <span> Beyond Words.</span>
        </h1>

        <p>
          CCI is an intelligent review analysis platform designed to understand
          customer opinions through text, emojis, sentiment, and contextual
          relationships.
        </p>

      </section>


      {/* =====================================================
          ABOUT CCI
      ===================================================== */}

      <section className="about-section">

        <div className="about-section-heading">

          <span>ABOUT CCI</span>

          <h2>
            Turning customer reviews into meaningful insights.
          </h2>

          <p>
            Traditional sentiment analysis often focuses only on positive,
            negative, or neutral words. CCI goes further by combining review
            text with emojis and contextual signals to provide a deeper
            understanding of customer communication.
          </p>

        </div>


        {/* Feature Cards */}

        <div className="about-features">

          {features.map((feature) => {

            const Icon = feature.icon;

            return (
              <div
                className="about-feature-card"
                key={feature.title}
              >

                <div className="about-feature-icon">
                  <Icon size={22} />
                </div>

                <h3>
                  {feature.title}
                </h3>

                <p>
                  {feature.description}
                </p>

              </div>
            );

          })}

        </div>

      </section>


      {/* =====================================================
          PREMIUM STATS
      ===================================================== */}

      <section className="about-stats-section">

        <div className="about-stats-header">

          <span>CCI AT A GLANCE</span>

          <h2>
            Built to understand every layer of a review.
          </h2>

          <p>
            CCI combines language, sentiment, emojis, ratings, and contextual
            signals to turn customer feedback into meaningful intelligence.
          </p>

        </div>


        <div className="about-stats-grid">


          {/* Stat 1 */}

          <div className="about-stat-card">

            <div className="about-stat-number">
              5+
            </div>

            <div className="about-stat-label">
              Analysis Dimensions
            </div>

            <p>
              Text, sentiment, emojis, ratings, and contextual signals.
            </p>

          </div>


          {/* Stat 2 */}

          <div className="about-stat-card">

            <div className="about-stat-number">
              3
            </div>

            <div className="about-stat-label">
              Core Technologies
            </div>

            <p>
              React, FastAPI, and MongoDB working together.
            </p>

          </div>


          {/* Stat 3 */}

          <div className="about-stat-card">

            <div className="about-stat-number">
              100%
            </div>

            <div className="about-stat-label">
              Interactive Insights
            </div>

            <p>
              Explore reviews through dashboards, charts, and analytics.
            </p>

          </div>


          {/* Stat 4 */}

          <div className="about-stat-card">

            <div className="about-stat-number">
              ∞
            </div>

            <div className="about-stat-label">
              Review Possibilities
            </div>

            <p>
              Designed to scale from individual reviews to large datasets.
            </p>

          </div>


        </div>

      </section>


      {/* =====================================================
          OUR APPROACH
      ===================================================== */}

      <section className="about-section about-mission">

        <div className="about-mission-content">

          <span>OUR APPROACH</span>

          <h2>
            More than sentiment. More context.
          </h2>

          <p>
            CCI explores how people communicate their experiences through
            language, emojis, ratings, and contextual signals. The goal is to
            help businesses and researchers understand what customers really
            mean behind their reviews.
          </p>


          <div className="about-points">


            <div>

              <ShieldCheck size={20} />

              <span>
                Explainable review insights
              </span>

            </div>


            <div>

              <Code2 size={20} />

              <span>
                Modern NLP-based architecture
              </span>

            </div>


            <div>

              <BarChart3 size={20} />

              <span>
                Interactive analytics and visualization
              </span>

            </div>


          </div>

        </div>

      </section>


      {/* =====================================================
          TECHNOLOGY
      ===================================================== */}

      <section className="about-tech">

        <div className="about-tech-icon">
          <Brain size={28} />
        </div>

        <h2>
          Built for intelligent review analysis
        </h2>

        <p>
          CCI combines a modern React interface, FastAPI backend, MongoDB
          storage, NLP analysis, emoji intelligence, and interactive
          visualizations into one platform.
        </p>


        <div className="about-tech-tags">

          <span>React</span>

          <span>FastAPI</span>

          <span>MongoDB</span>

          <span>NLP</span>

          <span>Analytics</span>

          <span>Emoji Intelligence</span>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="about-footer">

        <p>
          CCI — Contextual Communication Intelligence
        </p>

        <span>
          Understanding Reviews Beyond Words.
        </span>

      </footer>

    </div>
  );
}

export default About;