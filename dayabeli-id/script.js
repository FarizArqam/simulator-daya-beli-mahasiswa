const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const brandArea = document.getElementById('brandArea');

function expandSidebar(){ if(window.innerWidth > 980) app.classList.add('expanded'); }
function collapseSidebar(){ if(window.innerWidth > 980) app.classList.remove('expanded'); }

sidebar.addEventListener('mouseenter', expandSidebar);
sidebar.addEventListener('mouseleave', collapseSidebar);
sidebar.addEventListener('focusin', expandSidebar);
sidebar.addEventListener('focusout', collapseSidebar);

function setMobileNavCollapsed(collapsed){
  if(window.innerWidth <= 980){
    app.classList.add('expanded');
    app.classList.toggle('mobile-nav-collapsed', collapsed);
    brandArea.setAttribute('role','button');
    brandArea.setAttribute('tabindex','0');
    brandArea.setAttribute('aria-label', collapsed ? 'Buka menu navigasi' : 'Tutup menu navigasi');
    brandArea.setAttribute('aria-expanded', String(!collapsed));
  }else{
    app.classList.remove('mobile-nav-collapsed');
    app.classList.remove('expanded');
    brandArea.removeAttribute('role');
    brandArea.removeAttribute('tabindex');
  }
}

brandArea.addEventListener('click', () => {
  if(window.innerWidth <= 980) setMobileNavCollapsed(!app.classList.contains('mobile-nav-collapsed'));
});
brandArea.addEventListener('keydown', event => {
  if(window.innerWidth <= 980 && (event.key === 'Enter' || event.key === ' ')){
    event.preventDefault();
    setMobileNavCollapsed(!app.classList.contains('mobile-nav-collapsed'));
  }
});
window.addEventListener('resize', () => setMobileNavCollapsed(window.innerWidth <= 980 ? app.classList.contains('mobile-nav-collapsed') : false));
setMobileNavCollapsed(window.innerWidth <= 980);

const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('.section')];
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(item => item.classList.remove('active'));
    link.classList.add('active');
    if(window.innerWidth <= 980) setMobileNavCollapsed(true);
  });
});

const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const id = entry.target.id;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + id));
    }
  });
}, {root:null, rootMargin:'-36% 0px -56% 0px', threshold:0.01});
sections.forEach(section => activeObserver.observe(section));

const rootStyle = document.documentElement.style;
let rafId = null;
let cursorState = {x: window.innerWidth / 2, y: window.innerHeight / 2};
function setCursorVars(){
  const x = cursorState.x;
  const y = cursorState.y;
  const nx = (x / Math.max(window.innerWidth, 1)) - 0.5;
  const ny = (y / Math.max(window.innerHeight, 1)) - 0.5;
  rootStyle.setProperty('--cursor-x', x + 'px');
  rootStyle.setProperty('--cursor-y', y + 'px');
  rootStyle.setProperty('--mx', nx.toFixed(4));
  rootStyle.setProperty('--my', ny.toFixed(4));
  rafId = null;
}
window.addEventListener('pointermove', event => {
  cursorState.x = event.clientX;
  cursorState.y = event.clientY;
  if(!rafId) rafId = requestAnimationFrame(setCursorVars);
}, {passive:true});

const revealTargets = document.querySelectorAll('.section, .mini-panel, .focus-panel, .description-strip, .detail-card, .equation-board, .sim-form, .sim-result, .quiz-card, .score-box, .chart-card, .table-card, .recommendation-card, .note-card');
revealTargets.forEach(item => item.classList.add('revealable'));
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
revealTargets.forEach(item => revealObserver.observe(item));

const rupiah = new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0});
function formatRupiah(value){ return rupiah.format(Math.round(value)); }
function budgetModel(t, b1, bmin, k){ return bmin + (b1 - bmin) * Math.exp(-k * (t - 1)); }

const inputs = {
  b1: document.getElementById('b1'),
  bmin: document.getElementById('bmin'),
  k: document.getElementById('decayK'),
  slider: document.getElementById('decaySlider'),
  days: document.getElementById('days')
};
const kReadout = document.getElementById('kReadout');
const formError = document.getElementById('formError');
const summaryGrid = document.getElementById('summaryGrid');
const predictionBody = document.getElementById('predictionBody');
const interpretationCard = document.getElementById('interpretationCard');
const recommendationLevel = document.getElementById('recommendationLevel');
const recommendationTitle = document.getElementById('recommendationTitle');
const recommendationText = document.getElementById('recommendationText');
const recommendationMeta = document.getElementById('recommendationMeta');
const recommendationActions = document.getElementById('recommendationActions');

function getParams(){
  return {
    b1: Number(inputs.b1.value),
    bmin: Number(inputs.bmin.value),
    k: Number(inputs.k.value),
    days: Math.round(Number(inputs.days.value))
  };
}

function validateParams({b1,bmin,k,days}){
  if([b1,bmin,k,days].some(v => Number.isNaN(v))) return 'Semua parameter harus diisi dengan angka yang valid.';
  if(b1 <= 0) return 'Anggaran awal harus lebih besar dari nol.';
  if(bmin < 0) return 'Anggaran minimum tidak boleh negatif.';
  if(b1 <= bmin) return 'Anggaran awal B1 harus lebih besar daripada anggaran minimum Bmin.';
  if(k <= 0) return 'Nilai k harus lebih besar dari nol.';
  if(days < 1) return 'Jumlah hari simulasi minimal 1 hari.';
  if(days > 365) return 'Jumlah hari terlalu besar untuk tampilan presentasi. Gunakan maksimal 365 hari.';
  return '';
}

function buildData({b1,bmin,k,days}){
  const data = [];
  for(let t=1; t<=days; t++){
    data.push({day:t, value:budgetModel(t,b1,bmin,k)});
  }
  return data;
}

function getSpeedLabel(k){
  if(k < 0.05) return {label:'Lambat', className:'high', text:'Daya beli menurun relatif lambat. Anggaran masih bertahan cukup dekat dengan nilai awal pada sebagian besar periode.'};
  if(k < 0.12) return {label:'Sedang', className:'mid', text:'Daya beli menurun secara sedang. Perubahan mulai terlihat jelas setelah beberapa hari menuju pertengahan bulan.'};
  return {label:'Cepat', className:'low', text:'Daya beli menurun cepat. Pengguna perlu memperhatikan pengeluaran sejak awal periode uang saku.'};
}

function statusFor(value, b1, bmin){
  const ratio = (value - bmin) / (b1 - bmin);
  if(ratio > 0.65) return '<span class="status-pill high">Masih tinggi</span>';
  if(ratio > 0.25) return '<span class="status-pill mid">Mulai menurun</span>';
  return '<span class="status-pill low">Mendekati minimum</span>';
}

function renderSummary(params, data){
  const final = data[data.length - 1].value;
  summaryGrid.innerHTML = `
    <div class="summary-card"><strong>${formatRupiah(params.b1)}</strong><span>Anggaran awal</span></div>
    <div class="summary-card"><strong>${formatRupiah(params.bmin)}</strong><span>Anggaran minimum</span></div>
    <div class="summary-card"><strong>${params.k.toFixed(4)}</strong><span>Nilai k</span></div>
    <div class="summary-card"><strong>${formatRupiah(final)}</strong><span>Hari terakhir</span></div>
  `;
}

function renderTable(params, data){
  predictionBody.innerHTML = data.map(item => `
    <tr>
      <td>Hari ${item.day}</td>
      <td>${formatRupiah(item.value)}</td>
      <td>${statusFor(item.value, params.b1, params.bmin)}</td>
    </tr>
  `).join('');
}

function drawLineChart(canvasId, datasets, options = {}){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = {left:62, right:28, top:32, bottom:46};
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const allValues = datasets.flatMap(ds => ds.data.map(p => p.value));
  const minVal = Math.min(...allValues) * 0.94;
  const maxVal = Math.max(...allValues) * 1.04;
  const maxDay = Math.max(...datasets.flatMap(ds => ds.data.map(p => p.day)));

  ctx.clearRect(0,0,w,h);
  const bg = ctx.createLinearGradient(0,0,w,h);
  bg.addColorStop(0,'#ffffff');
  bg.addColorStop(1,'#eff7ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,w,h);

  ctx.strokeStyle = 'rgba(37,99,235,.10)';
  ctx.lineWidth = 1;
  for(let i=0;i<=5;i++){
    const y = pad.top + (chartH/5)*i;
    ctx.beginPath();
    ctx.moveTo(pad.left,y);
    ctx.lineTo(w-pad.right,y);
    ctx.stroke();
  }
  for(let i=0;i<=6;i++){
    const x = pad.left + (chartW/6)*i;
    ctx.beginPath();
    ctx.moveTo(x,pad.top);
    ctx.lineTo(x,h-pad.bottom);
    ctx.stroke();
  }

  ctx.strokeStyle = '#0b2f6b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.left,pad.top-8);
  ctx.lineTo(pad.left,h-pad.bottom);
  ctx.lineTo(w-pad.right+8,h-pad.bottom);
  ctx.stroke();

  function xFor(day){ return pad.left + ((day-1) / Math.max(maxDay-1,1)) * chartW; }
  function yFor(value){ return h - pad.bottom - ((value-minVal) / Math.max(maxVal-minVal,1)) * chartH; }

  datasets.forEach((dataset, datasetIndex) => {
    const points = dataset.data.map(p => ({x:xFor(p.day), y:yFor(p.value), value:p.value}));
    ctx.save();
    if(dataset.dash) ctx.setLineDash(dataset.dash);
    ctx.beginPath();
    points.forEach((point, i) => { if(i===0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
    ctx.strokeStyle = dataset.color || '#2563eb';
    ctx.lineWidth = dataset.width || 3.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    if(dataset.fill && datasetIndex === 0){
      ctx.beginPath();
      points.forEach((point, i) => { if(i===0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
      ctx.lineTo(points[points.length-1].x, h-pad.bottom);
      ctx.lineTo(points[0].x, h-pad.bottom);
      ctx.closePath();
      const area = ctx.createLinearGradient(0,pad.top,0,h-pad.bottom);
      area.addColorStop(0,'rgba(37,99,235,.20)');
      area.addColorStop(1,'rgba(56,189,248,0)');
      ctx.fillStyle = area;
      ctx.fill();
    }

    const markerIndexes = [0, Math.floor(points.length * .5), points.length - 1].filter((v,i,a) => v >= 0 && a.indexOf(v) === i);
    markerIndexes.forEach(index => {
      const p = points[index];
      ctx.beginPath();
      ctx.arc(p.x,p.y,4.7,0,Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = dataset.color || '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });

  ctx.fillStyle = '#0b2f6b';
  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.fillText(options.yLabel || 'B(t)', 14, 22);
  ctx.fillText('hari', w - 52, h - 14);

  ctx.fillStyle = 'rgba(15,36,61,.64)';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillText(formatRupiah(maxVal), 8, pad.top + 4);
  ctx.fillText(formatRupiah(minVal), 8, h - pad.bottom + 4);
}

function renderInterpretation(params, data){
  const speed = getSpeedLabel(params.k);
  const midDay = Math.max(1, Math.ceil(params.days/2));
  const midValue = data[midDay-1].value;
  const final = data[data.length-1].value;
  const dropPercent = ((params.b1 - final) / params.b1) * 100;
  interpretationCard.innerHTML = `
    <strong>Interpretasi: Peluruhan ${speed.label}</strong>
    <p>${speed.text}</p>
    <p>Pada sekitar pertengahan periode, yaitu hari ke-${midDay}, prediksi anggaran menjadi <strong>${formatRupiah(midValue)}</strong>. Pada hari terakhir, anggaran mendekati <strong>${formatRupiah(final)}</strong>, dengan penurunan sekitar <strong>${dropPercent.toFixed(1)}%</strong> dari anggaran awal.</p>
  `;
}


function renderCulinaryRecommendation(params, data){
  if(!recommendationTitle || !recommendationText || !recommendationActions) return;

  const midDay = Math.max(1, Math.ceil(params.days / 2));
  const midValue = data[midDay - 1].value;
  const final = data[data.length - 1].value;
  const dropPercent = ((params.b1 - final) / params.b1) * 100;
  const midDropPercent = ((params.b1 - midValue) / params.b1) * 100;
  const distanceFromMinimum = ((final - params.bmin) / Math.max(params.b1 - params.bmin, 1)) * 100;

  let level = 'Stabil';
  let title = 'Pertahankan Harga Normal + Benefit Ringan';
  let text = `Berdasarkan simulasi, penurunan anggaran masih ringan. Pada hari ke-${midDay}, estimasi anggaran masih ${formatRupiah(midValue)}, dan pada hari terakhir menjadi ${formatRupiah(final)}. Restoran tidak perlu langsung memberi diskon besar; fokuskan strategi pada menjaga minat beli dan loyalitas mahasiswa.`;
  let actions = [
    'Gunakan promo ringan seperti bonus minuman, topping, atau poin loyalti.',
    'Pertahankan menu reguler karena daya beli belum turun tajam.',
    'Pasang pengingat promo pada jam makan siang atau malam agar transaksi tetap konsisten.'
  ];

  if((params.k >= 0.05 && params.k < 0.12) || (dropPercent >= 15 && dropPercent < 35)){
    level = 'Waspada Pertengahan Bulan';
    title = 'Aktifkan Promo Bertahap Pertengahan Bulan';
    text = `Hasil simulasi menunjukkan penurunan mulai terasa. Pada hari ke-${midDay}, anggaran diperkirakan menjadi ${formatRupiah(midValue)}, lalu turun ke ${formatRupiah(final)} pada hari terakhir. Strategi terbaik adalah mulai memberi promo bertahap sebelum mahasiswa benar-benar masuk fase tanggal tua.`;
    actions = [
      'Mulai tawarkan paket hemat mahasiswa sekitar pertengahan bulan.',
      'Gunakan voucher diskon kecil atau subsidi ongkir untuk menjaga keputusan pembelian.',
      'Sediakan pilihan menu ekonomis dengan porsi cukup dan harga mudah dijangkau.'
    ];
  }

  if(params.k >= 0.12 || dropPercent >= 35 || distanceFromMinimum <= 25){
    level = 'Tanggal Tua Kuat';
    title = 'Prioritaskan Paket Hemat Tanggal Tua';
    text = `Simulasi memperlihatkan penurunan daya beli yang signifikan. Pada hari ke-${midDay}, anggaran sudah turun ke ${formatRupiah(midValue)}, dan pada hari terakhir mendekati ${formatRupiah(final)}. Restoran perlu menyesuaikan penawaran agar tetap relevan dengan sisa anggaran mahasiswa.`;
    actions = [
      'Buat paket hemat utama dengan harga mendekati batas anggaran minimum mahasiswa.',
      'Gabungkan diskon menu, gratis ongkir, atau voucher checkout pada akhir bulan.',
      'Promosikan menu murah, kenyang, dan praktis dengan label “Paket Tanggal Tua”.'
    ];
  }

  if(params.days <= 14 && dropPercent < 12){
    level = 'Periode Pendek';
    title = 'Fokus pada Promo Awareness, Bukan Diskon Besar';
    text = `Karena periode simulasi hanya ${params.days} hari dan penurunan baru sekitar ${dropPercent.toFixed(1)}%, daya beli masih relatif aman. Restoran cukup menggunakan promosi pengingat agar mahasiswa tetap memilih produk tanpa perlu menekan margin terlalu besar.`;
    actions = [
      'Gunakan banner promo ringan pada jam ramai.',
      'Tawarkan bundling sederhana untuk menaikkan nilai transaksi.',
      'Simpan diskon besar untuk periode yang lebih dekat ke akhir bulan.'
    ];
  }

  recommendationLevel.textContent = level;
  recommendationTitle.textContent = title;
  recommendationText.textContent = text;
  recommendationMeta.innerHTML = `Penurunan akhir: <strong>${dropPercent.toFixed(1)}%</strong> · Penurunan pertengahan: <strong>${midDropPercent.toFixed(1)}%</strong> · Hari terakhir: <strong>${formatRupiah(final)}</strong>`;
  recommendationActions.innerHTML = actions.map(item => `<div class="recommendation-action">${item}</div>`).join('');
}

function renderSensitivity(params){
  const scenarios = [
    {label:'Peluruhan lambat', k:0.02, color:'#38bdf8', dash:[8,6], width:3},
    {label:'Peluruhan sedang', k:0.0835, color:'#2563eb', dash:[], width:3.4},
    {label:'Peluruhan cepat', k:0.20, color:'#0b2f6b', dash:[2,5], width:3.4}
  ];
  const datasets = scenarios.map(scenario => {
    const data = [];
    for(let t=1;t<=params.days;t++) data.push({day:t, value:budgetModel(t, params.b1, params.bmin, scenario.k)});
    return {...scenario, data};
  });
  drawLineChart('sensitivityChart', datasets, {yLabel:'Sensitivitas'});
}

function runSimulation(){
  const params = getParams();
  const error = validateParams(params);
  formError.textContent = error;
  if(error) return;
  kReadout.textContent = params.k.toFixed(4);
  const data = buildData(params);
  renderSummary(params, data);
  renderTable(params, data);
  renderInterpretation(params, data);
  renderCulinaryRecommendation(params, data);
  drawLineChart('budgetChart', [{label:'B(t)', data, color:'#2563eb', fill:true, width:3.8}], {yLabel:'B(t) Rupiah'});
  renderSensitivity(params);
}

inputs.slider.addEventListener('input', () => {
  inputs.k.value = Number(inputs.slider.value).toFixed(4);
  kReadout.textContent = Number(inputs.slider.value).toFixed(4);
});
inputs.k.addEventListener('input', () => {
  const value = Number(inputs.k.value);
  if(value >= Number(inputs.slider.min) && value <= Number(inputs.slider.max)) inputs.slider.value = value;
  kReadout.textContent = Number.isNaN(value) ? '-' : value.toFixed(4);
});

document.getElementById('simForm').addEventListener('submit', event => {
  event.preventDefault();
  runSimulation();
});

function setDefaultValues(){
  inputs.b1.value = 20455;
  inputs.bmin.value = 12000;
  inputs.k.value = 0.0835;
  inputs.slider.value = 0.0835;
  inputs.days.value = 30;
  kReadout.textContent = '0.0835';
  runSimulation();
}
document.getElementById('resetSim').addEventListener('click', setDefaultValues);
document.getElementById('quickDefault').addEventListener('click', setDefaultValues);
setDefaultValues();



/* ===============================
   THEORY CAROUSEL
   Geser materi teori ke kanan/kiri seperti modul carousel.
================================= */
const theoryTrack = document.getElementById('theoryTrack');
const theorySlides = theoryTrack ? [...theoryTrack.querySelectorAll('.theory-slide')] : [];
const theoryDots = [...document.querySelectorAll('[data-theory-dot]')];
const prevTheory = document.getElementById('prevTheory');
const nextTheory = document.getElementById('nextTheory');
const theoryCounter = document.getElementById('theoryCounter');
const theorySlideTitle = document.getElementById('theorySlideTitle');
const theoryCarousel = document.querySelector('.theory-carousel');
let theoryIndex = 0;
let theoryTouchStart = 0;

function renderTheorySlide(index){
  if(!theoryTrack || theorySlides.length === 0) return;
  theoryIndex = (index + theorySlides.length) % theorySlides.length;
  theoryTrack.style.transform = `translateX(-${theoryIndex * 100}%)`;
  if(theoryCounter) theoryCounter.textContent = `${theoryIndex + 1} / ${theorySlides.length}`;
  if(theorySlideTitle) theorySlideTitle.textContent = theorySlides[theoryIndex].dataset.title || 'Materi Teori';
  theoryDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === theoryIndex));
  if(theoryCarousel){
    theoryCarousel.classList.remove('is-switching');
    void theoryCarousel.offsetWidth;
    theoryCarousel.classList.add('is-switching');
  }
}

if(theoryTrack){
  prevTheory?.addEventListener('click', () => renderTheorySlide(theoryIndex - 1));
  nextTheory?.addEventListener('click', () => renderTheorySlide(theoryIndex + 1));
  theoryDots.forEach(dot => dot.addEventListener('click', () => renderTheorySlide(Number(dot.dataset.theoryDot))));
  theoryTrack.addEventListener('touchstart', event => { theoryTouchStart = event.touches[0].clientX; }, {passive:true});
  theoryTrack.addEventListener('touchend', event => {
    const diff = event.changedTouches[0].clientX - theoryTouchStart;
    if(Math.abs(diff) > 48) renderTheorySlide(theoryIndex + (diff < 0 ? 1 : -1));
  }, {passive:true});
  document.addEventListener('keydown', event => {
    const theorySection = document.getElementById('teori');
    if(!theorySection) return;
    const rect = theorySection.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * .55 && rect.bottom > window.innerHeight * .35;
    if(!visible) return;
    if(event.key === 'ArrowLeft') renderTheorySlide(theoryIndex - 1);
    if(event.key === 'ArrowRight') renderTheorySlide(theoryIndex + 1);
  });
  renderTheorySlide(0);
}

const quizQuestions = [
  {
    question:'Apa yang dimaksud dengan daya beli mahasiswa dalam konteks aplikasi ini?',
    options:['Kemampuan mahasiswa menentukan jadwal kuliah','Anggaran maksimum untuk satu kali pemesanan makanan online','Jumlah aplikasi pesan-antar yang dimiliki mahasiswa','Total seluruh uang saku selama satu tahun'],
    answer:1,
    feedback:'Daya beli di sini dimaknai sebagai batas anggaran mahasiswa untuk satu kali pemesanan makanan online.'
  },
  {
    question:'Dalam model B(t), apa arti Bmin?',
    options:['Anggaran maksimum yang selalu naik','Batas minimum anggaran yang masih mungkin digunakan','Hari pertama penerimaan uang saku','Nilai laju penurunan daya beli'],
    answer:1,
    feedback:'Bmin adalah batas bawah atau anggaran minimum yang didekati oleh kurva peluruhan.'
  },
  {
    question:'Jika nilai k semakin besar, maka bentuk kurva B(t) akan ....',
    options:['Menurun lebih cepat','Menjadi konstan selamanya','Naik tanpa batas','Tidak terpengaruh sama sekali'],
    answer:0,
    feedback:'Nilai k mengatur laju peluruhan. Semakin besar k, semakin cepat B(t) turun menuju Bmin.'
  },
  {
    question:'Mengapa model peluruhan eksponensial digunakan dalam website ini?',
    options:['Karena selalu paling benar untuk semua data','Karena dapat mengilustrasikan penurunan bertahap menuju batas minimum','Karena tidak membutuhkan variabel apa pun','Karena menghapus konsep persamaan diferensial'],
    answer:1,
    feedback:'Model eksponensial dipakai untuk memvisualisasikan penurunan bertahap yang mendekati batas minimum.'
  },
  {
    question:'Apa keterbatasan penting dari model berdasarkan makalah?',
    options:['Data asli menunjukkan korelasi lemah dan ada interval data yang tidak lengkap','Model tidak bisa dihitung dengan JavaScript','Rumus hanya berlaku untuk harga bensin','Bmin harus selalu bernilai nol'],
    answer:0,
    feedback:'Model bersifat ilustratif karena data belum mendukung pola peluruhan eksponensial yang kuat secara statistik.'
  }
];

const quizWrap = document.getElementById('quizWrap');
const scoreText = document.getElementById('scoreText');
const scoreMessage = document.getElementById('scoreMessage');
const quizProgress = document.getElementById('quizProgress');
let quizState = [];

function renderQuiz(){
  quizState = quizQuestions.map(() => ({answered:false, correct:false}));
  quizWrap.innerHTML = quizQuestions.map((item, qIndex) => `
    <div class="quiz-card" data-question="${qIndex}">
      <h3>${qIndex + 1}. ${item.question}</h3>
      <div class="quiz-options">
        ${item.options.map((option, oIndex) => `<button type="button" data-option="${oIndex}">${option}</button>`).join('')}
      </div>
      <div class="feedback" hidden></div>
    </div>
  `).join('');
  bindQuizButtons();
  updateQuizScore();
}

function bindQuizButtons(){
  quizWrap.querySelectorAll('.quiz-card').forEach(card => {
    const qIndex = Number(card.dataset.question);
    const buttons = [...card.querySelectorAll('button')];
    const feedback = card.querySelector('.feedback');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        if(quizState[qIndex].answered) return;
        const selected = Number(button.dataset.option);
        const correct = quizQuestions[qIndex].answer;
        quizState[qIndex].answered = true;
        quizState[qIndex].correct = selected === correct;
        buttons.forEach(btn => btn.disabled = true);
        if(selected === correct){
          button.classList.add('correct');
          feedback.className = 'feedback correct';
          feedback.textContent = 'Benar. ' + quizQuestions[qIndex].feedback;
        }else{
          button.classList.add('wrong');
          buttons[correct].classList.add('correct');
          feedback.className = 'feedback wrong';
          feedback.textContent = 'Belum tepat. ' + quizQuestions[qIndex].feedback;
        }
        feedback.hidden = false;
        updateQuizScore();
      });
    });
  });
}

function updateQuizScore(){
  const answered = quizState.filter(item => item.answered).length;
  const score = quizState.filter(item => item.correct).length;
  scoreText.textContent = `Skor: ${score} / ${quizQuestions.length}`;
  quizProgress.style.width = `${(answered / quizQuestions.length) * 100}%`;
  if(answered < quizQuestions.length){
    scoreMessage.textContent = `Sudah dijawab ${answered} dari ${quizQuestions.length} soal.`;
    return;
  }
  const percent = (score / quizQuestions.length) * 100;
  if(percent >= 80) scoreMessage.textContent = 'Luar biasa! Anda memahami model matematika ini dengan sangat baik.';
  else if(percent >= 60) scoreMessage.textContent = 'Bagus! Pelajari kembali bagian teori untuk memperkuat pemahaman Anda.';
  else scoreMessage.textContent = 'Tetap semangat belajar! Coba baca kembali teori dan jalankan simulasi sekali lagi.';
}

document.getElementById('resetQuiz').addEventListener('click', renderQuiz);
renderQuiz();

const scrollTop = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTop.classList.toggle('show', window.scrollY > 650);
}, {passive:true});
scrollTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
