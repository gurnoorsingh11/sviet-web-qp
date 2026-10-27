const $ = (id) => document.getElementById(id);
const MARK_OPTIONS = [2, 4, 5, 8, 10];
const state = {
  bankA: [], bankLong: [], selected: null,
  fileA: null, fileLong: null,
};

const today = new Date();
$('exam_date').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

function showNotice(message, isError = false) {
  const notice = $('notice');
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.classList.remove('hidden');
  notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideNotice() { $('notice').classList.add('hidden'); }
function listFromTextarea(id) {
  return $(id).value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}
function dedupe(list) {
  const seen = new Set();
  return list.map(x => x.trim()).filter(x => {
    const key = x.toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
function invalidatePaper() {
  state.selected = null;
  $('preview-content').classList.add('hidden');
  $('empty-preview').classList.remove('hidden');
  $('preview-badge').classList.remove('ready');
  $('preview-badge').textContent = 'NOT GENERATED';
}
function syncBanks() {
  state.bankA = dedupe(listFromTextarea('bank-a'));
  state.bankLong = dedupe(listFromTextarea('bank-long'));
  $('count-a').textContent = `${state.bankA.length} question${state.bankA.length === 1 ? '' : 's'}`;
  $('count-long').textContent = `${state.bankLong.length} question${state.bankLong.length === 1 ? '' : 's'}`;
  updateAvailability();
}
function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function randomPick(pool, count) { return shuffle(pool).slice(0, Math.min(Math.max(0, count), pool.length)); }
function intValue(id, fallback = 0) {
  const n = Number.parseInt($(id).value, 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(200, n)) : fallback;
}
function updateAvailability() {
  const a = intValue('count_a', 10), b = intValue('count_b', 4), c = intValue('count_c', 4);
  const bits = [];
  if (a > state.bankA.length) bits.push(`Section A requested ${a} questions, but only ${state.bankA.length} are available; all available questions will be used.`);
  if (b + c > state.bankLong.length) bits.push(`Sections B and C request ${b+c} long questions, but only ${state.bankLong.length} are available. Questions will not be duplicated.`);
  const box = $('availability-note');
  if (bits.length) { box.textContent = bits.join(' '); box.classList.remove('hidden'); }
  else box.classList.add('hidden');
}
function selectAll() {
  syncBanks();
  const aCount = intValue('count_a', 10), bCount = intValue('count_b', 4), cCount = intValue('count_c', 4);
  state.selected = {
    A: randomPick(state.bankA, aCount),
    B: [], C: [],
  };
  const long = shuffle(state.bankLong);
  state.selected.B = long.slice(0, Math.min(bCount, long.length));
  state.selected.C = long.slice(state.selected.B.length, state.selected.B.length + cCount);
  renderPreview();
  $('preview-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function shuffleSection(key) {
  if (!state.selected) return;
  syncBanks();
  if (key === 'A') {
    state.selected.A = randomPick(state.bankA, intValue('count_a', 10));
  } else {
    const other = key === 'B' ? 'C' : 'B';
    const reserved = new Set(state.selected[other] || []);
    const pool = state.bankLong.filter(q => !reserved.has(q));
    state.selected[key] = randomPick(pool, intValue(key === 'B' ? 'count_b' : 'count_c', 4));
  }
  renderPreview();
}
function readMeta() {
  const examDate = $('exam_date').value;
  let formattedDate = '';
  if (examDate) {
    const [y,m,d] = examDate.split('-'); formattedDate = `${d}-${m}-${y}`;
  }
  return {
    college: $('college').value.trim(),
    degree_semester: $('degree_semester').value.trim(),
    subject: $('subject').value.trim(),
    subject_code: $('subject_code').value.trim(),
    m_code: $('m_code').value.trim(),
    exam_date: formattedDate,
    duration: $('duration').value.trim(),
    maximum_marks: Math.max(1, Number.parseInt($('maximum_marks').value || '60', 10)),
  };
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function sectionHtml(title, questions, key, marks = null) {
  const heading = `<div class="paper-section-title">${title}</div>`;
  if (!questions.length) return heading + '<p class="paper-question">No questions selected.</p>';
  if (key === 'A') {
    return heading + '<p class="paper-question"><b>1. Write short notes on:</b></p>' + questions.map((q,i) => `<p class="paper-question">(${String.fromCharCode(97 + i)}) ${escapeHtml(q)}</p>`).join('');
  }
  let start = 2;
  if (key === 'C') start += state.selected.B.length;
  return heading + questions.map((q,i) => `<p class="paper-question">${start+i}. ${escapeHtml(q)} <span>[${marks} marks]</span></p>`).join('');
}
function renderPreview() {
  if (!state.selected) return;
  const meta = readMeta();
  const {A, B, C} = state.selected;
  $('empty-preview').classList.add('hidden');
  $('preview-content').classList.remove('hidden');
  $('preview-badge').textContent = 'PAPER READY'; $('preview-badge').classList.add('ready');
  $('preview-date').textContent = meta.exam_date || '—';
  $('preview-total').textContent = `Total No. of Questions: ${String(1 + B.length + C.length).padStart(2,'0')}`;
  $('preview-college').textContent = meta.college;
  $('preview-degree').textContent = meta.degree_semester;
  $('preview-subject').textContent = meta.subject;
  $('preview-code').textContent = `Subject Code: ${meta.subject_code}`;
  $('preview-mcode').textContent = meta.m_code ? `M. Code: ${meta.m_code}` : '';
  $('preview-exam-date').textContent = `Date of Examination: ${meta.exam_date}`;
  $('preview-duration').textContent = `Time: ${meta.duration}`;
  $('preview-marks').textContent = `Max. Marks: ${meta.maximum_marks}`;
  $('instruction-a').textContent = `SECTION-A is COMPULSORY consisting of ${numberWords(A.length)} questions carrying TWO marks each.`;
  $('instruction-b').textContent = `SECTION-B has ${numberWords(B.length)} questions and SECTION-C has ${numberWords(C.length)} questions.`;
  const marksB = Number($('marks_b').value), marksC = Number($('marks_c').value);
  if (marksB === marksC) {
    $('instruction-attempt').textContent = `Attempt any ${numberWords(Math.min(intValue('attempt_count',5), B.length+C.length))} questions from SECTION B & C carrying ${numberWords(marksB)} marks each.`;
  } else {
    $('instruction-attempt').textContent = `SECTION-B questions carry ${marksB} marks each and SECTION-C questions carry ${marksC} marks each. Attempt questions as directed.`;
  }
  $('section-preview-a').innerHTML = sectionHtml('SECTION-A', A, 'A');
  $('section-preview-b').innerHTML = sectionHtml('SECTION-B', B, 'B', marksB);
  $('section-preview-c').innerHTML = sectionHtml('SECTION-C', C, 'C', marksC);
}
function numberWords(n) {
  const words = ['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY'];
  return words[n] || String(n);
}
async function parseUpload(file, bankKey) {
  if (!file) return;
  hideNotice();
  const statusId = bankKey === 'A' ? 'status-a' : 'status-long';
  const textareaId = bankKey === 'A' ? 'bank-a' : 'bank-long';
  const status = $(statusId);
  status.className = 'file-status'; status.textContent = `Reading ${file.name}…`;
  const form = new FormData(); form.append('file', file);
  try {
    const response = await fetch('/api/parse-bank', {method:'POST', body:form});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Could not read this file.');
    $(textareaId).value = data.questions.join('\n');
    status.className = 'file-status success'; status.textContent = `✓ Imported ${data.count} questions from ${file.name}`;
    syncBanks(); invalidatePaper();
    showNotice(`${data.count} questions imported. Review the list and edit it if needed.`);
  } catch (error) {
    status.className = 'file-status error'; status.textContent = error.message;
    showNotice(error.message, true);
  }
}
async function downloadPaper() {
  if (!state.selected) return;
  hideNotice();
  const button = $('download'); button.disabled = true; button.innerHTML = '<span>…</span> Preparing Word file';
  const payload = {
    meta: readMeta(), section_a: state.selected.A, section_b: state.selected.B, section_c: state.selected.C,
    marks_b: Number($('marks_b').value), marks_c: Number($('marks_c').value), attempt_count: intValue('attempt_count',5),
  };
  try {
    const response = await fetch('/api/generate-paper', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    if (!response.ok) {
      let message = 'Could not generate the Word document.';
      try { const data = await response.json(); message = data.detail || message; } catch {}
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeSubject = (payload.meta.subject || 'SVIET_Exam').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'') || 'SVIET_Exam';
    a.href = url; a.download = `${safeSubject}_Question_Paper.docx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showNotice('Your Word question paper has been generated and downloaded.');
  } catch (error) { showNotice(error.message, true); }
  finally { button.disabled = false; button.innerHTML = '<span>↓</span> Download question paper'; }
}

$('file-a').addEventListener('change', e => { state.fileA = e.target.files[0] || null; parseUpload(state.fileA, 'A'); });
$('file-long').addEventListener('change', e => { state.fileLong = e.target.files[0] || null; parseUpload(state.fileLong, 'long'); });
$('bank-a').addEventListener('input', () => { syncBanks(); invalidatePaper(); });
$('bank-long').addEventListener('input', () => { syncBanks(); invalidatePaper(); });
for (const id of ['count_a','count_b','count_c','marks_b','marks_c','attempt_count']) $(id).addEventListener('change', () => { updateAvailability(); invalidatePaper(); });
for (const id of ['college','degree_semester','subject','subject_code','m_code','exam_date','duration','maximum_marks']) $(id).addEventListener('input', () => { if (state.selected) renderPreview(); });
$('generate').addEventListener('click', () => {
  syncBanks();
  if (!state.bankA.length && !state.bankLong.length) { showNotice('Upload at least one question bank or paste questions into the bank fields first.', true); return; }
  selectAll(); showNotice('Random question paper generated. You can shuffle each section or download the Word file.');
});
$('shuffle-all').addEventListener('click', () => {
  syncBanks();
  if (!state.bankA.length && !state.bankLong.length) { showNotice('Upload at least one question bank or paste questions into the bank fields first.', true); return; }
  selectAll(); showNotice('All sections have been shuffled.');
});
$('download').addEventListener('click', downloadPaper);
document.querySelectorAll('[data-shuffle]').forEach(button => button.addEventListener('click', () => { shuffleSection(button.dataset.shuffle); showNotice(`Section ${button.dataset.shuffle} has been shuffled.`); }));
document.querySelectorAll('[data-clear]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.clear; $(id).value = '';
  if (id === 'bank-a') { $('status-a').textContent = 'No file selected'; $('status-a').className = 'file-status'; }
  else { $('status-long').textContent = 'No file selected'; $('status-long').className = 'file-status'; }
  syncBanks(); invalidatePaper();
}));
document.querySelectorAll('[data-collapse]').forEach(button => button.addEventListener('click', () => {
  const target = $(button.dataset.collapse); target.classList.toggle('hidden'); button.textContent = target.classList.contains('hidden') ? '+' : '−';
}));
document.querySelectorAll('.dropzone').forEach(zone => {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragging');
    const file = e.dataTransfer.files[0]; if (!file) return;
    const input = zone.querySelector('input');
    const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files;
    input.dispatchEvent(new Event('change', {bubbles:true}));
  });
});
syncBanks();
