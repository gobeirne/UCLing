
console.log("UC Ling App – script.js v2.0 – persistent calibration");

const languageData = {
  maori: {
    title: "Ling Sound Test",
    phonemes: ['m', 'p', 't', 'h', 'a', 'i', 'o'],
    prefix: "TeReo_"
  },
  english: {
    title: "Ling Sound Test",
    phonemes: ['m', 'or', 'ah', 'oo', 'ee', 'sh', 'ss'],
    prefix: "NZEng_"
  }
};

let currentLanguage = "maori";
let currentAudio = null;
let currentButton = null;
let isCalibrated = false;

let calibratedMaxDB = null;
let sliderMinDB = -100;
let sliderMaxDB = 0;
let currentSliderDB = 0;
let calibratedGain = 1;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const audioCache = {};
const audioBuffers = {};
const audioElements = {};

function preloadSounds() {
  const promises = [];

  Object.values(languageData).forEach(lang => {
    lang.phonemes.forEach(phoneme => {
      const p = lang.prefix;
      const key1 = `${p}${phoneme}`;
      const key3 = `${p}${[phoneme, phoneme, phoneme].join('_')}`;
      const key5 = `${p}${Array(5).fill(phoneme).join('_')}`;
      [key1, key3, key5].forEach(key => {
        const url = `sounds/${key}.mp3`;
        audioCache[key] = url;
        promises.push(fetch(url)
          .then(r => r.arrayBuffer())
          .then(buf => audioCtx.decodeAudioData(buf))
          .then(decoded => { audioBuffers[key] = decoded; }));
      });
    });
  });

  ['TeReo_calib', 'NZEng_calib'].forEach(key => {
    const url = `sounds/${key}.mp3`;
    audioCache[key] = url;
    const el = new Audio(url);
    el.preload = "auto";
    audioElements[key] = el;
  });

  return Promise.all(promises);
}

function updateGainFromSlider() {
  const slider = document.getElementById('volume');
  let rawValue = parseFloat(slider.value);

  if (isCalibrated) {
    const max = parseFloat(slider.max);
    const tolerance = 0.25;
    const snapped = (Math.abs(rawValue - max) <= tolerance)
      ? max
      : Math.round(rawValue / 5) * 5;
    slider.value = snapped;
    currentSliderDB = snapped;
    document.getElementById('dB-label').textContent = `${snapped} dB A`;
    const attenuation = calibratedMaxDB - snapped;
    calibratedGain = Math.pow(10, -attenuation / 20);
  } else {
    const snapped = Math.round(rawValue / 5) * 5;
    slider.value = snapped;
    currentSliderDB = snapped;
    document.getElementById('dB-label').textContent = `${snapped} dB FS`;
    calibratedGain = Math.pow(10, snapped / 20);
  }
}

function stopCurrentAudio() {
  if (currentAudio && currentAudio.stop) currentAudio.stop();
  if (currentAudio && currentAudio.pause) currentAudio.pause();
  currentAudio = null;
  if (currentButton) currentButton.classList.remove('active');
  currentButton = null;
}

function playSound(key, button) {
  stopCurrentAudio();
  const buffer = audioBuffers[key];
  if (!buffer) {
    console.warn("No decoded buffer for:", key);
    return;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = calibratedGain;
  source.connect(gainNode).connect(audioCtx.destination);
  source.start();

  currentAudio = source;
  currentButton = button;
  button.classList.add('active');

  source.onended = () => {
    button.classList.remove('active');
    currentAudio = null;
    currentButton = null;
  };
}

function createButtons() {
  const container = document.getElementById('buttons-container');
  container.innerHTML = "";
  const data = languageData[currentLanguage];

  data.phonemes.forEach(phoneme => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'phoneme-row';

    const key1 = `${data.prefix}${phoneme}`;
    const btn1 = document.createElement('button');
    btn1.textContent = (currentLanguage === "maori") ? `/${phoneme}/` : phoneme;
    btn1.onclick = () => playSound(key1, btn1);
    rowDiv.appendChild(btn1);

    const key3 = `${data.prefix}${[phoneme, phoneme, phoneme].join('_')}`;
    const btn3 = document.createElement('button');
    btn3.textContent = '×3';
    btn3.onclick = () => playSound(key3, btn3);
    rowDiv.appendChild(btn3);

    const key5 = `${data.prefix}${Array(5).fill(phoneme).join('_')}`;
    const btn5 = document.createElement('button');
    btn5.textContent = '×5';
    btn5.onclick = () => playSound(key5, btn5);
    rowDiv.appendChild(btn5);

    container.appendChild(rowDiv);
  });
}

function setLanguage(lang) {
  if (!languageData[lang]) return;
  currentLanguage = lang;
  localStorage.setItem("selectedLanguage", lang);
  document.getElementById("app-title").textContent = languageData[lang].title;
  createButtons();
  document.getElementById("btn-maori").classList.toggle("active", lang === "maori");
  document.getElementById("btn-english").classList.toggle("active", lang === "english");
}

function showTestButton() {
  let testButton = document.getElementById('test-sound');
  if (!testButton) {
    testButton = document.createElement('button');
    testButton.id = 'test-sound';
    testButton.textContent = 'Test Calibrated Sound';
    testButton.className = 'calibrate';
    testButton.onclick = () => {
      stopCurrentAudio();
      const key = currentLanguage === "english" ? "NZEng_calib" : "TeReo_calib";
      const audio = audioElements[key].cloneNode();
      const track = audioCtx.createMediaElementSource(audio);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = calibratedGain;
      track.connect(gainNode).connect(audioCtx.destination);
      audio.play();
      currentAudio = audio;
      audio.onended = () => currentAudio = null;
    };
    document.querySelector('.controls').appendChild(testButton);
  }
}

function toggleCalibration(button) {
  stopCurrentAudio();
  alert("Please turn your device volume all the way up before continuing.");
  const key = currentLanguage === "english" ? "NZEng_calib" : "TeReo_calib";
  const audio = audioElements[key].cloneNode();
  audio.volume = 1.0;
  audio.loop = true;
  audio.play();

  setTimeout(() => {
    const measured = prompt("Enter measured calibration level (in dB A):");
    audio.pause();
    if (!measured || isNaN(measured)) return;
    calibratedMaxDB = parseFloat(measured);
    isCalibrated = true;
    sliderMaxDB = calibratedMaxDB;
    sliderMinDB = Math.floor(calibratedMaxDB / 5) * 5 - 60;
    const slider = document.getElementById('volume');
    slider.min = sliderMinDB;
    slider.max = sliderMaxDB;
    slider.step = 0.1;
    slider.value = sliderMaxDB;
    document.getElementById('mode-badge').textContent = `Calibrated Mode`;
    updateGainFromSlider();
    showTestButton();
    localStorage.setItem("calibrationData", JSON.stringify({
      level: calibratedMaxDB,
      timestamp: new Date().toISOString()
    }));
  }, 2000);
}

function applyStoredCalibration(data) {
  calibratedMaxDB = data.level;
  isCalibrated = true;
  sliderMaxDB = calibratedMaxDB;
  sliderMinDB = Math.floor(calibratedMaxDB / 5) * 5 - 60;
  const slider = document.getElementById('volume');
  slider.min = sliderMinDB;
  slider.max = sliderMaxDB;
  slider.step = 0.1;
  slider.value = sliderMaxDB;
  document.getElementById('mode-badge').textContent = `Calibrated Mode`;
  updateGainFromSlider();
  showTestButton();
}

window.onload = async () => {
  await preloadSounds();
  const savedLang = localStorage.getItem("selectedLanguage");
  if (savedLang && languageData[savedLang]) {
    currentLanguage = savedLang;
  }
  setLanguage(currentLanguage);

  const slider = document.getElementById('volume');
  slider.min = -100;
  slider.max = 0;
  slider.step = 0.1;
  slider.value = 0;
  slider.addEventListener('input', updateGainFromSlider);
  slider.addEventListener('change', updateGainFromSlider);
  slider.addEventListener('touchend', updateGainFromSlider);

  updateGainFromSlider();

  const storedCal = localStorage.getItem("calibrationData");
  if (storedCal) {
    const data = JSON.parse(storedCal);
    const date = new Date(data.timestamp);
    const formatted = date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
    const msg = `You last calibrated this device to ${data.level} dB A on ${formatted}. Use this calibration?`;
    if (confirm(msg)) {
      alert("Remember to turn your device volume to full.");
      applyStoredCalibration(data);
    }
  }
};
