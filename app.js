/* Add pieces to this array. The generator below produces matching objects. */
const songs = [
  {
    title: "We Will Serve the LORD",
    type: ["song"],
    participants: ["Voice"],
    category: ["hymn", "special music"],
    melody: ["Josiah Reitenbach"],
    words: ["Josiah Reitenbach"],
    arrangement: [],
    collection: {},
    description: "One of my first songs. I wrote it after my father, a pastor, preached on Joshua 24.",
    links: [
      { title: "Score", type: "PDF", content: "files/we-will-serve-the-lord/PDF.pdf" },
      { title: "Editable MSCZ", type: "MuseScore", content: "files/we-will-serve-the-lord/MuseScore.mscz" },
      { title: "Listen", type: "MIDI", content: "files/we-will-serve-the-lord/MIDI.mid" }
    ]
  },
  {
    title: "I Am the Door",
    type: ["song"],
    participants: ["Voice"],
    category: ["Scripture song"],
    melody: ["Josiah Reitenbach"],
    words: ["Josiah Reitenbach"],
    arrangement: [],
    collection: {},
    description: "A Scripture song I created on the spur of the moment when my mother said she needed one for John 10:9.",
    links: [
      { title: "Score", type: "PDF", content: "files/i-am-the-door/PDF.pdf" },
      { title: "Listen", type: "MIDI", content: "files/i-am-the-door/MIDI.mid" }
    ]
  },
  {
    title: "For Ever, O LORD",
    type: ["arrangement"],
    participants: ["Voice", "Piano"],
    category: ["Scripture song"],
    melody: ["Denise Sheperd"],
    words: ["Bible"],
    arrangement: ["Josiah Reitenbach"],
    collection: { title: "Children's class Scripture songs", number: 1 },
    description: "An arrangement for a children's class Scripture memorization song by a lady in my church.",
    links: [
      { title: "Score", type: "PDF", content: "files/for-ever-o-lord/PDF.pdf" },
      { title: "Audio", type: "MP3", content: "files/for-ever-o-lord/Audio.mp3" },
      { title: "Editable MSCZ", type: "MuseScore", content: "files/for-ever-o-lord/MuseScore.mscz" },
      { title: "Listen", type: "MIDI", content: "files/for-ever-o-lord/MIDI.mid" }
    ]
  },
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
let midiPlayback = null;
const midiInstrumentNames = [
  "acoustic_grand_piano", "bright_acoustic_piano", "electric_grand_piano", "honkytonk_piano",
  "electric_piano_1", "electric_piano_2", "harpsichord", "clavinet", "celesta", "glockenspiel",
  "music_box", "vibraphone", "marimba", "xylophone", "tubular_bells", "dulcimer", "drawbar_organ",
  "percussive_organ", "rock_organ", "church_organ", "reed_organ", "accordion", "harmonica",
  "tango_accordion", "acoustic_guitar_nylon", "acoustic_guitar_steel", "electric_guitar_jazz",
  "electric_guitar_clean", "electric_guitar_muted", "overdriven_guitar", "distortion_guitar",
  "guitar_harmonics", "acoustic_bass", "electric_bass_finger", "electric_bass_pick", "fretless_bass",
  "slap_bass_1", "slap_bass_2", "synth_bass_1", "synth_bass_2", "violin", "viola", "cello",
  "contrabass", "tremolo_strings", "pizzicato_strings", "orchestral_harp", "timpani", "string_ensemble_1",
  "string_ensemble_2", "synth_strings_1", "synth_strings_2", "choir_aahs", "voice_oohs", "synth_choir",
  "orchestra_hit", "trumpet", "trombone", "tuba", "muted_trumpet", "french_horn", "brass_section",
  "synth_brass_1", "synth_brass_2", "soprano_sax", "alto_sax", "tenor_sax", "baritone_sax", "oboe",
  "english_horn", "bassoon", "clarinet", "piccolo", "flute", "recorder", "pan_flute", "blown_bottle",
  "shakuhachi", "whistle", "ocarina", "lead_1_square", "lead_2_sawtooth", "lead_3_calliope",
  "lead_4_chiff", "lead_5_charang", "lead_6_voice", "lead_7_fifths", "lead_8_bass__lead", "pad_1_new_age",
  "pad_2_warm", "pad_3_polysynth", "pad_4_choir", "pad_5_bowed", "pad_6_metallic", "pad_7_halo",
  "pad_8_sweep", "fx_1_rain", "fx_2_soundtrack", "fx_3_crystal", "fx_4_atmosphere", "fx_5_brightness",
  "fx_6_goblins", "fx_7_echoes", "fx_8_scifi", "sitar", "banjo", "shamisen", "koto", "kalimba",
  "bagpipe", "fiddle", "shanai", "tinkle_bell", "agogo", "steel_drums", "woodblock", "taiko_drum",
  "melodic_tom", "synth_drum", "reverse_cymbal", "guitar_fret_noise", "breath_noise", "seashore",
  "bird_tweet", "telephone_ring", "helicopter", "applause", "gunshot"
];
function parseMidi(buffer) {
  const bytes = new Uint8Array(buffer);
  const readAscii = offset => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  const readUint16 = offset => {
    if (offset + 2 > bytes.length) throw new Error("The MIDI file is truncated.");
    return (bytes[offset] << 8) | bytes[offset + 1];
  };
  const readUint32 = offset => {
    if (offset + 4 > bytes.length) throw new Error("The MIDI file is truncated.");
    return (bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
  };
  if (readAscii(0) !== "MThd") throw new Error("This link did not return a standard MIDI file.");
  const headerLength = readUint32(4);
  if (headerLength < 6 || 8 + headerLength > bytes.length) throw new Error("The MIDI header is incomplete.");
  const format = readUint16(8);
  const trackCount = readUint16(10);
  const division = readUint16(12);
  if (format > 1) throw new Error("This MIDI format is not supported; use a type 0 or type 1 MIDI file.");
  if (!trackCount) throw new Error("The MIDI file contains no tracks.");
  if (division & 0x8000) throw new Error("SMPTE-timed MIDI files are not supported yet.");
  if (!division) throw new Error("The MIDI file has an invalid timing resolution.");

  const notes = [];
  const tracks = [];
  const tempoEvents = [];
  let offset = 8 + headerLength;
  let tracksRead = 0;

  while (offset + 8 <= bytes.length && tracksRead < trackCount) {
    const chunkName = readAscii(offset);
    const chunkLength = readUint32(offset + 4);
    const trackStart = offset + 8;
    const trackEnd = trackStart + chunkLength;
    if (trackEnd > bytes.length) throw new Error("A MIDI track is truncated.");
    offset = trackEnd;
    if (chunkName !== "MTrk") continue;
    tracksRead++;
    const track = { index: tracks.length, name: "", programs: new Set(), programsByChannel: new Map() };
    tracks.push(track);

    let cursor = trackStart;
    let tick = 0;
    let runningStatus = 0;
    const openNotes = new Map();
    const readVariableLength = () => {
      let value = 0;
      for (let count = 0; count < 4; count++) {
        if (cursor >= trackEnd) throw new Error("A MIDI event is truncated.");
        const byte = bytes[cursor++];
        value = (value << 7) | (byte & 0x7f);
        if (!(byte & 0x80)) return value;
      }
      throw new Error("The MIDI file contains an invalid variable-length value.");
    };
    const readDataByte = () => {
      if (cursor >= trackEnd || bytes[cursor] & 0x80) throw new Error("A MIDI event contains invalid data.");
      return bytes[cursor++];
    };

    while (cursor < trackEnd) {
      tick += readVariableLength();
      if (cursor >= trackEnd) throw new Error("A MIDI event is truncated.");
      let status = bytes[cursor];
      let firstData = null;
      if (status & 0x80) {
        cursor++;
        if (status < 0xf0) runningStatus = status;
        else if (status !== 0xff) runningStatus = 0;
      } else {
        if (!runningStatus) throw new Error("The MIDI file contains an invalid running status.");
        status = runningStatus;
        firstData = bytes[cursor++];
      }

      if (status === 0xff) {
        if (cursor >= trackEnd) throw new Error("A MIDI meta event is truncated.");
        const metaType = bytes[cursor++];
        const length = readVariableLength();
        if (cursor + length > trackEnd) throw new Error("A MIDI meta event is truncated.");
        if ((metaType === 0x03 || metaType === 0x04) && length) {
          const value = new TextDecoder().decode(bytes.subarray(cursor, cursor + length)).trim();
          if (metaType === 0x03) track.name = value;
        }
        if (metaType === 0x51 && length === 3) {
          const microsecondsPerBeat = (bytes[cursor] << 16) | (bytes[cursor + 1] << 8) | bytes[cursor + 2];
          if (microsecondsPerBeat) tempoEvents.push({ tick, microsecondsPerBeat, order: tempoEvents.length });
        }
        cursor += length;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        cursor += readVariableLength();
        if (cursor > trackEnd) throw new Error("A MIDI system event is truncated.");
        continue;
      }
      if (status >= 0xf0) throw new Error("The MIDI file contains an unsupported system event.");

      const command = status >> 4;
      const channel = status & 0x0f;
      const first = firstData === null ? readDataByte() : firstData;
      const second = command === 0x0c || command === 0x0d ? 0 : readDataByte();
      if (command === 0x0c) {
        track.programsByChannel.set(channel, first);
        continue;
      }
      if (command !== 0x08 && command !== 0x09) continue;

      const pitch = first;
      const key = `${channel}:${pitch}`;
      if (command === 0x09 && second > 0) {
        const program = track.programsByChannel.get(channel) ?? 0;
        const note = { pitch, velocity: second, trackIndex: track.index, program, startTick: tick, endTick: null };
        track.programs.add(program);
        notes.push(note);
        if (!openNotes.has(key)) openNotes.set(key, []);
        openNotes.get(key).push(note);
      } else {
        const queued = openNotes.get(key);
        if (queued?.length) {
          const note = queued.shift();
          note.endTick = Math.max(tick, note.startTick + 1);
          if (!queued.length) openNotes.delete(key);
        }
      }
    }

    for (const queued of openNotes.values()) {
      queued.forEach(note => { note.endTick = Math.max(tick, note.startTick + division); });
    }
  }

  if (tracksRead !== trackCount) throw new Error("The MIDI file is missing one or more tracks.");
  if (!notes.length) throw new Error("No playable notes were found in the MIDI file.");
  notes.forEach(note => { if (note.endTick === null) note.endTick = note.startTick + division; });

  tempoEvents.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const tempoSegments = [{ tick: 0, seconds: 0, microsecondsPerBeat: 500000 }];
  tempoEvents.forEach(event => {
    const previous = tempoSegments[tempoSegments.length - 1];
    if (event.tick === previous.tick) {
      previous.microsecondsPerBeat = event.microsecondsPerBeat;
    } else {
      const seconds = previous.seconds + (event.tick - previous.tick) * previous.microsecondsPerBeat / division / 1000000;
      tempoSegments.push({ tick: event.tick, seconds, microsecondsPerBeat: event.microsecondsPerBeat });
    }
  });
  const toSeconds = targetTick => {
    let low = 0;
    let high = tempoSegments.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (tempoSegments[middle].tick <= targetTick) low = middle;
      else high = middle - 1;
    }
    const segment = tempoSegments[low];
    return segment.seconds + (targetTick - segment.tick) * segment.microsecondsPerBeat / division / 1000000;
  };
  const activeTracks = tracks.filter(track => track.programs.size);
  const trackIndexes = new Map(activeTracks.map((track, index) => [track.index, index]));
  const timedNotes = notes.map(note => ({
    pitch: note.pitch,
    velocity: note.velocity,
    trackIndex: trackIndexes.get(note.trackIndex),
    program: note.program,
    start: toSeconds(note.startTick),
    end: toSeconds(note.endTick)
  })).sort((a, b) => a.start - b.start);
  activeTracks.forEach((track, index) => {
    track.index = index;
    track.programs = [...track.programs];
    track.color = `hsl(${Math.round(index * 137.508 % 360)}, 80%, 68%)`;
  });
  const duration = timedNotes.reduce((longest, note) => Math.max(longest, note.end), 0);
  const lowestPitch = timedNotes.reduce((lowest, note) => Math.min(lowest, note.pitch), 127);
  const highestPitch = timedNotes.reduce((highest, note) => Math.max(highest, note.pitch), 0);
  return { notes: timedNotes, tracks: activeTracks, duration, lowestPitch, highestPitch };
}
function setMidiStatus(state, message, type = "ready") {
  if (!state.status.isConnected) return;
  state.status.hidden = type !== "error";
  state.status.textContent = type === "error" ? message : "";
}
function formatMidiTime(seconds, showTenths = false) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const tenths = Math.floor(Math.max(0, seconds) * 10) % 10;
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}${showTenths ? `.${tenths}` : ""}`;
}
function currentMidiPosition(state) {
  if (!state.playing || !state.context) return state.position;
  return Math.min(state.duration, state.anchorPosition + state.context.currentTime - state.anchorContextTime);
}
function updateMidiControls(state) {
  const loaded = Boolean(state.notes);
  state.playButton.disabled = !loaded || state.starting;
  state.playButton.dataset.playing = String(state.playing);
  state.playButton.setAttribute("aria-label", state.playing ? "Pause" : "Play");
  state.backButton.disabled = !loaded || state.position <= 0;
  state.forwardButton.disabled = !loaded || state.position >= state.duration;
  const showTenths = state.duration < 10;
  state.clock.textContent = `${formatMidiTime(state.position, showTenths)} / ${formatMidiTime(state.duration, showTenths)}`;
}
function drawMidiRoll(state) {
  if (!state.notes || !state.canvas.isConnected) return;
  const bounds = state.canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(bounds.width * ratio);
  const pixelHeight = Math.round(bounds.height * ratio);
  if (state.canvas.width !== pixelWidth || state.canvas.height !== pixelHeight) {
    state.canvas.width = pixelWidth;
    state.canvas.height = pixelHeight;
  }
  const context = state.canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = bounds.width;
  const height = bounds.height;
  const center = width / 2;
  const position = state.position;
  const pixelsPerSecond = 62;
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#102b3c");
  background.addColorStop(0.55, "#163a4a");
  background.addColorStop(1, "#10293a");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const visibleStart = position - center / pixelsPerSecond;
  const visibleEnd = position + (width - center) / pixelsPerSecond;
  for (let second = Math.floor(visibleStart); second <= visibleEnd; second++) {
    const x = center + (second - position) * pixelsPerSecond;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.strokeStyle = second % 4 === 0 ? "rgba(175, 222, 235, .16)" : "rgba(175, 222, 235, .07)";
    context.lineWidth = second % 4 === 0 ? 1 : 0.6;
    context.stroke();
  }

  const lowestPitch = Math.max(0, state.lowestPitch - 3);
  const highestPitch = Math.min(127, state.highestPitch + 3);
  const pitchCount = highestPitch - lowestPitch + 1;
  const rowHeight = height / pitchCount;
  for (let pitch = lowestPitch; pitch <= highestPitch; pitch++) {
    const y = height - (pitch - lowestPitch) * rowHeight;
    if (pitch % 12 === 0) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.strokeStyle = "rgba(175, 222, 235, .12)";
      context.lineWidth = 0.8;
      context.stroke();
    }
  }

  state.notes.forEach(note => {
    const x = center + (note.start - position) * pixelsPerSecond;
    const noteWidth = Math.max(4, (note.end - note.start) * pixelsPerSecond);
    if (x > width || x + noteWidth < 0) return;
    const y = height - (note.pitch - lowestPitch + 1) * rowHeight + Math.max(1, rowHeight * .14);
    const noteHeight = Math.max(2, rowHeight * .72);
    const track = state.tracks[note.trackIndex];
    if (!state.selectedTracks.has(note.trackIndex)) return;
    const brightness = .62 + note.velocity / 127 * .3;
    const active = position >= note.start && position < note.end;
    context.globalAlpha = active ? 1 : brightness;
    context.shadowBlur = active ? 17 : 8;
    context.shadowColor = track.color;
    const fill = context.createLinearGradient(x, y, x, y + noteHeight);
    fill.addColorStop(0, track.color);
    fill.addColorStop(1, track.color);
    context.fillStyle = fill;
    context.fillRect(x, y, Math.min(noteWidth, width - x), noteHeight);
  });
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  context.beginPath();
  context.moveTo(center, 0);
  context.lineTo(center, height);
  context.strokeStyle = "rgba(139, 244, 249, .95)";
  context.lineWidth = 1.5;
  context.shadowColor = "rgba(92, 228, 242, .8)";
  context.shadowBlur = 9;
  context.stroke();
  context.shadowBlur = 0;
}
function updateMidiView(state) {
  state.position = currentMidiPosition(state);
  updateMidiControls(state);
  drawMidiRoll(state);
}
function stopMidiVoices(state) {
  if (!state.context) return;
  const now = state.context.currentTime;
  [...state.voices].forEach(voice => {
    if (voice.ended) return;
    try {
      voice.stop(now + 0.025);
    } catch (error) {
      if (error.name !== "InvalidStateError") throw error;
    }
  });
  state.voices = [];
}
function selectedMidiPrograms(state) {
  const programs = new Set();
  state.notes.forEach(note => {
    if (state.selectedTracks.has(note.trackIndex)) {
      programs.add(state.pianoOverride.checked ? 0 : note.program);
    }
  });
  return [...programs];
}
async function loadMidiInstrument(state, program) {
  if (!state.instrumentPromises.has(program)) {
    if (!window.Soundfont) throw new Error("The sampled instrument library did not load. Check your internet connection and try again.");
    const instrumentName = midiInstrumentNames[program];
    const loading = window.Soundfont.instrument(state.context, instrumentName, {
      soundfont: "FluidR3_GM",
      destination: state.masterGain
    }).then(instrument => {
      state.instrumentPromises.set(program, instrument);
      return instrument;
    }).catch(error => {
      state.instrumentPromises.delete(program);
      throw new Error(`Could not load the ${instrumentName.replaceAll("_", " ")} soundfont: ${error.message}`);
    });
    state.instrumentPromises.set(program, loading);
  }
  return state.instrumentPromises.get(program);
}
function scheduleMidiNotes(state) {
  const context = state.context;
  const now = context.currentTime + 0.015;
  state.notes.forEach(note => {
    if (!state.selectedTracks.has(note.trackIndex)) return;
    if (note.end <= state.position) return;
    const start = now + Math.max(0, note.start - state.position);
    const player = state.instrumentPromises.get(state.pianoOverride.checked ? 0 : note.program);
    if (!player || typeof player.then === "function") return;
    const voice = player.play(note.pitch, start, {
      duration: Math.max(0.03, note.end - Math.max(note.start, state.position)),
      gain: note.velocity / 127 * 0.24
    });
    voice.onended = () => {
      voice.ended = true;
      state.voices = state.voices.filter(item => item !== voice);
    };
    state.voices.push(voice);
  });
}
function animateMidiPlayback(state) {
  if (midiPlayback !== state || !state.playing) return;
  state.position = currentMidiPosition(state);
  if (state.position >= state.duration) {
    state.position = state.duration;
    state.playing = false;
    stopMidiVoices(state);
    updateMidiView(state);
    return;
  }
  updateMidiView(state);
  state.frame = requestAnimationFrame(() => animateMidiPlayback(state));
}
async function playMidi(state) {
  if (!state.notes || state.playing || state.starting) return;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) throw new Error("Web Audio is not available in this browser.");
  state.starting = true;
  updateMidiControls(state);
  try {
    if (!state.context) {
      state.context = new AudioContextConstructor();
      state.masterGain = state.context.createGain();
      state.masterGain.gain.value = 0.55;
      state.masterGain.connect(state.context.destination);
    }
    await state.context.resume();
    while (midiPlayback === state && state.starting) {
      const requiredPrograms = selectedMidiPrograms(state);
      await Promise.all(requiredPrograms.map(program => loadMidiInstrument(state, program)));
      const remainingPrograms = selectedMidiPrograms(state);
      if (requiredPrograms.length === remainingPrograms.length && requiredPrograms.every(program => remainingPrograms.includes(program))) break;
    }
  } catch (error) {
    state.starting = false;
    updateMidiControls(state);
    throw error;
  }
  if (midiPlayback !== state || !state.starting) return;
  state.starting = false;
  if (state.position >= state.duration) state.position = 0;
  state.playing = true;
  state.anchorPosition = state.position;
  state.anchorContextTime = state.context.currentTime;
  scheduleMidiNotes(state);
  updateMidiView(state);
  state.frame = requestAnimationFrame(() => animateMidiPlayback(state));
}
function pauseMidi(state) {
  if (!state.playing) return;
  state.position = currentMidiPosition(state);
  state.playing = false;
  cancelAnimationFrame(state.frame);
  stopMidiVoices(state);
  updateMidiView(state);
}
function seekMidi(state, offset) {
  if (!state.notes) return;
  state.position = Math.max(0, Math.min(state.duration, currentMidiPosition(state) + offset));
  if (state.playing) {
    stopMidiVoices(state);
    state.anchorPosition = state.position;
    state.anchorContextTime = state.context.currentTime;
    scheduleMidiNotes(state);
  }
  updateMidiView(state);
}
function updateMidiSelection(state) {
  state.selectedTracks = new Set([...state.trackList.querySelectorAll("input:checked")].map(input => Number(input.value)));
  if (state.playing) rescheduleMidiPlayback(state);
  drawMidiRoll(state);
}
async function rescheduleMidiPlayback(state) {
  const version = ++state.scheduleVersion;
  state.position = currentMidiPosition(state);
  stopMidiVoices(state);
  state.anchorPosition = state.position;
  state.anchorContextTime = state.context.currentTime;
  try {
    await Promise.all(selectedMidiPrograms(state).map(program => loadMidiInstrument(state, program)));
    if (midiPlayback !== state || !state.playing || state.scheduleVersion !== version) return;
    state.position = currentMidiPosition(state);
    state.anchorPosition = state.position;
    state.anchorContextTime = state.context.currentTime;
    scheduleMidiNotes(state);
  } catch (error) {
    if (midiPlayback === state && state.scheduleVersion === version) {
      console.error("MIDI instrument could not be changed:", error);
      setMidiStatus(state, `Playback error: ${error.message}`, "error");
    }
  }
}
function stopMidiPlayback() {
  if (!midiPlayback) return;
  const state = midiPlayback;
  midiPlayback = null;
  state.controller.abort();
  state.playing = false;
  cancelAnimationFrame(state.frame);
  window.removeEventListener("resize", state.resize);
  if (state.resizeObserver) state.resizeObserver.disconnect();
  stopMidiVoices(state);
  if (state.context && state.context.state !== "closed") {
    state.context.close().catch(error => console.error("Could not close the MIDI audio context:", error));
  }
}
async function loadMidiPlayer(state, source) {
  const url = new URL(source, window.location.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Use a direct HTTP or HTTPS link to the MIDI file.");
  }
  const response = await fetch(url.href, { signal: state.controller.signal });
  if (!response.ok) throw new Error(`The MIDI request failed (${response.status}).`);
  const parsed = parseMidi(await response.arrayBuffer());
  if (midiPlayback !== state) return;
  state.notes = parsed.notes;
  state.tracks = parsed.tracks;
  state.selectedTracks = new Set(state.tracks.map(track => track.index));
  state.tracks.forEach(track => {
    const option = document.createElement("label");
    option.className = "midi-track-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(track.index);
    checkbox.checked = true;
    const color = document.createElement("span");
    color.className = "midi-track-color";
    color.style.backgroundColor = track.color;
    const name = document.createElement("span");
    const programs = track.programs.map(program => midiInstrumentNames[program].replaceAll("_", " "));
    const sameName = track.name ? state.tracks.filter(item => item.name === track.name) : [];
    const duplicateSuffix = sameName.length > 1 ? ` (${sameName.indexOf(track) + 1})` : "";
    name.textContent = `${track.name || `Track ${track.index + 1}`}${duplicateSuffix}${programs.length ? ` · ${[...new Set(programs)].join(", ")}` : ""}`;
    option.append(checkbox, color, name);
    state.trackList.append(option);
  });
  state.trackList.addEventListener("change", () => updateMidiSelection(state));
  state.pianoOverride.addEventListener("change", () => {
    if (state.playing) rescheduleMidiPlayback(state);
  });
  state.duration = parsed.duration;
  state.lowestPitch = parsed.lowestPitch;
  state.highestPitch = parsed.highestPitch;
  state.position = 0;
  state.canvas.setAttribute("aria-label", `Piano roll with ${state.notes.length} notes; notes scroll right to left past the center playhead`);
  setMidiStatus(state, "");
  updateMidiView(state);
}
function openMidiPlayer(song, link) {
  const content = $("#mediaContent");
  content.replaceChildren($("#midiPlayerTemplate").content.cloneNode(true));
  const state = {
    controller: new AbortController(),
    canvas: content.querySelector("[data-midi-roll]"),
    status: content.querySelector("[data-midi-status]"),
    clock: content.querySelector("[data-midi-clock]"),
    playButton: content.querySelector('[data-midi-action="toggle"]'),
    backButton: content.querySelector('[data-midi-action="back"]'),
    forwardButton: content.querySelector('[data-midi-action="forward"]'),
    trackList: content.querySelector("[data-midi-track-list]"),
    pianoOverride: content.querySelector("[data-midi-piano-override]"),
    sourceLink: content.querySelector("[data-midi-source]"),
    notes: null,
    duration: 0,
    position: 0,
    playing: false,
    context: null,
    masterGain: null,
    voices: [],
    instrumentPromises: new Map(),
    tracks: [],
    selectedTracks: new Set(),
    scheduleVersion: 0,
    starting: false,
    frame: 0
  };
  updateMidiControls(state);
  content.querySelector("[data-midi-title]").textContent = `${song.title} · ${link.title}`;
  state.sourceLink.href = link.content;
  state.resize = () => drawMidiRoll(state);
  window.addEventListener("resize", state.resize);
  if ("ResizeObserver" in window) {
    state.resizeObserver = new ResizeObserver(state.resize);
    state.resizeObserver.observe(state.canvas);
  }
  midiPlayback = state;
  $("#mediaModal").showModal();
  loadMidiPlayer(state, link.content).catch(error => {
    if (midiPlayback !== state || state.controller.signal.aborted) return;
    console.error("MIDI player could not load the file:", error);
    const detail = error instanceof TypeError
      ? "The file could not be fetched. Check the URL and that its host permits browser access (CORS)."
      : error.message;
    setMidiStatus(state, `Could not load MIDI: ${detail}`, "error");
  });
}
function openLink(song, link) {
  const modal = $("#mediaModal");
  const content = $("#mediaContent");
  stopMidiPlayback();
  if (link.type === "MIDI") {
    openMidiPlayer(song, link);
    return;
  }
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
  const midiAction = event.target.closest("[data-midi-action]");
  if (midiAction) {
    event.preventDefault();
    event.stopPropagation();
    const state = midiPlayback;
    if (!state) return;
    const action = midiAction.dataset.midiAction;
    const actionPromise = action === "toggle"
      ? state.playing ? Promise.resolve(pauseMidi(state)) : playMidi(state)
      : Promise.resolve(seekMidi(state, action === "back" ? -10 : 10));
    actionPromise.catch(error => {
      if (midiPlayback !== state) return;
      console.error("MIDI playback failed:", error);
      setMidiStatus(state, `Playback error: ${error.message}`, "error");
    });
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
$("#mediaModal").addEventListener("close", stopMidiPlayback);
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
