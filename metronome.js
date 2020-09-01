// select HTML elements
const metronomeBeats = document.querySelector('.metronome__beats');
const metronomeSpeedometer = document.querySelector('.metronome__speedometer');
const metronomeControls = document.querySelector('.metronome__controls');
const perMinuteRange = metronomeControls.querySelector('#beatsPerMinute');
const perMeasureRange = metronomeControls.querySelector('#beatsPerMeasure');
const offbeatCheckbox = metronomeControls.querySelector('#offbeat');
const playBtn = metronomeControls.querySelector('#play');
const pauseBtn = metronomeControls.querySelector('#pause');

// metronome default settings
const settings = {
  beatsPerMinute: (60 / perMinuteRange.value) * 1000,
  beatsPerMeasure: perMeasureRange.value,
  playOffbeat: offbeatCheckbox.checked,
  isRunning: false,
};
let count = 1;

// safari does not support window.AudioContext
const AudioContext = new (window.AudioContext || window.webkitAudioContext)();

// chrome requires a user to interract with the app before defining an audio context
let ctx;
let firstBeatOscillator;
let offBeatOscillator;
let otherBeatOscillator;

// helper function waits for the amount of milliseconds passed to resolve a promise
const wait = (ms = 0) => new Promise((res) => setTimeout(res, ms));

// oscillator prototype
function Oscillator(frequency) {
  this.oscillator = ctx.createOscillator();
  this.oscillator.frequency.value = frequency;
  this.oscillator.type = 'sine';
  this.gainNode = ctx.createGain();
  this.gainNode.gain.value = 0;
  this.oscillator.connect(this.gainNode);
  this.gainNode.connect(ctx.destination);
  this.oscillator.start(0);
  this.playClick = async function () {
    this.gainNode.gain.value = 1;
    await wait(100);
    this.gainNode.gain.value = 0;
  };
  this.turnOff = function () {
    this.oscillator.stop(0);
    this.oscillator.disconnect(this.gainNode);
    this.gainNode.disconnect(ctx.destination);
  };
}

async function showActiveBeat(tempo, count) {
  const activeBeat = metronomeBeats.querySelector(`[data-beat="${count}"]`);
  // add .active class to current beat
  if (document.contains(activeBeat)) {
    activeBeat.classList.add('active');
    // play oscillator at different frequency on 1st and other beats
    if (count === 1) {
      firstBeatOscillator.playClick();
    } else {
      otherBeatOscillator.playClick();
    }
  }
  // remove .active class from current beat after tempo has elapsed
  await wait(tempo);
  if (document.contains(activeBeat)) {
    activeBeat.classList.remove('active');
  }
}

async function showActiveOffbeat(tempo, count) {
  const activeBeat = metronomeBeats.querySelector(`[data-beat="${count}"]`);
  // mark offbeat after half of the interval has elapsed
  await wait(tempo / 2);
  // return if active beat has been removed from the DOM
  if (!document.contains(activeBeat)) return;
  const currentOffbeat = metronomeBeats.querySelector(
    `[data-offbeat="${count}"]`
  );
  // play offbeat oscillator
  offBeatOscillator.playClick();
  // remove .active class from current beat
  activeBeat.classList.remove('active');
  // add .active class to current offbeat
  currentOffbeat.classList.add('active');
  // remove .active class from current offbeat after half of the interval has elapsed
  await wait(tempo / 2);
  if (document.contains(currentOffbeat)) {
    currentOffbeat.classList.remove('active');
  }
}

async function startMetronome(metronomeSettings) {
  showActiveBeat(metronomeSettings.beatsPerMinute, count);
  // marks offbeat if playOffbeat is set to true
  metronomeSettings.playOffbeat
    ? showActiveOffbeat(metronomeSettings.beatsPerMinute, count)
    : null;
  // loops over and resets the counter to 0 depending on the beatsPerMeasure settings
  count < metronomeSettings.beatsPerMeasure ? (count += 1) : (count = 1);
  // after the interval has elapsed create recursion if the metronome is running
  await wait(metronomeSettings.beatsPerMinute);
  metronomeSettings.isRunning ? startMetronome(metronomeSettings) : null;
}

function stopMetronome() {
  settings.isRunning = false;
}

async function updateBeats() {
  // get current number of beats and calculate how many to add
  const existingBeats = metronomeBeats.children.length / 2;
  const beatsToAdd = settings.beatsPerMeasure - existingBeats;
  if (beatsToAdd >= 0) {
    // create a new array with number of beats to add as length
    const newBeats = [...Array(beatsToAdd)]
      // create markup for each new beat
      .map(
        (beat, i) =>
          `<li data-beat="${existingBeats + i + 1}" 
            class="metronome__beat"><span></span></li>
          <li data-offbeat="${existingBeats + i + 1}" 
            class="metronome__offbeat"><span></span></li>`
      )
      .join('');
    // insert markup into the DOM
    metronomeBeats.insertAdjacentHTML('beforeend', newBeats);
  } else {
    // remove last child of beats <ul> for each beat to remove
    for (let i = 0; i < beatsToAdd * -2; i++) {
      metronomeBeats.lastElementChild.remove();
    }
  }
  await wait(100);
  metronomeBeats.querySelectorAll('li').forEach((el, i) => {
    el.setAttribute(
      'style',
      `transform: rotateZ(${(180 / settings.beatsPerMeasure) * i}deg)`
    );
  });
}

function updateSettings(e) {
  switch (e.target) {
    case perMinuteRange:
      settings.beatsPerMinute = (60 / parseInt(e.target.value)) * 1000;
      metronomeSpeedometer.textContent = `${parseInt(e.target.value)}bpm`;
      break;
    case perMeasureRange:
      settings.beatsPerMeasure = parseInt(e.target.value);
      updateBeats();
      break;
    case offbeatCheckbox:
      settings.playOffbeat = e.target.checked;
      document.body.style.setProperty('--opacity', e.target.checked ? 1 : 0);
      break;
    default:
      break;
  }
}

function toggleBtnsState(btnsArray) {
  btnsArray.forEach((btn) => {
    btn.disabled ? (btn.disabled = false) : (btn.disabled = true);
  });
  metronomeControls.querySelector('button:not([disabled])').focus();
}

function handlePlayClick() {
  ctx = AudioContext;
  toggleBtnsState([playBtn, pauseBtn]);
  settings.isRunning = true;
  firstBeatOscillator = new Oscillator(2200);
  otherBeatOscillator = new Oscillator(1600);
  offBeatOscillator = new Oscillator(1200);
  startMetronome(settings);
}

function handlePauseClick() {
  toggleBtnsState([playBtn, pauseBtn]);
  settings.isRunning = false;
  firstBeatOscillator.turnOff();
  otherBeatOscillator.turnOff();
  offBeatOscillator.turnOff();
}

updateBeats();
metronomeSpeedometer.textContent = `${perMinuteRange.value}bpm`;

metronomeControls.addEventListener('change', updateSettings);
playBtn.addEventListener('click', handlePlayClick);
pauseBtn.addEventListener('click', handlePauseClick);
