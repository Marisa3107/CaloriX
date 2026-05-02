// ======================= GLOBAL STATE =======================
let gender = 'male';
let currentTDEE = 2150;
let currentTargetCalories = 2150;
let totalCaloriesToday = 748;

// Data historis untuk laporan mingguan
let weeklyHistory = [];

// Data makanan default
let foodItems = [
  { name: "Nasi Putih", detail: "200g · Sarapan", calories: 260, protein: 5, carbs: 56, fat: 0, emoji: "🍚" },
  { name: "Ayam Bakar", detail: "150g · Makan Siang", calories: 285, protein: 38, carbs: 0, fat: 14, emoji: "🍗" },
  { name: "Sayur Bayam", detail: "100g · Makan Siang", calories: 23, protein: 3, carbs: 4, fat: 0, emoji: "🥦" },
  { name: "Susu Protein", detail: "300ml · Snack", calories: 180, protein: 30, carbs: 8, fat: 2, emoji: "🥛" }
];

// Variabel untuk barcode scanner dan chart
let html5QrCode;
let weeklyChart;

// ======================= INISIALISASI WEEKLY HISTORY =======================
function initWeeklyHistory() {
  const today = new Date();
  weeklyHistory = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    weeklyHistory.push({
      date: dateStr,
      calories: 0,
      target: currentTargetCalories
    });
  }
  updateWeeklyHistory();
}

// ======================= HELPER FUNCTIONS =======================
function setG(g) {
  gender = g;
  document.getElementById('g-male').classList.toggle('on', g === 'male');
  document.getElementById('g-female').classList.toggle('on', g === 'female');
}

function animNum(el, to, dur = 1200) {
  const start = performance.now();
  const step = (ts) => {
    const p = Math.min((ts - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(e * to).toLocaleString('id-ID');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  const bgColor = type === 'success' ? '#06b6d4' : (type === 'error' ? '#ef4444' : '#f59e0b');
  toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${bgColor};color:#000;padding:12px 20px;border-radius:99px;font-weight:bold;z-index:9999;animation:fadeUp 0.3s ease;box-shadow:0 4px 15px rgba(0,0,0,.3);font-family:'Plus Jakarta Sans',sans-serif`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ======================= LOCAL STORAGE =======================
function saveToLocalStorage() {
  localStorage.setItem('calorix_food_items', JSON.stringify(foodItems));
  localStorage.setItem('calorix_target', currentTargetCalories);
  localStorage.setItem('calorix_tdee', currentTDEE);
  localStorage.setItem('calorix_weekly', JSON.stringify(weeklyHistory));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('calorix_food_items');
  if (saved && JSON.parse(saved).length > 0) {
    foodItems = JSON.parse(saved);
  }
  const savedTarget = localStorage.getItem('calorix_target');
  if (savedTarget) {
    currentTargetCalories = parseInt(savedTarget);
  }
  const savedTDEE = localStorage.getItem('calorix_tdee');
  if (savedTDEE) {
    currentTDEE = parseInt(savedTDEE);
  }
  const savedWeekly = localStorage.getItem('calorix_weekly');
  if (savedWeekly) {
    weeklyHistory = JSON.parse(savedWeekly);
  }
}

function resetAllData() {
  if (confirm('⚠️ Yakin ingin mereset semua data? Semua makanan yang sudah ditambahkan akan hilang dan kembali ke contoh awal.')) {
    foodItems = [
      { name: "Nasi Putih", detail: "200g · Sarapan", calories: 260, protein: 5, carbs: 56, fat: 0, emoji: "🍚" },
      { name: "Ayam Bakar", detail: "150g · Makan Siang", calories: 285, protein: 38, carbs: 0, fat: 14, emoji: "🍗" },
      { name: "Sayur Bayam", detail: "100g · Makan Siang", calories: 23, protein: 3, carbs: 4, fat: 0, emoji: "🥦" },
      { name: "Susu Protein", detail: "300ml · Snack", calories: 180, protein: 30, carbs: 8, fat: 2, emoji: "🥛" }
    ];
    currentTargetCalories = 2150;
    currentTDEE = 2150;
    initWeeklyHistory();
    updateFoodList();
    saveToLocalStorage();
    showToast('🔄 Semua data telah direset!', 'info');
    setTimeout(() => location.reload(), 1000);
  }
}

// ======================= TRACKER FUNCTIONS =======================
function updateRingVisual() {
  const target = currentTargetCalories;
  let percent = (totalCaloriesToday / target) * 100;
  if (percent > 100) percent = 100;
  const circumference = 326.7;
  const offset = circumference - (percent / 100) * circumference;
  const progressCircle = document.getElementById('calorie-progress');
  if (progressCircle) progressCircle.style.strokeDashoffset = offset;
  
  const totalDisplay = document.getElementById('total-calories-display');
  if (totalDisplay) totalDisplay.textContent = totalCaloriesToday;
  
  const percentSpan = document.getElementById('calorie-percentage-text');
  if (percentSpan) percentSpan.textContent = Math.round(percent);
  
  const targetSpan = document.getElementById('target-calories-display');
  if (targetSpan) targetSpan.textContent = target;
}

function deleteFood(index) {
  const foodName = foodItems[index].name;
  if (confirm(`Hapus "${foodName}" dari log?`)) {
    foodItems.splice(index, 1);
    updateFoodList();
    showToast(`🗑️ ${foodName} dihapus`, 'info');
  }
}

function editFood(index) {
  const item = foodItems[index];
  const newName = prompt('Edit nama makanan:', item.name);
  const newCal = parseInt(prompt('Edit kalori (kkal):', item.calories));
  const newProtein = parseInt(prompt('Edit protein (gram):', item.protein || 0));
  const newCarbs = parseInt(prompt('Edit karbohidrat (gram):', item.carbs || 0));
  const newFat = parseInt(prompt('Edit lemak (gram):', item.fat || 0));
  
  if (newName && newName.trim() !== '') {
    item.name = newName.trim();
  }
  if (!isNaN(newCal) && newCal > 0) {
    item.calories = newCal;
  }
  if (!isNaN(newProtein)) {
    item.protein = newProtein;
  }
  if (!isNaN(newCarbs)) {
    item.carbs = newCarbs;
  }
  if (!isNaN(newFat)) {
    item.fat = newFat;
  }
  
  updateFoodList();
  showToast(`✏️ ${item.name} diupdate`, 'success');
}

function updateFoodList() {
  const container = document.getElementById('food-list-container');
  const badge = document.getElementById('food-count-badge');
  if (!container) return;
  container.innerHTML = '';
  let total = 0;
  
  foodItems.forEach((item, index) => {
    total += item.calories;
    const div = document.createElement('div');
    div.className = 'food-item';
    div.style.animation = `fadeUp 0.3s ease ${index * 0.05}s both`;
    div.innerHTML = `
      <div class="food-dot" style="background:rgba(6,182,212,.15)">${item.emoji || '🍽️'}</div>
      <div style="flex:3">
        <div class="food-name">
          ${escapeHtml(item.name)}
          <button class="edit-btn" onclick="editFood(${index})" style="background:none; border:none; color:var(--cyan); cursor:pointer; font-size:11px; margin-left:8px;">✏️ Edit</button>
        </div>
        <div class="food-sub">${escapeHtml(item.detail || 'Custom food')}</div>
      </div>
      <div style="text-align:right; flex:1">
        <div class="food-kcal">
          ${item.calories} kkal
          <button class="delete-btn" onclick="deleteFood(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; margin-left:8px;">🗑️</button>
        </div>
        <div style="font-size:10px;color:var(--muted)">P:${item.protein || 0}g K:${item.carbs || 0}g L:${item.fat || 0}g</div>
      </div>
    `;
    container.appendChild(div);
  });
  
  totalCaloriesToday = total;
  if (badge) badge.textContent = `${foodItems.length} makanan`;
  updateRingVisual();
  updateWeeklyHistory();
  saveToLocalStorage();
}

function addCustomFood() {
  const nameInput = document.getElementById('food-name');
  const calInput = document.getElementById('food-cal');
  const proteinInput = document.getElementById('food-protein');
  const carbsInput = document.getElementById('food-carbs');
  const fatInput = document.getElementById('food-fat');
  
  const name = nameInput.value.trim();
  const calories = parseInt(calInput.value);
  
  if (!name || isNaN(calories) || calories <= 0) {
    showToast('⚠️ Isi NAMA dan KALORI dulu!', 'error');
    return;
  }
  
  const protein = parseInt(proteinInput.value) || 0;
  const carbs = parseInt(carbsInput.value) || 0;
  const fat = parseInt(fatInput.value) || 0;
  
  const newFood = {
    name: name,
    detail: `Custom · ${new Date().toLocaleTimeString()}`,
    calories: calories,
    protein: protein,
    carbs: carbs,
    fat: fat,
    emoji: "🍽️"
  };
  
  foodItems.push(newFood);
  updateFoodList();
  
  nameInput.value = '';
  calInput.value = '';
  proteinInput.value = '0';
  carbsInput.value = '0';
  fatInput.value = '0';
  
  showToast(`✅ ${name} +${calories} kkal ditambahkan`, 'success');
}

function updateWeeklyHistory() {
  const today = new Date();
  const todayStr = today.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
  const existingIndex = weeklyHistory.findIndex(h => h.date === todayStr);
  if (existingIndex !== -1) {
    weeklyHistory[existingIndex].calories = totalCaloriesToday;
    weeklyHistory[existingIndex].target = currentTargetCalories;
  } else {
    weeklyHistory.push({
      date: todayStr,
      calories: totalCaloriesToday,
      target: currentTargetCalories
    });
  }
  // Sort by date
  weeklyHistory.sort((a, b) => {
    const dateA = new Date(a.date.split(' ')[1] + ' ' + a.date.split(' ')[0]);
    const dateB = new Date(b.date.split(' ')[1] + ' ' + b.date.split(' ')[0]);
    return dateA - dateB;
  });
}

// ======================= KALKULATOR UTAMA =======================
function calculateAndUpdate() {
  const age = +document.getElementById('age').value;
  const height = +document.getElementById('height').value;
  const weight = +document.getElementById('weight').value;
  const act = +document.getElementById('activity').value;
  const goal = document.getElementById('goal').value;
  
  if (!age || !height || !weight || age < 10 || height < 100 || weight < 20) {
    showToast('⚠️ Lengkapi semua data dengan benar! (Usia ≥10, Tinggi ≥100cm, Berat ≥20kg)', 'error');
    return;
  }
  
  // BMR Mifflin-St Jeor
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = Math.round(bmr * act);
  currentTDEE = tdee;
  
  // Tentukan target harian berdasarkan tujuan
  if (goal === 'lose') currentTargetCalories = tdee - 500;
  else if (goal === 'gain') currentTargetCalories = tdee + 300;
  else currentTargetCalories = tdee;
  
  if (currentTargetCalories < 1200) currentTargetCalories = 1200;
  
  const loseTarget = tdee - 500;
  const gainTarget = tdee + 300;
  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
  
  // Tampilkan hasil panel
  document.getElementById('placeholder').style.display = 'none';
  const resPanel = document.getElementById('results');
  resPanel.classList.add('show');
  setTimeout(() => resPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  
  animNum(document.getElementById('tdee-num'), tdee);
  document.getElementById('gc-lose').textContent = loseTarget.toLocaleString('id-ID');
  document.getElementById('gc-maint').textContent = tdee.toLocaleString('id-ID');
  document.getElementById('gc-gain').textContent = gainTarget.toLocaleString('id-ID');
  
  // Makronutrien (rasio 30% protein, 25% lemak, 45% karbo)
  const p = Math.round((currentTargetCalories * 0.30) / 4);
  const f = Math.round((currentTargetCalories * 0.25) / 9);
  const c = Math.round((currentTargetCalories * 0.45) / 4);
  
  document.getElementById('bar-p').style.width = '30%';
  document.getElementById('bar-f').style.width = '25%';
  document.getElementById('bar-c').style.width = '45%';
  document.getElementById('m-p').textContent = p;
  document.getElementById('m-f').textContent = f;
  document.getElementById('m-c').textContent = c;
  
  // BMI & rekomendasi
  document.getElementById('bmi-num').textContent = bmi;
  let cat, col, pos, info;
  if (bmi < 18.5) { 
    cat = 'Berat Kurang ⚠️'; 
    col = '#60a5fa'; 
    pos = (bmi / 18.5) * 20; 
    info = 'BMI-mu di bawah normal. Tingkatkan asupan kalori dengan makanan bergizi padat energi seperti kacang, alpukat, dan daging tanpa lemak.'; 
  }
  else if (bmi < 25) { 
    cat = 'Berat Ideal ✅'; 
    col = '#34d399'; 
    pos = 20 + ((bmi - 18.5) / 6.5) * 30; 
    info = 'Selamat! BMI-mu di kisaran ideal. Pertahankan dengan pola makan seimbang dan olahraga rutin 3–5x seminggu.'; 
  }
  else if (bmi < 30) { 
    cat = 'Kelebihan Berat ⚡'; 
    col = '#fbbf24'; 
    pos = 50 + ((bmi - 25) / 5) * 25; 
    info = 'BMI-mu sedikit di atas normal. Defisit kalori ringan 300–500 kkal/hari sambil olahraga rutin bisa membantu.'; 
  }
  else { 
    cat = 'Obesitas 🔴'; 
    col = '#f87171'; 
    pos = Math.min(75 + ((bmi - 30) / 10) * 25, 93); 
    info = 'BMI-mu masuk kategori obesitas. Sangat disarankan konsultasi dengan dokter spesialis gizi untuk program penurunan berat yang aman.'; 
  }
  
  document.getElementById('bmi-cat').textContent = cat;
  document.getElementById('bmi-cat').style.color = col;
  document.getElementById('bmi-info').textContent = info;
  setTimeout(() => { document.getElementById('bmi-thumb').style.left = pos + '%'; }, 200);
  
  // Tips berdasarkan tujuan
  const tipsDB = {
    lose: [
      { i: '🥗', t: 'Defisit Cerdas', d: 'Kurangi 300–500 kkal/hari. Jangan terlalu ekstrem agar otot tetap terjaga.' },
      { i: '💧', t: 'Hidrasi Optimal', d: 'Minum 2–3 liter air/hari untuk metabolisme dan kurangi lapar palsu.' },
      { i: '🏃', t: 'Cardio + Beban', d: 'Kombinasi keduanya bakar kalori lebih efisien & jaga massa otot.' },
      { i: '🌙', t: 'Tidur 7–9 Jam', d: 'Kurang tidur naikkan hormon lapar (ghrelin) dan rasa ingin makan.' }
    ],
    maintain: [
      { i: '⚖️', t: 'Konsistensi Kunci', d: 'Makan sesuai TDEE setiap hari. Variasikan menu agar tidak bosan.' },
      { i: '📊', t: 'Tracking Mingguan', d: 'Catat asupan kalori untuk memastikan kamu tetap di jalur yang tepat.' },
      { i: '🥦', t: 'Makanan Utuh', d: 'Prioritaskan whole food — lebih mengenyangkan dan kaya nutrisi.' },
      { i: '🧘', t: 'Kelola Stres', d: 'Stres kronis picu emotional eating yang ganggu keseimbangan kalorimu.' }
    ],
    gain: [
      { i: '💪', t: 'Surplus Lean', d: 'Makan 250–500 kkal di atas TDEE untuk pertumbuhan otot minimal lemak.' },
      { i: '🥩', t: 'Protein Tinggi', d: 'Target 1.6–2.2g protein per kg berat badan untuk sintesis otot optimal.' },
      { i: '🏋️', t: 'Progressive Overload', d: 'Tingkatkan beban atau repetisi setiap minggu untuk stimulasi otot.' },
      { i: '😴', t: 'Recovery = Latihan', d: 'Otot tumbuh saat istirahat. Tidur 8 jam dan jeda antar sesi latihan.' }
    ]
  };
  const tipContainer = document.getElementById('tips');
  tipContainer.innerHTML = '';
  tipsDB[goal].forEach(t => {
    const div = document.createElement('div'); 
    div.className = 'tip';
    div.style.animation = `fadeUp 0.4s ease both`;
    div.innerHTML = `<div class="tip-ico">${t.i}</div><div class="tip-body"><strong>${t.t}</strong><span>${t.d}</span></div>`;
    tipContainer.appendChild(div);
  });
  
  // Update tracker dengan target baru
  updateRingVisual();
  updateWeeklyHistory();
  saveToLocalStorage();
  showToast('📊 Perhitungan selesai! Target kalori sudah diperbarui.', 'success');
}

// ======================= BARCODE SCANNER =======================
function startBarcodeScanner() {
  const modal = document.getElementById('barcodeModal');
  const readerDiv = document.getElementById('barcode-reader');
  const resultDiv = document.getElementById('barcode-result');
  
  modal.style.display = 'block';
  resultDiv.innerHTML = '🔄 Menyalakan kamera... Izinkan akses kamera.';
  
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
  }
  
  html5QrCode = new Html5Qrcode("barcode-reader");
  
  const qrCodeSuccessCallback = (decodedText) => {
    resultDiv.innerHTML = `✅ Barcode terdeteksi: ${decodedText}<br>📦 Mencari data makanan...`;
    
    // Database makanan berdasarkan barcode (contoh)
    const foodDatabase = {
      "8998866201706": { name: "Indomie Goreng", calories: 380, protein: 8, carbs: 50, fat: 16, emoji: "🍜" },
      "8998866202345": { name: "Mie Sedap", calories: 370, protein: 7, carbs: 48, fat: 15, emoji: "🍜" },
      "8991001100011": { name: "Ultra Milk", calories: 120, protein: 4, carbs: 10, fat: 7, emoji: "🥛" },
      "8991002100022": { name: "Teh Botol Sosro", calories: 140, protein: 0, carbs: 35, fat: 0, emoji: "🧃" },
      "8998866203106": { name: "Pop Mie", calories: 250, protein: 6, carbs: 38, fat: 9, emoji: "🍜" },
      "8991001100028": { name: "Susu Frisian Flag", calories: 150, protein: 5, carbs: 12, fat: 8, emoji: "🥛" },
      "8998866201805": { name: "Roti Gandum", calories: 200, protein: 6, carbs: 35, fat: 4, emoji: "🍞" }
    };
    
    const food = foodDatabase[decodedText];
    if (food) {
      resultDiv.innerHTML += `<br>🍽️ ${food.name} (${food.calories} kkal) ditemukan! Menambahkan ke log...`;
      foodItems.push({
        name: food.name,
        detail: `Scan Barcode · ${new Date().toLocaleTimeString()}`,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        emoji: food.emoji
      });
      updateFoodList();
      showToast(`✅ ${food.name} +${food.calories} kkal ditambahkan (scan barcode)`, 'success');
    } else {
      resultDiv.innerHTML += `<br>⚠️ Makanan dengan barcode ${decodedText} tidak ditemukan di database.<br>Silakan tambah manual melalui form di bawah.`;
    }
    
    setTimeout(() => {
      if (html5QrCode) html5QrCode.stop().catch(() => {});
      modal.style.display = 'none';
    }, 3000);
  };
  
  html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, qrCodeSuccessCallback)
    .catch(err => {
      resultDiv.innerHTML = `❌ Gagal mengakses kamera: ${err}<br>Pastikan menggunakan HTTPS (localhost atau hosting) dan mengizinkan akses kamera.`;
    });
}

// ======================= LAPORAN MINGGUAN =======================
function showWeeklyReport() {
  const modal = document.getElementById('reportModal');
  modal.style.display = 'block';
  
  // Ambil 7 hari terakhir atau kurang
  const last7Days = weeklyHistory.slice(-7);
  const dates = last7Days.map(h => h.date);
  const caloriesData = last7Days.map(h => h.calories);
  const targetData = last7Days.map(h => h.target);
  
  if (weeklyChart) {
    weeklyChart.destroy();
  }
  
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  weeklyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Kalori yang Dikonsumsi',
          data: caloriesData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Target Kalori Harian',
          data: targetData,
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0.1,
          fill: false,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          labels: { 
            color: '#f0f6ff',
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
          } 
        },
        tooltip: {
          backgroundColor: '#0d1829',
          titleColor: '#f0f6ff',
          bodyColor: '#64748b',
          borderColor: '#06b6d4',
          borderWidth: 1
        }
      },
      scales: {
        y: { 
          title: { display: true, text: 'Kalori (kkal)', color: '#64748b', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }, 
          ticks: { color: '#64748b' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: { 
          ticks: { color: '#64748b', font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
  
  const totalWeek = caloriesData.reduce((a,b) => a + b, 0);
  const avgWeek = Math.round(totalWeek / (caloriesData.length || 1));
  const totalTarget = targetData.reduce((a,b) => a + b, 0);
  const avgTarget = Math.round(totalTarget / (targetData.length || 1));
  const diff = avgWeek - avgTarget;
  let status = '';
  if (diff > 0) status = `⚠️ Rata-rata kelebihan ${diff} kkal/hari dari target`;
  else if (diff < 0) status = `✅ Rata-rata defisit ${Math.abs(diff)} kkal/hari dari target`;
  else status = `🎯 Rata-rata pas dengan target!`;
  
  document.getElementById('weeklyStats').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:8px;">
      <div style="background:rgba(6,182,212,.1);padding:12px;border-radius:12px;text-align:center;">
        <div style="font-size:11px;color:var(--muted)">Total Kalori</div>
        <div style="font-size:24px;font-weight:800;color:var(--cyan)">${totalWeek.toLocaleString('id-ID')}</div>
        <div style="font-size:10px;color:var(--muted)">kkal / 7 hari</div>
      </div>
      <div style="background:rgba(245,158,11,.1);padding:12px;border-radius:12px;text-align:center;">
        <div style="font-size:11px;color:var(--muted)">Rata-rata Harian</div>
        <div style="font-size:24px;font-weight:800;color:var(--amber)">${avgWeek.toLocaleString('id-ID')}</div>
        <div style="font-size:10px;color:var(--muted)">kkal / hari</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px;background:rgba(255,255,255,.05);border-radius:10px;text-align:center;">
      ${status}
    </div>
  `;
}

// ======================= DOWNLOAD PDF =======================
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Background color
  doc.setFillColor(3, 7, 18);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Header
  doc.setTextColor(240, 246, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CaloriX", 20, 30);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Laporan Nutrisi · ${today}`, 20, 45);
  
  // Ringkasan Hari Ini
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Hari Ini", 20, 65);
  
  doc.setTextColor(240, 246, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Kalori: ${totalCaloriesToday} kkal`, 20, 80);
  doc.text(`Target Harian: ${currentTargetCalories} kkal`, 20, 90);
  doc.text(`Persentase Pencapaian: ${Math.round((totalCaloriesToday/currentTargetCalories)*100)}%`, 20, 100);
  
  // Rincian Makanan
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Rincian Makanan Hari Ini:", 20, 120);
  
  let yPos = 135;
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  foodItems.forEach((item, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      doc.setFillColor(3, 7, 18);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(14);
      doc.text("Rincian Makanan (lanjutan):", 20, yPos);
      yPos += 15;
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(10);
    }
    doc.text(`${idx+1}. ${item.name} - ${item.calories} kkal (P:${item.protein||0}g K:${item.carbs||0}g L:${item.fat||0}g)`, 25, yPos);
    yPos += 8;
  });
  
  // Laporan Mingguan
  yPos += 10;
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan 7 Hari Terakhir", 20, yPos);
  
  yPos += 15;
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const last7Days = weeklyHistory.slice(-7);
  last7Days.forEach((h, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      doc.setFillColor(3, 7, 18);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(9);
    }
    const percent = Math.round((h.calories / h.target) * 100);
    doc.text(`${h.date}: ${h.calories} / ${h.target} kkal (${percent}%)`, 25, yPos);
    yPos += 7;
  });
  
  // Footer
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text("Dihasilkan oleh CaloriX - Smart Nutrition Platform", 105, 285, { align: "center" });
  doc.text("Data bersifat estimasi. Konsultasikan dengan ahli gizi untuk saran medis.", 105, 292, { align: "center" });
  
  doc.save(`CaloriX_Report_${today.replace(/\//g, '-')}.pdf`);
  showToast("📄 PDF Laporan berhasil di download!", 'success');
}

// ======================= SCROLL ANIMATION =======================
function initScrollAnimation() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  elements.forEach(el => observer.observe(el));
}

// ======================= STATS COUNTER OBSERVER =======================
function initStatsObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animNum(e.target, +e.target.dataset.count);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

// ======================= MODAL HANDLERS =======================
function setupModals() {
  const scanBtn = document.getElementById('scanBarcodeBtn');
  const reportBtn = document.getElementById('weeklyReportBtn');
  const pdfBtn = document.getElementById('downloadPdfBtn');
  const resetBtn = document.getElementById('resetDataBtn');
  
  if (scanBtn) scanBtn.onclick = startBarcodeScanner;
  if (reportBtn) reportBtn.onclick = showWeeklyReport;
  if (pdfBtn) pdfBtn.onclick = downloadPDF;
  if (resetBtn) resetBtn.onclick = resetAllData;
  
  const closeModal = document.querySelectorAll('.modal-close');
  closeModal.forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    };
  });
  
  window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    }
  };
}

// ======================= INITIALIZATION =======================
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  if (weeklyHistory.length === 0) {
    initWeeklyHistory();
  }
  updateFoodList();
  updateRingVisual();
  initStatsObserver();
  initScrollAnimation();
  setupModals();
  
  // Prefill contoh untuk kalkulator
  const ageInput = document.getElementById('age');
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  if (ageInput) ageInput.value = 25;
  if (heightInput) heightInput.value = 170;
  if (weightInput) weightInput.value = 65;
});

// Export fungsi ke global scope agar bisa dipanggil dari HTML onclick
window.setG = setG;
window.calculateAndUpdate = calculateAndUpdate;
window.addCustomFood = addCustomFood;
window.deleteFood = deleteFood;
window.editFood = editFood;
window.startBarcodeScanner = startBarcodeScanner;
window.showWeeklyReport = showWeeklyReport;
window.downloadPDF = downloadPDF;
window.resetAllData = resetAllData;