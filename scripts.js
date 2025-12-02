// =============================
// Qtum Snap config
// =============================

// If you published as scoped, e.g. "@meherett/qtum-snap",
// change this to: const snapId = 'npm:@meherett/qtum-snap';
const snapId = 'npm:qtum-snap';

// Optional: pin to a version, e.g. '^1.0.0-beta.2'.
// Leave as undefined to always install the latest version.
const snapVersion = undefined;

// =============================
// DOM references
// =============================

const installBtn = document.getElementById('install');
const uninstallBtn = document.getElementById('uninstall');
const envEl = document.getElementById('env');
const snapStatusEl = document.getElementById('snap-status');

// Carousel DOM
const carouselImage = document.getElementById('carousel-image');
const carouselCaption = document.getElementById('carousel-caption');
const carouselDotsContainer = document.getElementById('carousel-dots');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');

// =============================
// Snap state helpers
// =============================

function setInstalledState(version) {
  if (!installBtn || !snapStatusEl) return;

  installBtn.textContent = 'Qtum Snap already installed';
  installBtn.disabled = true;

  if (uninstallBtn) {
    uninstallBtn.disabled = false; // enable uninstall when installed
  }

  snapStatusEl.innerHTML =
    (version ? `Version <strong>${version}</strong>` : 'Qtum Snap') + ' is already installed on this wallet.'
}

function setNotInstalledState() {
  if (!installBtn || !snapStatusEl) return;

  installBtn.textContent = 'Install Qtum Snap';
  installBtn.disabled = false;

  if (uninstallBtn) {
    uninstallBtn.disabled = true; // uninstall disabled when not installed
  }

  snapStatusEl.textContent = 'Qtum Snap is not installed yet on this wallet.';
}

async function detectEnvironmentAndSnap() {
  if (!envEl || !installBtn || !uninstallBtn) return;

  if (!window.ethereum) {
    envEl.textContent =
      'No Ethereum provider detected. Install MetaMask Flask and open this page in that browser profile.';
    installBtn.disabled = true;
    uninstallBtn.disabled = true;
    return;
  }

  try {
    const snaps = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });

    envEl.textContent =
      'Snaps are supported. You can install Qtum Snap below.';

    const snap = snaps[snapId];

    if (snap) {
      setInstalledState(snap.version);
    } else {
      setNotInstalledState();
    }
  } catch (e) {
    console.error(e);
    envEl.textContent =
      'This MetaMask does not support Snaps yet. Please use MetaMask Flask.';
    installBtn.disabled = true;
    uninstallBtn.disabled = true;
  }
}

async function installSnap() {
  if (!window.ethereum) {
    alert('MetaMask Flask is required to install Qtum Snap.');
    return;
  }
  if (!installBtn) return;

  installBtn.disabled = true;
  installBtn.textContent = 'Installing Qtum Snap…';

  try {
    const params = snapVersion ? { version: snapVersion } : {};
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: params,
      },
    });

    await detectEnvironmentAndSnap();
  } catch (e) {
    console.error(e);
    alert('Install failed: ' + (e.message || e));
    setNotInstalledState();
  }
}

function showUninstallInstructions() {
  alert(
    'How to uninstall Qtum Snap:\n\n' +
      '1. Open MetaMask.\n' +
      "2. Click the menu (three dots) in the top-right corner and go to \"Snaps\".\n" +
      '3. Find "Qtum Snap" in the list.\n' +
      "4. Click the three dots next to it and choose \"Remove\".\n\n" +
      'You can always reinstall Qtum Snap from this page later.'
  );
}

// =============================
// Carousel configuration
// =============================

const screenshots = [
  {
    src: 'images/pngs/home.png',
    caption: 'Home · Snapshot of your Qtum wallet',
  },
  {
    src: 'images/pngs/dashboard.png',
    caption: 'Dashboard · View with QTUM and QRC20 balances',
  },
  {
    src: 'images/pngs/receive.png',
    caption: 'Receive · QR code with Qtum & hex addresses',
  },
  {
    src: 'images/pngs/add-qrc20.png',
    caption: 'Tokens · Search and add a QRC20 contract',
  },
  {
    src: 'images/pngs/send.png',
    caption: 'Send · Choose between native QTUM or QRC20',
  },
  {
    src: 'images/pngs/sending.png',
    caption: 'Sending · Transaction in progress and broadcasting',
  }
];

let currentScreenshotIndex = 0;
let autoRotateId = null; // <-- auto-rotate timer id

function renderDots() {
  if (!carouselDotsContainer) return;
  carouselDotsContainer.innerHTML = '';

  screenshots.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className =
      'carousel-dot' + (index === currentScreenshotIndex ? ' active' : '');
    dot.addEventListener('click', () => {
      setScreenshot(index);
      restartAutoRotate();
    });
    carouselDotsContainer.appendChild(dot);
  });
}

function setScreenshot(index) {
  if (!screenshots.length || !carouselImage || !carouselCaption) return;

  currentScreenshotIndex = (index + screenshots.length) % screenshots.length;
  const { src, caption } = screenshots[currentScreenshotIndex];

  carouselImage.src = src;
  carouselImage.alt = caption;
  carouselCaption.textContent = caption;

  if (!carouselDotsContainer) return;
  const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentScreenshotIndex);
  });
}

function showNextScreenshot() {
  setScreenshot(currentScreenshotIndex + 1);
}

function showPrevScreenshot() {
  setScreenshot(currentScreenshotIndex - 1);
}

// Auto-rotate every 5 seconds
function startAutoRotate() {
  if (autoRotateId) {
    clearInterval(autoRotateId);
  }
  autoRotateId = setInterval(() => {
    showNextScreenshot();
  }, 5000);
}

function restartAutoRotate() {
  startAutoRotate();
}

// =============================
// Event wiring & initialization
// =============================

function init() {
  // Snap buttons
  if (installBtn) {
    installBtn.addEventListener('click', installSnap);
  }
  if (uninstallBtn) {
    uninstallBtn.addEventListener('click', showUninstallInstructions);
  }

  // Carousel arrows
  if (carouselPrev) {
    carouselPrev.addEventListener('click', () => {
      showPrevScreenshot();
      restartAutoRotate();
    });
  }
  if (carouselNext) {
    carouselNext.addEventListener('click', () => {
      showNextScreenshot();
      restartAutoRotate();
    });
  }

  // Initial snap detection
  detectEnvironmentAndSnap();

  // Initialize carousel
  if (screenshots.length > 0) {
    renderDots();
    setScreenshot(0);
    startAutoRotate(); // <-- kick off auto-rotate
  }
}

window.addEventListener('load', init);
