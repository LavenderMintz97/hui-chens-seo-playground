var $ = function (selector, root) {
  return (root || document).querySelector(selector);
};

var $$ = function (selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector));
};

var header = $(".site-header");
var menuToggle = $(".menu-toggle");

if (header && menuToggle) {
  menuToggle.addEventListener("click", function () {
    var isOpen = header.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".site-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      header.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

var filters = $$(".filter");
var projects = $$(".project-card");

filters.forEach(function (filter) {
  filter.addEventListener("click", function () {
    var category = filter.dataset.filter;

    filters.forEach(function (item) {
      item.classList.toggle("active", item === filter);
    });

    projects.forEach(function (project) {
      var shouldShow = category === "all" || project.dataset.category === category;
      project.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

var labTabs = $$(".lab-tab");
var labPanels = $$(".lab-panel");

labTabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    labTabs.forEach(function (item) {
      item.classList.toggle("active", item === tab);
    });

    labPanels.forEach(function (panel) {
      panel.classList.toggle("active", panel.dataset.labPanel === tab.dataset.labTool);
    });
  });
});

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function includesText(text, phrase) {
  return String(text || "").toLowerCase().indexOf(String(phrase || "").toLowerCase()) >= 0;
}

function scoreMeta() {
  var keyword = $("#labKeyword") ? $("#labKeyword").value.trim() : "";
  var title = $("#labTitle") ? $("#labTitle").value.trim() : "";
  var description = $("#labDescription") ? $("#labDescription").value.trim() : "";
  var output = $("#serpLabOutput");
  if (!output) return;

  var titleLengthScore = title.length >= 38 && title.length <= 62 ? 30 : title.length >= 28 && title.length <= 70 ? 22 : 12;
  var descriptionScore = description.length >= 115 && description.length <= 160 ? 30 : description.length >= 80 && description.length <= 175 ? 22 : 12;
  var keywordScore = keyword ? (includesText(title, keyword) ? 18 : 6) + (includesText(description, keyword) ? 12 : 4) : 10;
  var clarityScore = /search|seo|ai|growth|content|web|audit|system/i.test(title + " " + description) ? 10 : 4;
  var score = Math.min(100, titleLengthScore + descriptionScore + keywordScore + clarityScore);
  var label = score >= 85 ? "Strong SERP foundation" : score >= 70 ? "Healthy, with tuning room" : "Needs clearer search signal";
  var actions = [];

  if (title.length < 38) actions.push("Make the title more descriptive so it carries the page promise.");
  if (title.length > 62) actions.push("Move the strongest phrase earlier because long titles may truncate.");
  if (description.length < 115) actions.push("Add a sharper benefit, audience, and next action to the description.");
  if (description.length > 160) actions.push("Trim the description so important copy is less likely to truncate.");
  if (keyword && !includesText(title, keyword)) actions.push("Use the target keyword or a close variant in the title.");
  if (!actions.length) actions.push("Test a second version with a stronger proof point or audience qualifier.");

  output.innerHTML = '<div class="score-result"><div class="score-orb" style="--score:' + score + '">' + score + '</div><div><h3>' + label + '</h3><p>Title: ' + title.length + ' characters. Description: ' + description.length + ' characters.</p></div></div><h3>Recommended next moves</h3><ul>' + actions.map(function (action) {
    return "<li>" + escapeHtml(action) + "</li>";
  }).join("") + "</ul>";
}

function classifyKeyword(keyword) {
  var value = keyword.toLowerCase();
  var groups = {
    Informational: ["how", "what", "why", "guide", "checklist", "ideas", "learn", "example"],
    Commercial: ["best", "top", "compare", "tools", "consultant", "specialist", "agency"],
    Transactional: ["hire", "buy", "price", "cost", "service", "near me", "package"],
    Diagnostic: ["audit", "fix", "recover", "drop", "migration", "error", "issue"]
  };
  var winner = "Exploratory";
  var hits = 0;

  Object.keys(groups).forEach(function (group) {
    var count = groups[group].filter(function (term) {
      return value.indexOf(term) >= 0;
    }).length;
    if (count > hits) {
      hits = count;
      winner = group;
    }
  });

  return {
    intent: winner,
    confidence: hits ? Math.min(95, 58 + hits * 18) : 42
  };
}

function sortIntentLab() {
  var input = $("#intentKeywords");
  var output = $("#intentLabOutput");
  if (!input || !output) return;

  var buckets = {
    Informational: [],
    Commercial: [],
    Transactional: [],
    Diagnostic: [],
    Exploratory: []
  };

  input.value.split("\n").map(function (line) {
    return line.trim();
  }).filter(Boolean).forEach(function (keyword) {
    var result = classifyKeyword(keyword);
    buckets[result.intent].push({ keyword: keyword, confidence: result.confidence });
  });

  output.innerHTML = Object.keys(buckets).map(function (bucket) {
    var items = buckets[bucket].length ? buckets[bucket].map(function (item) {
      return "<li>" + escapeHtml(item.keyword) + "<small>" + item.confidence + "% confidence</small></li>";
    }).join("") : "<li>No keywords yet</li>";

    return '<section class="intent-bucket"><h3>' + bucket + '</h3><ul>' + items + '</ul></section>';
  }).join("");
}

function buildAuditLab() {
  var rawUrl = $("#auditUrl") ? $("#auditUrl").value.trim() : "";
  var pageType = $("#auditPageType") ? $("#auditPageType").value : "Page";
  var goal = $("#auditGoal") ? $("#auditGoal").value : "Lead enquiry";
  var concern = $("#auditConcern") ? $("#auditConcern").value : "Technical SEO";
  var output = $("#auditLabOutput");
  if (!output) return;

  var parsedUrl = null;
  try {
    parsedUrl = rawUrl ? new URL(rawUrl.indexOf("://") >= 0 ? rawUrl : "https://" + rawUrl) : null;
  } catch (error) {
    parsedUrl = null;
  }

  var path = parsedUrl ? parsedUrl.pathname : "";
  var slug = path.split("/").filter(Boolean).pop() || "";
  var foundationChecks = [
    {
      label: "Valid URL",
      passed: Boolean(parsedUrl),
      detail: parsedUrl ? parsedUrl.href : "Enter a valid URL so the lab can review the page foundation."
    },
    {
      label: "HTTPS protocol",
      passed: Boolean(parsedUrl && parsedUrl.protocol === "https:"),
      detail: parsedUrl && parsedUrl.protocol === "https:" ? "The URL uses HTTPS." : "Use HTTPS for trust, browser security, and modern SEO hygiene."
    },
    {
      label: "Readable slug",
      passed: Boolean(parsedUrl && (!slug || /^[a-z0-9-]+$/i.test(slug))),
      detail: !parsedUrl ? "Waiting for a valid URL." : slug ? "Slug reviewed: /" + slug : "Homepage URL detected; no slug needed."
    },
    {
      label: "No query clutter",
      passed: Boolean(parsedUrl && !parsedUrl.search),
      detail: parsedUrl && !parsedUrl.search ? "The URL is clean without tracking parameters." : "Remove unnecessary query parameters from canonical page URLs."
    },
    {
      label: "Focused page path",
      passed: Boolean(parsedUrl && path.length <= 80),
      detail: parsedUrl && path.length <= 80 ? "Path length looks manageable." : "Keep paths concise and descriptive where possible."
    }
  ];

  var concernActions = {
    "Technical SEO": ["Check indexability, canonical tags, redirects, and internal links.", "Run Core Web Vitals tests on the main template."],
    "Content clarity": ["Make the H1, intro, and CTA match one clear search intent.", "Add proof, examples, and FAQs near decision points."],
    "AI visibility": ["Answer direct questions in concise blocks.", "Add entity clarity around who, what, tools, services, and outcomes."],
    "Conversion flow": ["Reduce competing CTAs and make the next action obvious.", "Track the main conversion event in GA4 or GTM."]
  };

  var items = ["Confirm the page has one clear primary purpose for " + goal.toLowerCase() + ".", "Review title, meta description, H1, and first screen message alignment."].concat(concernActions[concern]);
  var passedCount = foundationChecks.filter(function (check) {
    return check.passed;
  }).length;
  var issueCount = foundationChecks.length - passedCount;

  output.innerHTML = '<div class="audit-summary"><span class="audit-pass">' + passedCount + ' passed</span><span class="' + (issueCount ? 'audit-issue' : 'audit-pass') + '">' + issueCount + ' issues</span></div><h3>' + escapeHtml(pageType) + ' foundation scan</h3><p>Priority lens: ' + escapeHtml(concern) + ' for ' + escapeHtml(goal).toLowerCase() + '.</p><div class="foundation-list">' + foundationChecks.map(function (check) {
    return '<div><span class="' + (check.passed ? 'audit-pass' : 'audit-issue') + '">' + (check.passed ? 'Passed' : 'Issue') + '</span><p><b>' + escapeHtml(check.label) + '</b><br>' + escapeHtml(check.detail) + '</p></div>';
  }).join("") + "</div><h3>Recommended next actions</h3><ul>" + items.map(function (item) {
    return "<li>" + escapeHtml(item) + "</li>";
  }).join("") + "</ul>";
}

if ($("#runSerpCheck")) {
  $("#runSerpCheck").addEventListener("click", scoreMeta);
  ["labKeyword", "labTitle", "labDescription"].forEach(function (id) {
    var field = $("#" + id);
    if (field) field.addEventListener("input", scoreMeta);
  });
  scoreMeta();
}

if ($("#sortIntentLab")) {
  $("#sortIntentLab").addEventListener("click", sortIntentLab);
  sortIntentLab();
}

if ($("#buildAuditLab")) {
  $("#buildAuditLab").addEventListener("click", buildAuditLab);
  ["auditUrl", "auditPageType", "auditGoal", "auditConcern"].forEach(function (id) {
    var field = $("#" + id);
    if (field) field.addEventListener("input", buildAuditLab);
    if (field) field.addEventListener("change", buildAuditLab);
  });
  buildAuditLab();
}

var navLinks = $$(".site-nav a");
var sections = navLinks
  .map(function (link) {
    var id = link.getAttribute("href");
    return id && id.indexOf("#") === 0 ? $(id) : null;
  })
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      navLinks.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });

  sections.forEach(function (section) {
    observer.observe(section);
  });
}
