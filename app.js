/* Add pieces to this array. The generator below produces matching objects. */
const songs = [
  {
    title: "Blue Hour",
    type: ["Solo piano", "Piano"],
    participants: ["Josiah Reitenbach"],
    category: ["Character piece"],
    melody: ["Josiah Reitenbach"],
    words: [],
    arrangement: ["Josiah Reitenbach"],
    collection: { title: "Small Hours", number: 1 },
    description: "A quiet study in **blue light** and suspended harmony.",
    links: [
      { title: "Score", type: "PDF", content: "https://example.com/blue-hour.pdf" },
      { title: "Listen", type: "MP3", content: "https://example.com/blue-hour.mp3" }
    ]
  },
  {
    title: "The Cartographer's Dream",
    type: ["Chamber ensemble"],
    participants: ["Josiah Reitenbach", "Mira Chen"],
    category: ["Concert work"],
    melody: ["Josiah Reitenbach"],
    words: ["Mira Chen"],
    arrangement: [],
    collection: { title: "Small Hours", number: 2 },
    description: "Music for finding a way home.\n\n*Written for the North Street concert series.*\n\nMusic for finding a way home.\n\n*Written for the North Street concert series.*",
    links: [
      { title: "Lyrics", type: "Lyrics", content: "The map is folded / but the road is not gone." },
      { title: "MuseScore file", type: "MuseScore", content: "https://example.com/cartographers-dream.mscz" }
    ]
  },
  {
    title: "Three Windows",
    type: ["Song cycle", "Voice and piano"],
    participants: ["Josiah Reitenbach", "Ava Thomas"],
    category: ["Vocal music"],
    melody: ["Josiah Reitenbach"],
    words: ["Josiah Reitenbach"],
    arrangement: ["Josiah Reitenbach"],
    collection: { title: "Windows", number: 1 },
    description: "Three views of the same morning, set for voice and piano.",
    links: [
      { title: "MIDI sketch", type: "MIDI", content: "https://example.com/three-windows.mid" },
      { title: "Words", type: "Lyrics", content: "**I. Dawn**\n\nA window opens onto rain." }
    ]
  },
  {
    title: "Little March",
    type: ["Wind band"],
    participants: ["Josiah Reitenbach", "University Wind Ensemble"],
    category: ["March"],
    melody: ["Eleanor Voss"],
    words: [],
    arrangement: ["Josiah Reitenbach"],
    collection: { title: "Standalone", number: null },
    description: "An arrangement of Eleanor Voss's bright, quick-footed theme.",
    links: [
      { title: "Parts", type: "PDF", content: "https://example.com/little-march-parts.pdf" },
      { title: "Recording", type: "MP4", content: "https://example.com/little-march.mp4" }
    ]
  }
];

const multiAttributes = ["type", "participants", "category", "melody", "words", "arrangement"];
const filterState = Object.fromEntries(multiAttributes.map(key => [key, new Set()]));
const collectionState = new Set();
let searchTerm = "";

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
function markdown(text) {
  return String(text ?? "").split(/\n{2,}/).map(paragraph => {
    const safe = escapeHtml(paragraph)
      .replace(/^### (.*)$/gm, "<h4>$1</h4>")
      .replace(/^## (.*)$/gm, "<h3>$1</h3>")
      .replace(/^# (.*)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
    return /^<h[234]>/.test(safe) ? safe : `<p>${safe}</p>`;
  }).join("");
}
function markdownInline(text) {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
}
function uniqueValues(attribute) {
  return [...new Set(songs.flatMap(song => song[attribute] || []))].sort((a, b) => a.localeCompare(b));
}
function collectionNames() {
  return [...new Set(songs.map(song => song.collection?.title).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
function renderFilterGroups() {
  const container = $("#filterGroups");
  const attributeGroups = multiAttributes.map(attribute => {
    const values = uniqueValues(attribute);
    return `<section class="filter-group"><h3>${attribute}</h3><div class="filter-options">${values.map(value => {
      const count = songs.filter(song => (song[attribute] || []).includes(value)).length;
      const active = filterState[attribute].has(value) ? " active" : "";
      return `<button class="filter-option${active}" data-filter="${attribute}" data-value="${escapeHtml(value)}" type="button"><span>${escapeHtml(value)}</span><span class="count">${count}</span></button>`;
    }).join("")}</div></section>`;
  }).join("");
  const collectionGroup = `<section class="filter-group"><h3>collection</h3><div class="filter-options">${collectionNames().map(name => {
    const count = songs.filter(song => song.collection?.title === name).length;
    return `<button class="filter-option${collectionState.has(name) ? " active" : ""}" data-collection="${escapeHtml(name)}" type="button"><span>${escapeHtml(name)}</span><span class="count">${count}</span></button>`;
  }).join("")}</div></section>`;
  container.innerHTML = attributeGroups + collectionGroup;
}
function matches(song) {
  return multiAttributes.every(attribute => !filterState[attribute].size || [...filterState[attribute]].some(value => (song[attribute] || []).includes(value))) &&
    (!collectionState.size || collectionState.has(song.collection?.title)) &&
    (!searchTerm || song.title.toLowerCase().includes(searchTerm.toLowerCase()));
}
function renderCards() {
  let visible = songs.filter(matches);
  if (collectionState.size) visible = visible.slice().sort((a, b) => {
    const byCollection = (a.collection?.title || "").localeCompare(b.collection?.title || "");
    return byCollection || (a.collection?.number ?? Infinity) - (b.collection?.number ?? Infinity);
  });
  $("#resultCount").textContent = `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}`;
  $("#pageTitle").textContent = searchTerm || collectionState.size || multiAttributes.some(attribute => filterState[attribute].size) ? "Music matching your filters" : "Music by Josiah Reitenbach";
  $("#songGrid").innerHTML = visible.map((song, index) => cardTemplate(song, index)).join("");
  $("#emptyState").hidden = visible.length > 0;
  renderActiveFilters();
}
function cardTemplate(song, index) {
  const descriptionText = song.description || "";
  const shortDescription = descriptionText.length > 125 ? `${markdown(descriptionText.slice(0, 125).trimEnd())}…` : markdown(descriptionText);
  const collection = song.collection?.title ? `<span class="collection-label">${escapeHtml(song.collection.title)}${song.collection.number ? ` · ${song.collection.number}` : ""}</span>` : "";
  const tags = [...(song.type || []), ...(song.participants || []), ...(song.category || [])]
    .map(value => `<span class="meta-pill">${escapeHtml(value)}</span>`).join("");
  const credits = [
    ["Music", song.melody],
    ["Words", song.words],
    ["Arrangement", song.arrangement]
  ].map(([label, values]) => `<div class="credit-row"><span class="credit-label">${label}</span><span>${values?.length ? values.map(escapeHtml).join(", ") : "—"}</span></div>`).join("");
  const links = (song.links || []).map((link, linkIndex) => `<button class="link-button" type="button" data-song="${songs.indexOf(song)}" data-link="${linkIndex}">${escapeHtml(link.title)} <small>${escapeHtml(link.type)}</small></button>`).join("");
  const songIndex = songs.indexOf(song);
  return `<article class="song-card" data-detail="${songIndex}" tabindex="0" aria-label="View details for ${escapeHtml(song.title)}"><div class="card-top"><span class="song-number">${String(index + 1).padStart(2, "0")}</span>${collection}</div><div class="credit-list">${credits}</div><h2>${markdownInline(song.title)}</h2><div class="song-description">${shortDescription}${descriptionText.length > 125 ? ` <button class="expand-description" data-expand="${songIndex}" type="button">read more</button>` : ""}</div><div class="meta-list">${tags}</div><div class="song-details-hint">Click for all details ↗</div><div class="card-links">${links || `<span class="song-number">No links yet</span>`}</div></article>`;
}
function renderActiveFilters() {
  const tags = [];
  multiAttributes.forEach(attribute => filterState[attribute].forEach(value => tags.push(`<span class="active-tag">${escapeHtml(value)} <button type="button" data-remove="${attribute}" data-value="${escapeHtml(value)}" aria-label="Remove ${escapeHtml(value)}">×</button></span>`)));
  collectionState.forEach(value => tags.push(`<span class="active-tag">${escapeHtml(value)} <button type="button" data-remove-collection="${escapeHtml(value)}" aria-label="Remove collection ${escapeHtml(value)}">×</button></span>`));
  $("#activeFilters").innerHTML = tags.join("");
}
function resetFilters() {
  multiAttributes.forEach(attribute => filterState[attribute].clear());
  collectionState.clear();
  searchTerm = "";
  $("#searchInput").value = "";
  $("#clearSearch").style.display = "none";
  document.querySelectorAll(".shortcut-buttons button").forEach(button => button.classList.remove("active"));
  renderFilterGroups();
  renderCards();
}
function openLink(song, link) {
  const modal = $("#mediaModal");
  const content = $("#mediaContent");
  if (link.type === "Lyrics") {
    content.innerHTML = `<p class="eyebrow">Lyrics</p><h2>${escapeHtml(link.title)}</h2><div class="markdown-content"><p>${markdown(link.content)}</p></div>`;
  } else if (link.type === "MuseScore") {
    const anchor = document.createElement("a");
    anchor.href = link.content; anchor.download = ""; anchor.target = "_blank"; anchor.click();
    return;
  } else {
    const tag = link.type === "MP3" ? "audio" : link.type === "MP4" ? "video" : "iframe";
    const className = link.type === "MP3" ? "media-frame audio" : link.type === "MP4" ? "media-frame video" : "media-frame";
    content.innerHTML = `<p class="eyebrow">${escapeHtml(link.type)}</p><h2>${escapeHtml(song.title)} · ${escapeHtml(link.title)}</h2><${tag} class="${className}" src="${escapeHtml(link.content)}" controls ${tag === "iframe" ? 'title="Document preview"' : ""}></${tag}><a class="open-tab" href="${escapeHtml(link.content)}" target="_blank" rel="noopener">Open in new tab ↗</a>`;
  }
  modal.showModal();
}
document.addEventListener("click", event => {
  const expand = event.target.closest("[data-expand]");
  if (expand) {
    event.stopPropagation();
    showSongDetails(songs[Number(expand.dataset.expand)]);
    return;
  }
  const link = event.target.closest(".link-button");
  if (link) {
    event.stopPropagation();
    openLink(songs[Number(link.dataset.song)], songs[Number(link.dataset.song)].links[Number(link.dataset.link)]);
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    const { filter: attribute, value } = filter.dataset;
    filterState[attribute].has(value) ? filterState[attribute].delete(value) : filterState[attribute].add(value);
    renderFilterGroups(); renderCards();
  }
  const collectionFilter = event.target.closest("[data-collection]");
  if (collectionFilter) {
    const name = collectionFilter.dataset.collection;
    collectionState.has(name) ? collectionState.delete(name) : collectionState.add(name);
    renderFilterGroups(); renderCards();
    return;
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) { filterState[remove.dataset.remove].delete(remove.dataset.value); renderFilterGroups(); renderCards(); }
  const removeCollection = event.target.closest("[data-remove-collection]");
  if (removeCollection) { collectionState.delete(removeCollection.dataset.removeCollection); renderFilterGroups(); renderCards(); }
  const close = event.target.closest("[data-close]");
  if (close) $(`#${close.dataset.close}`).close();
  const card = event.target.closest("[data-detail]");
  if (card) showSongDetails(songs[Number(card.dataset.detail)]);
});
$("#songGrid").addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-detail]")) {
    event.preventDefault();
    showSongDetails(songs[Number(event.target.dataset.detail)]);
  }
});
function showSongDetails(song) {
  const attributes = [
    ["Type", song.type], ["Participants", song.participants], ["Category", song.category],
    ["Melody / music", song.melody], ["Words", song.words], ["Arrangement", song.arrangement]
  ];
  const details = attributes.map(([label, values]) => `<div class="detail-row"><dt>${label}</dt><dd>${values?.length ? values.map(value => `<span class="meta-pill">${escapeHtml(value)}</span>`).join(" ") : "—"}</dd></div>`).join("");
  const collection = song.collection?.title ? `${escapeHtml(song.collection.title)}${song.collection.number ? ` · No. ${song.collection.number}` : ""}` : "—";
  const links = (song.links || []).map((link, index) => `<button class="link-button" type="button" data-song="${songs.indexOf(song)}" data-link="${index}">${escapeHtml(link.title)} <small>${escapeHtml(link.type)}</small></button>`).join("");
  $("#detailContent").innerHTML = `<p class="eyebrow">Piece details</p><h2>${markdownInline(song.title)}</h2><dl class="detail-list">${details}<div class="detail-row"><dt>Collection</dt><dd>${collection}</dd></div></dl><section class="detail-description"><h3>Description</h3><div class="markdown-content">${markdown(song.description || "No description provided.")}</div></section><section class="detail-links"><h3>Links</h3><div class="card-links">${links || "<span class='song-number'>No links yet</span>"}</div></section>`;
  $("#detailModal").showModal();
}
$("#searchInput").addEventListener("input", event => { searchTerm = event.target.value.trim(); $("#clearSearch").style.display = searchTerm ? "block" : "none"; renderCards(); });
$("#clearSearch").addEventListener("click", () => { searchTerm = ""; $("#searchInput").value = ""; $("#clearSearch").style.display = "none"; renderCards(); });
$("#resetFilters").addEventListener("click", resetFilters);
$("#emptyReset").addEventListener("click", resetFilters);
$("#aboutTrigger").addEventListener("click", () => $("#aboutModal").showModal());
$("#addTrigger").addEventListener("click", () => { $("#generatorModal").showModal(); updateGeneratedCode(); });
document.querySelectorAll("[data-involvement]").forEach(button => button.addEventListener("click", () => {
  const mode = button.dataset.involvement;
  document.querySelectorAll("[data-involvement]").forEach(item => item.classList.toggle("active", item === button));
  multiAttributes.forEach(attribute => filterState[attribute].clear());
  if (mode === "words" || mode === "words-and-music") filterState.words.add("Josiah Reitenbach");
  if (mode === "words-and-music") filterState.melody.add("Josiah Reitenbach");
  if (mode === "arrangement") filterState.arrangement.add("Josiah Reitenbach");
  renderFilterGroups(); renderCards();
}));

const attributeEditors = $("#attributeEditors");
function renderAttributeEditors() {
  attributeEditors.innerHTML = multiAttributes.map(attribute => {
    const buttons = uniqueValues(attribute).map(value => `<button class="existing-value" data-existing-attribute="${attribute}" data-existing-value="${escapeHtml(value)}" type="button">+ ${escapeHtml(value)}</button>`).join("");
    return `<div class="attribute-row"><label>${attribute}</label><div class="value-inputs" data-attribute-values="${attribute}"><div class="existing-values">${buttons || "<span class='generator-hint'>No saved values yet</span>"}</div><div class="value-line"><input data-value-input="${attribute}" placeholder="Type a new ${attribute} value"><button class="remove-line" type="button" aria-label="Remove value">×</button></div><button class="small-add add-value" data-add-value="${attribute}" type="button">+ Add another value</button></div></div>`;
  }).join("") + `<div class="attribute-row"><label>collection</label><div class="value-inputs"><div class="existing-values">${collectionNames().map(value => `<button class="existing-value" data-existing-collection="${escapeHtml(value)}" type="button">+ ${escapeHtml(value)}</button>`).join("")}</div></div></div>`;
}
renderAttributeEditors();
function addAttributeValue(attribute, value = "", forceNew = false) {
  const container = document.querySelector(`[data-attribute-values="${attribute}"]`);
  const lines = [...container.querySelectorAll("[data-value-input]")];
  const duplicate = lines.some(input => input.value.trim().toLowerCase() === value.trim().toLowerCase());
  if (duplicate) return;
  const empty = forceNew ? null : lines.find(input => !input.value.trim());
  if (empty) {
    empty.value = value;
    updateGeneratedCode();
    return;
  }
  const line = document.createElement("div"); line.className = "value-line";
  line.innerHTML = `<input data-value-input="${attribute}" placeholder="Add another value"><button class="remove-line" type="button" aria-label="Remove value">×</button>`;
  container.insertBefore(line, container.querySelector(".add-value"));
  const input = line.querySelector("input");
  input.value = value;
  input.addEventListener("input", updateGeneratedCode);
  updateGeneratedCode();
}
function addLinkEditor() {
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `<input class="link-title" data-link-title placeholder="Title"><select data-link-type><option>MP4</option><option>MP3</option><option>MuseScore</option><option>MIDI</option><option>PDF</option><option>Lyrics</option></select><input data-link-content placeholder="URL or Markdown lyrics"><button class="remove-line" type="button" aria-label="Remove link">×</button>`;
  $("#linkEditors").append(row);
  row.querySelectorAll("input, select").forEach(input => input.addEventListener("input", updateGeneratedCode));
}
$("#addLink").addEventListener("click", addLinkEditor);
attributeEditors.addEventListener("click", event => {
  const existing = event.target.closest("[data-existing-attribute]");
  if (existing) {
    addAttributeValue(existing.dataset.existingAttribute, existing.dataset.existingValue);
    return;
  }
  const existingCollection = event.target.closest("[data-existing-collection]");
  if (existingCollection) {
    $("#generatorForm").elements.collectionTitle.value = existingCollection.dataset.existingCollection;
    updateGeneratedCode();
    return;
  }
  const add = event.target.closest("[data-add-value]");
  if (add) {
    addAttributeValue(add.dataset.addValue, "", true);
    return;
  }
  const remove = event.target.closest(".remove-line");
  if (remove && remove.closest(".value-line")) { remove.parentElement.remove(); updateGeneratedCode(); }
});
$("#generatorForm").addEventListener("input", updateGeneratedCode);
$("#linkEditors").addEventListener("click", event => { if (event.target.closest(".remove-line")) { event.target.closest(".link-row").remove(); updateGeneratedCode(); } });
function updateGeneratedCode() {
  const form = new FormData($("#generatorForm"));
  const object = {
    title: form.get("title") || "",
    type: [...document.querySelectorAll('[data-value-input="type"]')].map(input => input.value.trim()).filter(Boolean),
    participants: [...document.querySelectorAll('[data-value-input="participants"]')].map(input => input.value.trim()).filter(Boolean),
    category: [...document.querySelectorAll('[data-value-input="category"]')].map(input => input.value.trim()).filter(Boolean),
    melody: [...document.querySelectorAll('[data-value-input="melody"]')].map(input => input.value.trim()).filter(Boolean),
    words: [...document.querySelectorAll('[data-value-input="words"]')].map(input => input.value.trim()).filter(Boolean),
    arrangement: [...document.querySelectorAll('[data-value-input="arrangement"]')].map(input => input.value.trim()).filter(Boolean),
    collection: { title: form.get("collectionTitle") || "", number: form.get("collectionNumber") ? Number(form.get("collectionNumber")) : null },
    description: form.get("description") || "",
    links: [...document.querySelectorAll(".link-row")].map(row => ({ title: row.querySelector("[data-link-title]").value.trim(), type: row.querySelector("[data-link-type]").value, content: row.querySelector("[data-link-content]").value.trim() })).filter(link => link.title || link.content)
  };
  $("#generatedCode").value = JSON.stringify(object, null, 2) + ",";
}
$("#copyCode").addEventListener("click", async () => { await navigator.clipboard.writeText($("#generatedCode").value); $("#copyStatus").textContent = "Copied"; setTimeout(() => $("#copyStatus").textContent = "", 1800); });
renderFilterGroups(); renderCards();
