// --------------------
// Global Chart Settings (Teacher Toggles)
// --------------------
const chartSettings = {
  grade: "middle",     // elementary | middle | high
  subject: "elar",     // elar | ss
  mode: "full"         // quick | full | student
};

function updateSetting(key, value) {
  chartSettings[key] = value;
}

// --------------------
// Language Banks
// --------------------
const objectiveLanguage = {
  elementary: {
    elar: topic => `We are learning about ${topic}.`,
    ss: topic => `We are learning about ${topic} in history.`
  },
  middle: {
    elar: topic => `We are learning how ${topic} is explained in a text.`,
    ss: topic => `We are learning how ${topic} affected events in history.`
  },
  high: {
    elar: topic => `We are analyzing how ${topic} develops meaning in a text.`,
    ss: topic => `We are evaluating how ${topic} influenced historical outcomes.`
  }
};

const conceptBank = {
  elar: [
    "Evidence",
    "Author’s purpose",
    "Text structure"
  ],
  ss: [
    "Cause and effect",
    "Historical context",
    "Perspective"
  ]
};

const academicLanguage = {
  elar: ["analyze", "infer", "cite evidence", "explain"],
  ss: ["explain", "justify", "evaluate", "because"]
};

const reviewPrompts = {
  quick: [
    "What did we learn?"
  ],
  full: [
    "What did we learn today?",
    "What evidence supports our thinking?"
  ],
  student: [
    "I learned that…",
    "One example is…"
  ]
};

// --------------------
// OSCAR Section Builder
// --------------------
function getOscarSections(topic) {
  const { grade, subject, mode } = chartSettings;

  return [
    {
      title: "Objective",
      items: [
        objectiveLanguage[grade][subject](topic)
      ]
    },
    {
      title: "Steps",
      items: [
        "Read the information carefully",
        "Identify key details",
        "Organize thinking clearly"
      ]
    },
    {
      title: "Concepts",
      items: conceptBank[subject]
    },
    {
      title: "Academic Language",
      items: academicLanguage[subject]
    },
    {
      title: "Review",
      items: reviewPrompts[mode]
    }
  ];
}

// --------------------
// Render Chart
// --------------------
function buildChart() {
  const topic = document.getElementById("topicInput").value.trim();
  if (!topic) {
    alert("Type a lesson topic first.");
    return;
  }

  const chartArea = document.getElementById("chartArea");
  chartArea.innerHTML = "";

  const sections = getOscarSections(topic);

  sections.forEach(section => {
    const box = document.createElement("div");
    box.className = "chart-box";

    const h2 = document.createElement("h2");
    h2.textContent = section.title;

    const ul = document.createElement("ul");
    section.items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });

    box.appendChild(h2);
    box.appendChild(ul);
    chartArea.appendChild(box);
  });
}
