/* Chartie™ app.js — LKG Restore + OSCAR Engine
   - Works with the index.html you pasted (ids + classes match)
   - No external API calls; “AI” layouts are smart templates
   - Reliable render + progress/pencil + download PNG/PDF
*/

(() => {
  // ----------------------------
  // Helpers
  // ----------------------------
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function setText(el, txt) {
    if (!el) return;
    el.textContent = txt ?? "";
  }

  function show(el) { if (el) el.classList.remove("hidden"); }
  function hide(el) { if (el) el.classList.add("hidden"); }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function titleCase(s) {
    return (s || "")
      .trim()
      .split(/\s+/)
      .map(w => w.length ? w[0].toUpperCase() + w.slice(1) : w)
      .join(" ");
  }

  // ----------------------------
  // DOM elements (from your index.html)
  // ----------------------------
  const elTopic = $("topic");
  const elBtn = $("btn-generate");
  const elError = $("error");

  const elLayout = $("layout");
  const elToggleBig = $("toggle-big");
  const elToggleEmoji = $("toggle-emoji");
  const elToggleHand = $("toggle-hand");
  const elToggleSticky = $("toggle-sticky");

  const elHlStyle = $("hlStyle");
  const elFontPreset = $("fontPreset");
  const elBgStyle = $("bgStyle");

  const elPaper = $("paper");
  const elOrientation = $("orientation");

  const elTitle = $("chart-title");
  const elSub = $("chart-sub");
  const elBadge = $("format-badge");
  const elContent = $("chart-content");
  const elSheet = $("sheet");

  const elSticky = $("sticky");
  const elStickyH = $("sticky-h");
  const elStickyP = $("sticky-p");
  const elStickyTitle = $("sticky-title");
  const elStickyText = $("sticky-text");
  const elStickyControls = $("sticky-controls");

  const elQtPanel = $("qt-panel");
  const elQtTitle = $("qt-title");
  const elQtRows = $("qt-rows");
  const elQtSplitBlank = $("qt-split-blank");
  const elQtSplitLines = $("qt-split-lines");

  const elBtnPNG = $("btn-download");
  const elBtnPDF = $("btn-pdf");

  const elProgFill = $("prog-fill");
  const elPencil = $("pencil");
  const elLoadingText = $("loading-text");
  const elSR = $("sr-status");

  // Accent swatches (buttons with data-color)
  const swatches = Array.from(document.querySelectorAll(".swatch"));

  // ----------------------------
  // State
  // ----------------------------
  const state = {
    accent: "#f59e0b",
    hlStyle: "clean",
    fontPreset: "hand+rounded",
    bgStyle: "lined-light",
    layout: "auto",
    paper: "letter",
    orientation: "landscape",
    bigText: false,
    emoji: false,
    handMath: false,
    sticky: false
  };

  // ----------------------------
  // Progress UI
  // ----------------------------
  function setProgress(pct, label) {
    const p = clamp(pct, 0, 100);
    if (elProgFill) elProgFill.style.width = `${p}%`;
    if (elPencil) elPencil.style.left = `calc(${p}% - 12px)`;
    if (elLoadingText && label) elLoadingText.textContent = label;
  }

  function setError(msg) {
    if (!elError) return;
    if (!msg) {
      hide(elError);
      elError.textContent = "";
      return;
    }
    elError.textContent = msg;
    show(elError);
  }

  // ----------------------------
  // Styling “tokens” via CSS variables + sheet classes
  // ----------------------------
  function setAccent(color) {
    state.accent = color;
    document.documentElement.style.setProperty("--chartie-accent", color);
    refreshHighlights();
  }

  function setHighlightStyle(style) {
    state.hlStyle = style;
    refreshHighlights();
  }

  function refreshHighlights() {
    // Your CSS already uses .hl .hl-clean, etc.
    // We just toggle a body attribute the CSS can target if you want.
    document.body.setAttribute("data-hl", state.hlStyle);
  }

  function setFonts(preset) {
    state.fontPreset = preset;

    // Map to font stacks (uses fonts already linked in your head)
    const presets = {
      "hand+rounded": { title: "Patrick Hand, system-ui, sans-serif", body: "Poppins, system-ui, sans-serif" },
      "serif+rounded": { title: "DM Serif Display, Georgia, serif", body: "Nunito Sans, system-ui, sans-serif" },
      "hand+sans": { title: "Patrick Hand, system-ui, sans-serif", body: "Nunito Sans, system-ui, sans-serif" },
      "clean+academic": { title: "Nunito Sans, system-ui, sans-serif", body: "Nunito Sans, system-ui, sans-serif" }
    };

    const f = presets[preset] || presets["hand+rounded"];
    document.documentElement.style.setProperty("--chartie-title-font", f.title);
    document.documentElement.style.setProperty("--chartie-body-font", f.body);

    // Apply to key nodes if your CSS doesn’t already
    if (elTitle) elTitle.style.fontFamily = `var(--chartie-title-font)`;
    if (elSheet) elSheet.style.fontFamily = `var(--chartie-body-font)`;
  }

  function setBackground(bg) {
    state.bgStyle = bg;

    // Remove prior bg-* classes from sheet
    const bgClasses = ["bg-lined-light", "bg-lined-dark", "bg-graph", "bg-poster", "bg-blank"];
    bgClasses.forEach(c => elSheet?.classList.remove(c));

    // Add selected
    const map = {
      "lined-light": "bg-lined-light",
      "lined-dark": "bg-lined-dark",
      "graph": "bg-graph",
      "poster": "bg-poster",
      "blank": "bg-blank"
    };
    elSheet?.classList.add(map[bg] || "bg-lined-light");
  }

  function setOrientation(o) {
    state.orientation = o;
    // You likely already handle in CSS; we ensure sheet stays nice:
    elSheet?.setAttribute("data-orientation", o);
  }

  // ----------------------------
  // Content generators
  // ----------------------------

  // OSCAR banks (discipline-aware, but simple + teacher-authentic)
  const oscarBanks = {
    elar: {
      subtitle: "How authors convey meaning & organize text.",
      sections: (topic) => ([
        {
          h: "Tone",
          bullets: [
            "Author's attitude toward subject or audience.",
            "Revealed through: word choice, imagery, details, sentence style.",
            `Examples: ${topic.includes("tone") ? "humorous, serious, formal, informal, critical, admiring" : "curious, skeptical, respectful, frustrated, hopeful"}.`,
            "Impacts reader’s feelings and understanding."
          ]
        },
        {
          h: "Structure",
          bullets: [
            "How a text is arranged or organized.",
            "Elements: paragraphs, chapters, stanzas, headings.",
            "Patterns: chronological, cause/effect, compare/contrast, problem/solution.",
            "Purpose: guides reader, emphasizes ideas, creates flow."
          ]
        },
        {
          h: "Connection",
          bullets: [
            "Structure often reinforces tone.",
            "Tone can be shaped by structural choices.",
            "Example: short sentences & fragmented structure can create urgency."
          ]
        },
        {
          h: "Example",
          bullets: [
            "Tone: objective, formal, informative.",
            "Structure: introduction → methods → results → discussion → conclusion.",
            "Effect: conveys credibility and logical presentation of facts."
          ]
        }
      ])
    },
    ss: {
      subtitle: "How events, choices, and context shape outcomes over time.",
      sections: (topic) => ([
        {
          h: "Claim",
          bullets: [
            `A key idea about ${topic} that can be supported with evidence.`,
            "Should be specific and historically accurate.",
            "Answers: What happened? Why does it matter?"
          ]
        },
        {
          h: "Context",
          bullets: [
            "What was happening at the time (conditions, conflicts, needs)?",
            "Who had power? Who didn’t? Why?",
            "What beliefs or systems shaped choices?"
          ]
        },
        {
          h: "Evidence",
          bullets: [
            "Primary sources: laws, letters, speeches, photos, maps.",
            "Secondary sources: historians’ explanations and summaries.",
            "Use facts, dates, and details that prove your claim."
          ]
        },
        {
          h: "Impact",
          bullets: [
            "Immediate effects and long-term consequences.",
            "Who benefited? Who was harmed? How do we know?",
            "What changed (or didn’t) after this?"
          ]
        }
      ])
    }
  };

  // “Standard” fallback template (non-OSCAR)
  function standardSections(topic) {
    return [
      { h: "What it is", bullets: [`${titleCase(topic)} is…`, "A clear definition in student-friendly language.", "One key feature or rule."] },
      { h: "Why it matters", bullets: ["Helps readers understand a key idea.", "Shows up in questions and writing.", "Connects to real examples."] },
      { h: "How to use it", bullets: ["Name it.", "Explain it.", "Prove it with evidence or examples."] },
      { h: "Example", bullets: ["Example #1", "Example #2", "Non-example (optional)"] }
    ];
  }

  function addEmojiBullets(bullets) {
    if (!state.emoji) return bullets;
    const emojis = ["•", "✅", "📌", "⭐", "➡️", "🧠", "🧩", "📝", "🔎", "💡"];
    return bullets.map((b, i) => `${emojis[(i + 1) % emojis.length]} ${b}`);
  }

  function makeCard(section) {
    // Uses your CSS .card and .marker-h and .hl
    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.className = "marker-h";
    const span = document.createElement("span");
    span.className = state.hlStyle === "none" ? "" : `hl ${state.hlStyle === "brush" ? "hl-brush" : "hl-clean"}`;
    span.textContent = section.h;
    h3.appendChild(span);

    const ul = document.createElement("ul");
    ul.className = "list-disc pl-5 text-slate-900 space-y-1";

    const bullets = addEmojiBullets(section.bullets);
    bullets.forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });

    card.appendChild(h3);
    card.appendChild(ul);
    return card;
  }

  function clearChart() {
    if (elContent) elContent.innerHTML = "";
  }

  function renderChart({ title, subtitle, badge, sections }) {
    setText(elTitle, title);
    setText(elSub, subtitle || "");
    setText(elBadge, badge || "Format");
    clearChart();

    // Big text toggle influences sheet density (you can refine via CSS)
    if (state.bigText) {
      elSheet?.classList.add("bigtext");
    } else {
      elSheet?.classList.remove("bigtext");
    }

    // Render
    sections.forEach(sec => elContent?.appendChild(makeCard(sec)));

    // Sticky note
    if (state.sticky) {
      show(elSticky);
      elSticky?.classList.remove("hidden");
      setText(elStickyH, (elStickyTitle?.value || "Teacher Tip").trim());
      setText(elStickyP, (elStickyText?.value || "Add a quick reminder here.").trim());
    } else {
      hide(elSticky);
    }

    if (elSR) elSR.textContent = "Chart created.";
  }

  // ----------------------------
  // Quick Templates (simple layouts)
  // ----------------------------
  const simpleLayouts = {
    "simple-title-body": { rows: ["Body"] },
    "simple-2col": { rows: ["Left", "Right"] },
    "simple-3col": { rows: ["Col 1", "Col 2", "Col 3"] },
    "simple-2x2": { rows: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"] },
    "simple-title-sub-3": { rows: ["Bullet 1", "Bullet 2", "Bullet 3"] },
    "simple-title-sub-list": { rows: ["List"] },
    "simple-quote": { rows: ["Quote", "Who said it? / Context"] },
    "simple-def-callout": { rows: ["Definition", "Example", "Why it matters"] },
    "simple-objective-steps": { rows: ["Objective", "Steps"] },
    "simple-image": { rows: ["Image URL (optional)", "Caption"] }
  };

  function qtBuildRows(layoutKey) {
    const spec = simpleLayouts[layoutKey];
    if (!spec) return;
    elQtRows.innerHTML = "";
    spec.rows.forEach((label, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "grid gap-1";

      const l = document.createElement("label");
      l.className = "block text-xs font-semibold";
      l.textContent = label;

      const ta = document.createElement("textarea");
      ta.className = "w-full rounded-lg border px-3 py-2";
      ta.rows = 2;
      ta.dataset.qt = String(idx);

      wrap.appendChild(l);
      wrap.appendChild(ta);
      elQtRows.appendChild(wrap);
    });
  }

  function qtSplit(mode) {
    // Split first textarea into many
    const boxes = Array.from(elQtRows.querySelectorAll("textarea"));
    if (!boxes.length) return;
    const first = boxes[0].value || "";
    const parts = mode === "blank"
      ? first.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean)
      : first.split(/\n+/).map(s => s.trim()).filter(Boolean);

    parts.forEach((p, i) => {
      if (boxes[i]) boxes[i].value = p;
    });
  }

  function renderSimple(layoutKey) {
    const spec = simpleLayouts[layoutKey];
    if (!spec) return;

    const title = (elQtTitle?.value || elTopic?.value || "Your Chart").trim();
    const subtitle = "";

    // Build cards from rows
    const boxes = Array.from(elQtRows.querySelectorAll("textarea"));
    const sections = spec.rows.map((label, i) => ({
      h: label,
      bullets: (boxes[i]?.value || "").trim()
        ? (boxes[i].value.includes("\n")
            ? boxes[i].value.split(/\n+/).map(s => s.trim()).filter(Boolean)
            : [boxes[i].value.trim()])
        : ["(add content)"]
    }));

    renderChart({
      title: titleCase(title),
      subtitle,
      badge: `Format: ${layoutKey.replace("simple-", "Simple — ").replace(/-/g, " ")}`,
      sections
    });
  }

  function handleLayoutUI() {
    const v = elLayout?.value || "auto";
    state.layout = v;

    if (v.startsWith("simple-")) {
      show(elQtPanel);
      qtBuildRows(v);
    } else {
      hide(elQtPanel);
    }

    // Sticky controls
    if (state.sticky) show(elStickyControls); else hide(elStickyControls);
  }

  // ----------------------------
  // Layout selection (Auto / Standard / OSCAR / etc.)
  // ----------------------------
  function inferSubjectFromTopic(topic) {
    // Very lightweight heuristic: you can replace with a real toggle later
    const t = (topic || "").toLowerCase();
    const elarHints = ["tone", "structure", "theme", "character", "conflict", "author", "evidence", "text"];
    const ssHints = ["revolution", "war", "constitution", "migration", "economy", "government", "empire", "civil rights", "industrial"];
    const elarScore = elarHints.filter(h => t.includes(h)).length;
    const ssScore = ssHints.filter(h => t.includes(h)).length;
    return ssScore > elarScore ? "ss" : "elar";
  }

  function buildOscar(topic) {
    const subject = inferSubjectFromTopic(topic); // elar or ss
    const bank = oscarBanks[subject] || oscarBanks.elar;

    const title = titleCase(topic);
    renderChart({
      title,
      subtitle: bank.subtitle,
      badge: `Format: OSCAR (${subject.toUpperCase()})`,
      sections: bank.sections(topic)
    });
  }

  function buildStandard(topic) {
    renderChart({
      title: titleCase(topic),
      subtitle: "Quick anchor chart snapshot.",
      badge: "Format: Standard",
      sections: standardSections(topic)
    });
  }

  // ----------------------------
  // Generate (main action)
  // ----------------------------
  async function generate() {
    setError("");
    const topic = (elTopic?.value || "").trim();
    if (!topic) {
      setError("Type a topic first.");
      return;
    }

    // Sync state from controls
    state.layout = elLayout?.value || "auto";
    state.bigText = !!elToggleBig?.checked;
    state.emoji = !!elToggleEmoji?.checked;
    state.handMath = !!elToggleHand?.checked; // reserved
    state.sticky = !!elToggleSticky?.checked;

    state.hlStyle = elHlStyle?.value || "clean";
    state.fontPreset = elFontPreset?.value || "hand+rounded";
    state.bgStyle = elBgStyle?.value || "lined-light";
    state.paper = elPaper?.value || "letter";
    state.orientation = elOrientation?.value || "landscape";

    // Apply “tokens”
    setHighlightStyle(state.hlStyle);
    setFonts(state.fontPreset);
    setBackground(state.bgStyle);
    setOrientation(state.orientation);

    if (state.sticky) show(elStickyControls); else hide(elStickyControls);

    // Progress animation (simple + reliable)
    setProgress(5, "Thinking…");
    await new Promise(r => setTimeout(r, 80));
    setProgress(28, "Building layout…");
    await new Promise(r => setTimeout(r, 80));
    setProgress(55, "Writing sections…");
    await new Promise(r => setTimeout(r, 80));

    // Layout logic
    try {
      if (state.layout.startsWith("simple-")) {
        // Simple layouts render from Quick Template inputs
        renderSimple(state.layout);
      } else if (state.layout === "oscar") {
        buildOscar(topic);
      } else if (state.layout === "auto") {
        // Auto: if ELAR-ish topic → OSCAR, else Standard
        const sub = inferSubjectFromTopic(topic);
        if (sub === "elar") buildOscar(topic);
        else buildStandard(topic);
      } else {
        // For now: treat other AI layouts as “Standard”
        // (You can expand compare/cause/frayer/mathex later.)
        buildStandard(topic);
      }

      setProgress(100, "Done. Tweak anything, then download.");
    } catch (e) {
      console.error(e);
      setError("Something went wrong while creating the chart. Check Console for details.");
      setProgress(0, "Ready. Type a topic and hit Create.");
    }
  }

  // ----------------------------
  // Downloads (PNG / PDF)
  // ----------------------------
  async function downloadPNG() {
    if (!window.html2canvas) {
      alert("html2canvas failed to load.");
      return;
    }
    setProgress(20, "Rendering PNG…");
    const canvas = await window.html2canvas(elSheet, { scale: 2, backgroundColor: null });
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = `chartie-${Date.now()}.png`;
    a.click();
    setProgress(100, "PNG downloaded.");
    setTimeout(() => setProgress(0, "Ready. Type a topic and hit Create."), 700);
  }

  async function downloadPDF() {
    if (!window.jspdf?.jsPDF || !window.html2canvas) {
      alert("jsPDF/html2canvas failed to load.");
      return;
    }
    setProgress(20, "Rendering PDF…");
    const canvas = await window.html2canvas(elSheet, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const paperMap = {
      letter: [8.5, 11],
      a4: [8.27, 11.69],
      tabloid: [11, 17]
    };
    const size = paperMap[state.paper] || paperMap.letter;

    const landscape = state.orientation === "landscape";
    const pdf = new jsPDF({
      orientation: landscape ? "landscape" : "portrait",
      unit: "in",
      format: landscape ? [size[1], size[0]] : size
    });

    // Fit image to page
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "PNG", 0, 0, pageW, pageH);

    pdf.save(`chartie-${Date.now()}.pdf`);
    setProgress(100, "PDF downloaded.");
    setTimeout(() => setProgress(0, "Ready. Type a topic and hit Create."), 700);
  }

  // ----------------------------
  // Init
  // ----------------------------
  function bind() {
    // Button + Enter key
    elBtn?.addEventListener("click", generate);
    elTopic?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generate();
    });

    // Layout change
    elLayout?.addEventListener("change", handleLayoutUI);

    // Toggles update
    elToggleSticky?.addEventListener("change", () => {
      state.sticky = !!elToggleSticky.checked;
      if (state.sticky) show(elStickyControls); else hide(elStickyControls);
    });

    // Controls apply immediately (visual tokens)
    elHlStyle?.addEventListener("change", (e) => setHighlightStyle(e.target.value));
    elFontPreset?.addEventListener("change", (e) => setFonts(e.target.value));
    elBgStyle?.addEventListener("change", (e) => setBackground(e.target.value));
    elOrientation?.addEventListener("change", (e) => setOrientation(e.target.value));

    // Swatches
    swatches.forEach(btn => {
      btn.addEventListener("click", () => setAccent(btn.dataset.color || "#f59e0b"));
    });

    // Quick Template split buttons
    elQtSplitBlank?.addEventListener("click", () => qtSplit("blank"));
    elQtSplitLines?.addEventListener("click", () => qtSplit("lines"));

    // Downloads
    elBtnPNG?.addEventListener("click", downloadPNG);
    elBtnPDF?.addEventListener("click", downloadPDF);
  }

  function initDefaults() {
    // Set starting tokens (match your earlier “Initial styling” idea)
    setAccent("#f59e0b");
    setFonts(elFontPreset?.value || "hand+rounded");
    setBackground(elBgStyle?.value || "lined-light");
    setHighlightStyle(elHlStyle?.value || "clean");
    setOrientation(elOrientation?.value || "landscape");

    handleLayoutUI();
    setProgress(0, "Ready. Type a topic and hit Create.");
    setError("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    initDefaults();
  });
})();
