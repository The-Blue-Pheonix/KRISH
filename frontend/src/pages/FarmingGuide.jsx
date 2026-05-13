import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import guideEn from '../data/guide_en.json';
import guideHi from '../data/guide_hi.json';
import guideBn from '../data/guide_bn.json';
import guideMr from '../data/guide_mr.json';
import guideTa from '../data/guide_ta.json';

const guideLocales = {
  en: guideEn,
  hi: guideHi,
  bn: guideBn,
  mr: guideMr,
  ta: guideTa
};

function renderBody(body) {
  return body.map((block, i) => {
    if (block.type === "intro") return (
      <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: "var(--color-text-primary)", marginBottom: 16, padding: "12px 16px", background: "var(--color-background-secondary)", borderLeft: "3px solid var(--color-border-primary)", borderRadius: "0 8px 8px 0" }}>
        {block.text}
      </p>
    );
    if (block.type === "h3") return (
      <h3 key={i} style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {block.text}
      </h3>
    );
    if (block.type === "text") return (
      <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: 12 }}>
        {block.text}
      </p>
    );
    if (block.type === "list") return (
      <ul key={i} style={{ margin: "0 0 16px 0", paddingLeft: 18 }}>
        {block.items.map((item, j) => (
          <li key={j} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: 6 }}>{item}</li>
        ))}
      </ul>
    );
    if (block.type === "cropbox") return (
      <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {block.items.map((item, j) => (
          <span key={j} style={{ fontSize: 13, padding: "4px 10px", background: "var(--color-background-success)", color: "var(--color-text-success)", borderRadius: 20, border: "0.5px solid var(--color-border-success)" }}>{item}</span>
        ))}
      </div>
    );
    if (block.type === "dolist") return (
      <ul key={i} style={{ margin: "0 0 16px 0", paddingLeft: 0, listStyle: "none" }}>
        {block.items.map((item, j) => (
          <li key={j} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: 8, paddingLeft: 22, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, color: "var(--color-text-success)", fontWeight: 500 }}>✓</span>
            {item}
          </li>
        ))}
      </ul>
    );
    if (block.type === "dontlist") return (
      <ul key={i} style={{ margin: "0 0 16px 0", paddingLeft: 0, listStyle: "none" }}>
        {block.items.map((item, j) => (
          <li key={j} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: 8, paddingLeft: 22, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, color: "var(--color-text-danger)", fontWeight: 500 }}>✕</span>
            {item}
          </li>
        ))}
      </ul>
    );
    if (block.type === "fact") return (
      <div key={i} style={{ margin: "16px 0", padding: "12px 16px", background: "var(--color-background-warning)", borderRadius: 8, border: "0.5px solid var(--color-border-warning)" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-warning)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Fact</span>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", margin: "6px 0 0 0" }}>{block.text}</p>
      </div>
    );
    return null;
  });
}

export default function KrishiGyanWiki() {
  const { t, i18n } = useTranslation();
  const SECTIONS = guideLocales[i18n.language?.split('-')[0]] || guideEn;
  const ALL_ARTICLES = useMemo(() => SECTIONS.flatMap(s => s.articles.map(a => ({ ...a, sectionId: s.id, sectionTitle: s.title, sectionColor: s.color }))), [SECTIONS]);
  const [activeSection, setActiveSection] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);
  const [search, setSearch] = useState("");
  const [breadcrumb, setBreadcrumb] = useState([]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return ALL_ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      a.body.some(b => (b.text || "").toLowerCase().includes(q) || (b.items || []).some(i => i.toLowerCase().includes(q)))
    );
  }, [search]);

  const openSection = (sec) => {
    setActiveSection(sec);
    setActiveArticle(null);
    setBreadcrumb([sec.title]);
    setSearch("");
  };

  const openArticle = (article, sec) => {
    setActiveSection(sec || activeSection);
    setActiveArticle(article);
    setBreadcrumb(sec ? [sec.sectionTitle, article.title] : [activeSection.title, article.title]);
    setSearch("");
  };

  const goHome = () => { setActiveSection(null); setActiveArticle(null); setBreadcrumb([]); setSearch(""); };
  const goSection = () => { setActiveArticle(null); setBreadcrumb([activeSection.title]); };

  const currentSection = activeSection || SECTIONS.find(s => s.id === (activeArticle?.sectionId));

  return (
    <div style={{ fontFamily: "var(--font-sans)", minHeight: "100vh", background: "var(--color-background-tertiary)" }}>

      {/* Top Bar */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 20px", display: "flex", alignItems: "center", gap: 16, height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}>
          <span style={{ fontSize: 20 }}>🌾</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>KrishiGyan</span>
        </button>
        <span style={{ color: "var(--color-border-primary)", fontSize: 18 }}>|</span>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-secondary)", flex: 1, minWidth: 0 }}>
          {breadcrumb.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ color: "var(--color-border-primary)" }}>›</span>}
              <button
                onClick={i === 0 ? goSection : undefined}
                style={{ background: "none", border: "none", cursor: i === 0 && breadcrumb.length > 1 ? "pointer" : "default", padding: 0, fontSize: 13, color: i === breadcrumb.length - 1 ? "var(--color-text-primary)" : "var(--color-text-info)", fontWeight: i === breadcrumb.length - 1 ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}
              >{crumb}</button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", opacity: 0.4 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('guide.search_placeholder', 'Search everything…')}
            style={{ paddingLeft: 30, paddingRight: 12, height: 32, width: 200, fontSize: 13, borderRadius: 20 }}
          />
          {search && (
            <div style={{ position: "absolute", top: 38, right: 0, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, minWidth: 280, maxWidth: 340, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", zIndex: 200, maxHeight: 320, overflowY: "auto" }}>
              {searchResults.length === 0 ? (
                <p style={{ padding: "12px 16px", color: "var(--color-text-secondary)", fontSize: 13, margin: 0 }}>{t('guide.no_results', 'No results found')}</p>
              ) : searchResults.map(a => (
                <button key={a.id} onClick={() => openArticle(a, { id: a.sectionId, title: a.sectionTitle, sectionTitle: a.sectionTitle })}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", borderBottom: "0.5px solid var(--color-border-tertiary)", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{a.sectionTitle}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>

        {/* HOME PAGE */}
        {!activeSection && !activeArticle && (
          <>
            <div style={{ marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌾</div>
              <h1 style={{ fontSize: 26, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 8px" }}>{t('guide.wiki_title', 'KrishiGyan — Farmer\'s Wikipedia')}</h1>
              <p style={{ fontSize: 15, color: "var(--color-text-secondary)", margin: 0 }}>{t('guide.wiki_subtitle', 'Everything a farmer needs to know — simple, clear, no jargon. In one place.')}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
              {SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => openSection(sec)}
                  style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 20px 16px", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{sec.emoji}</span>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", borderRadius: 20, padding: "2px 10px", border: "0.5px solid var(--color-border-tertiary)" }}>{sec.articles.length} {t('guide.articles', 'articles')}</span>
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 8px" }}>{t(`guide.section.${sec.id}.title`, sec.title)}</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sec.articles.slice(0, 3).map(a => (
                      <span key={a.id} style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{a.title.split(" (")[0].split(" —")[0]}</span>
                    ))}
                    {sec.articles.length > 3 && <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>+{sec.articles.length - 3} {t('guide.more', 'more')}</span>}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" }}>
                {t('guide.footer_disclaimer', 'Based on ICAR, state agriculture department guidelines, and field practices across India. For location-specific advice, contact your local Krishi Vigyan Kendra (KVK).')}
              </p>
            </div>
          </>
        )}

        {/* SECTION PAGE — article list */}
        {activeSection && !activeArticle && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={goHome} style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>← {t('guide.back', 'Back')}</button>
              <span style={{ fontSize: 28 }}>{activeSection.emoji}</span>
              <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{t(`guide.section.${activeSection.id}.title`, activeSection.title)}</h1>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {activeSection.articles.map(article => (
                <button key={article.id} onClick={() => openArticle(article)}
                  style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "16px 18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-primary)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
                >
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 8px" }}>{t(`guide.article.${article.id}.title`, article.title)}</h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {article.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 12, padding: "2px 8px", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", borderRadius: 20, border: "0.5px solid var(--color-border-tertiary)" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: 18, flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ARTICLE PAGE */}
        {activeArticle && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <button onClick={goSection} style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>← {currentSection ? t(`guide.section.${currentSection.id}.title`, currentSection.title) : t('guide.back', 'Back')}</button>

            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 10px" }}>{t(`guide.article.${activeArticle.id}.title`, activeArticle.title)}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {activeArticle.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 12, padding: "3px 10px", background: "var(--color-background-info)", color: "var(--color-text-info)", borderRadius: 20, border: "0.5px solid var(--color-border-info)" }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 24px" }}>
              {renderBody(activeArticle.body, t)}
            </div>

            {/* Related Articles */}
            {(() => {
              const related = currentSection?.articles?.filter(a => a.id !== activeArticle.id).slice(0, 3) || [];
              return related.length > 0 ? (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('guide.more_in', 'More in')} {currentSection ? t(`guide.section.${currentSection.id}.title`, currentSection.title) : ''}</h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {related.map(a => (
                      <button key={a.id} onClick={() => { setActiveArticle(a); setBreadcrumb([currentSection.title, a.title]); window.scrollTo(0, 0); }}
                        style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, padding: "12px 16px", cursor: "pointer", textAlign: "left", fontSize: 14, color: "var(--color-text-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {t(`guide.article.${a.id}.title`, a.title)}
                        <span style={{ color: "var(--color-text-secondary)" }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}