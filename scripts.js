// =============================
// Qtum Snap config
// =============================

// If you published as scoped.
const snapID = 'npm:qtum-snap';
// const snapID = 'local:http://localhost:8081';

// Optional: pin to a version, e.g. '1.0.0-beta.1' package.
// Leave as undefined to always install the latest version.
const snapVersion = undefined;

// Simple env flag: local = dev, npm = prod
const isDevEnvironment = snapID.startsWith('local:');

// =============================
// DOM references
// =============================

const installButton = document.getElementById('install');
const uninstallButton = document.getElementById('uninstall');
const envElement = document.getElementById('env');
const snapStatusElement = document.getElementById('snap-status');
const advancedOptionsToggle = document.getElementById('advanced-options-toggle');
const advancedOptionsContent = document.getElementById('advanced-options-content');
const versionInput = document.getElementById('version');

// Carousel DOM
const carouselImage = document.getElementById('carousel-image');
const carouselCaption = document.getElementById('carousel-caption');
const carouselDotsContainer = document.getElementById('carousel-dots');
const carouselPrevious = document.getElementById('carousel-previous');
const carouselNext = document.getElementById('carousel-next');

// =============================
// Helpers for npm version lookup
// =============================

let cachedLatestVersion = null;

function getNPMPackageNameFromSnapID() {
  // snapID format: "npm:qtum-snap" or "npm:@scope/qtum-snap"
  if (!snapID.startsWith('npm:')) {
    return null;
  }
  return snapID.replace('npm:', '');
}

async function getLatestSnapVersionFromNPM() {
  if (cachedLatestVersion) {
    return cachedLatestVersion;
  }

  const pkgName = getNPMPackageNameFromSnapID();
  if (!pkgName) {
    return null; // local snap or non-npm ID
  }

  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`,
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch npm version for ${pkgName}`);
    }
    const data = await res.json();
    cachedLatestVersion = data.version || null;
    return cachedLatestVersion;
  } catch (err) {
    console.error('Error fetching latest npm version:', err);
    return null;
  }
}

// =============================
// Snap state helpers
// =============================

function setInstalledState(installedVersion, latestVersion) {
  if (!installButton || !snapStatusElement) return;

  // "Target" = what this page will request when you click Install
  const isAdvanced = advancedOptionsToggle && advancedOptionsToggle.checked;
  const versionFromInput = (isAdvanced && versionInput) ? versionInput.value.trim() : '';
  const targetVersion = versionFromInput || snapVersion || latestVersion || null;

  let buttonLabel = 'Re-install Qtum Snap';
  let statusHtml = '';

  if (installedVersion && targetVersion) {
    if (installedVersion === targetVersion) {
      // === Installed is latest ===
      if (isDevEnvironment) {
        // DEV: allow re-install
        buttonLabel = 'Re-install Qtum Snap';
        installButton.disabled = false;
      } else {
        // PROD: no re-install when already latest
        buttonLabel = 'Already installed latest version';
        installButton.disabled = true;
      }

      const versionLabel = isAdvanced ? `<strong>Specific Version</strong>` : `latest <strong>${targetVersion}</strong>`;
      statusHtml =
        'Qtum Snap is installed on this wallet. ' +
        `You are on the ${versionLabel} package.`;
    } else {
      // Installed but not the target version
      buttonLabel = `Update Qtum Snap to ${targetVersion}`;
      installButton.disabled = false;

      const versionLabel = isAdvanced ? `<strong>Specific Version</strong>` : `latest <strong>${targetVersion}</strong>`;
      statusHtml =
        'Qtum Snap is installed on this wallet. ' +
        `This page will upgrade you from <strong>${installedVersion}</strong> to the ${versionLabel} package.`;
    }
  } else if (installedVersion) {
    // We don't know the target/latest version (npm request failed, etc.)
    // Don't lock the user out here.
    buttonLabel = 'Re-install Qtum Snap';
    installButton.disabled = false;

    statusHtml =
      'Qtum Snap is installed on this wallet. ' +
      `Current version is <strong>${installedVersion}</strong> package.`;
  } else {
    // This path is basically "not installed", but kept for completeness
    buttonLabel = 'Install Qtum Snap';
    installButton.disabled = false;

    statusHtml = 'Qtum Snap is already installed on this wallet.';
  }

  installButton.textContent = buttonLabel;

  if (uninstallButton) {
    // Uninstall should always be allowed when snap exists
    uninstallButton.disabled = false;
  }

  snapStatusElement.innerHTML = statusHtml;
}

function setNotInstalledState(latestVersion) {
  if (!installButton || !snapStatusElement) return;

  const isAdvanced = advancedOptionsToggle && advancedOptionsToggle.checked;
  const versionFromInput = (isAdvanced && versionInput) ? versionInput.value.trim() : '';
  const targetVersion = versionFromInput || snapVersion || latestVersion || null;

  installButton.textContent = 'Install Qtum Snap';
  installButton.disabled = false;

  if (uninstallButton) {
    uninstallButton.disabled = true; // uninstall disabled when not installed
  }

  if (targetVersion) {
    const versionLabel = isAdvanced ? `<strong>Specific Version</strong>` : `latest <strong>${targetVersion}</strong>`;
    snapStatusElement.innerHTML = `Qtum Snap is not installed yet on this wallet. This page will install the ${versionLabel} package.`;
  } else {
    snapStatusElement.innerHTML = 'Qtum Snap is not installed yet on this wallet.';
  }
}

async function detectEnvironmentAndSnap() {
  if (!envElement || !installButton || !uninstallButton) return;

  if (!window.ethereum) {
    envElement.textContent =
      'No Ethereum provider detected. Install MetaMask and open this page in that browser profile.';
    installButton.disabled = true;
    uninstallButton.disabled = true;
    if (advancedOptionsToggle) {
      advancedOptionsToggle.disabled = true;
    }
    return;
  }

  if (advancedOptionsToggle) {
    advancedOptionsToggle.disabled = false;
  }

  try {
    const snaps = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });

    envElement.textContent =
      'Snaps are supported. You can install Qtum Snap below.';

    const snap = snaps[snapID];

    if (snap) {
      const installedVersion = snap.version;
      const latestVersion = await getLatestSnapVersionFromNPM();
      setInstalledState(installedVersion, latestVersion);
    } else {
      const latestVersion = await getLatestSnapVersionFromNPM();
      setNotInstalledState(latestVersion);
    }
  } catch (e) {
    console.error(e);
    envElement.textContent =
      'This MetaMask does not support Snaps yet. Please use latest MetaMask.';
    installButton.disabled = true;
    uninstallButton.disabled = true;
    if (advancedOptionsToggle) {
      advancedOptionsToggle.disabled = true;
    }
  }
}

// =============================
// Install / Update handler
// =============================

async function installSnap() {
  if (!window.ethereum) {
    alert('MetaMask is required to install Qtum Snap.');
    return;
  }
  if (!installButton) return;

  installButton.disabled = true;

  try {
    // 1. Decide which version this page wants to install
    const isAdvanced = advancedOptionsToggle && advancedOptionsToggle.checked;
    const versionFromInput = (isAdvanced && versionInput) ? versionInput.value.trim() : '';
    let versionToRequest = versionFromInput || snapVersion;

    // For npm (prod) we look up the latest version if none specified.
    if (!versionToRequest && !isDevEnvironment) {
      const latestVersion = await getLatestSnapVersionFromNPM();
      // If we still don't have a version, default to "*" (latest) for NPM snaps
      versionToRequest = latestVersion || '*';
    }

    const params = {};
    if (versionToRequest) {
      params.version = versionToRequest;
    }

    // 2. Check currently installed version (if any) to set button text
    let label = 'Installing Qtum Snap…';

    try {
      const snaps = await window.ethereum.request({
        method: 'wallet_getSnaps',
      });
      const existingSnap = snaps[snapID];

      if (isDevEnvironment) {
        // LOCAL DEV: only care if it exists or not
        if (existingSnap) {
          label = 'Re-installing Qtum Snap…';
        } else {
          label = 'Installing Qtum Snap…';
        }
      } else if (existingSnap && versionToRequest) {
        // PROD (npm): compare installed vs target version
        if (existingSnap.version !== versionToRequest) {
          label = 'Updating Qtum Snap…';
        } else {
          label = 'Re-installing Qtum Snap…';
        }
      }
    } catch (innerErr) {
      console.warn('Could not read existing snaps for label decision:', innerErr);
    }

    installButton.textContent = label;

    console.log('[Qtum Snap] wallet_requestSnaps params:', {
      [snapID]: params,
    });

    // 3. Request installation/upgrade
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapID]: params,
      },
    });

    // 4. Refresh state after install/upgrade
    await detectEnvironmentAndSnap();
  } catch (e) {
    console.error(e);
    alert('Install failed: ' + (e.message || e));
    const latestVersion = await getLatestSnapVersionFromNPM();
    setNotInstalledState(latestVersion);
  }
}

// =============================
// Uninstall instructions
// =============================

function showUninstallInstructions() {
  alert(
    'How to uninstall Qtum Snap:\n\n' +
      'IMPORTANT: Export your private keys first from the Snap dashboard if you need to keep access to your wallet/accounts.\n\n' +
      '1. Open MetaMask.\n' +
      '2. Click the menu (three dots) in the top-right corner and go to "Snaps".\n' +
      '3. Find "Qtum Snap" in the list.\n' +
      '4. Click the three dots next to it and choose "Remove".\n\n' +
      'You can always reinstall Qtum Snap from this page later.',
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
    caption: 'Receive · QR code with Qtum & Hexadecimal addresses',
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
  },
];

let currentScreenshotIndex = 0;
let autoRotateID = null; // <-- auto-rotate timer id

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
  if (autoRotateID) {
    clearInterval(autoRotateID);
  }
  autoRotateID = setInterval(() => {
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
  if (installButton) {
    installButton.addEventListener('click', installSnap);
  }
  if (uninstallButton) {
    uninstallButton.addEventListener('click', showUninstallInstructions);
  }

  // Advanced options
  if (advancedOptionsToggle && advancedOptionsContent) {
    const switchWrapper = document.querySelector('.switch-wrapper');
    if (switchWrapper) {
      switchWrapper.addEventListener('click', (e) => {
        // Only toggle if the click was directly on the wrapper background, 
        // avoiding double-toggles from labels/inputs that handle it by default.
        if (e.target.tagName !== 'INPUT' && !e.target.closest('label')) {
          advancedOptionsToggle.checked = !advancedOptionsToggle.checked;
          // Trigger change event manually
          advancedOptionsToggle.dispatchEvent(new Event('change'));
        }
      });
    }

    // Initial sync
    if (advancedOptionsToggle.checked) {
      advancedOptionsContent.classList.add('expanded');
      // Auto-fill version if empty on load
      (async () => {
        if (versionInput && !versionInput.value.trim()) {
          const latest = await getLatestSnapVersionFromNPM();
          if (latest) {
            versionInput.value = latest;
            detectEnvironmentAndSnap();
          }
        }
      })();
    }

    advancedOptionsToggle.addEventListener('change', async (event) => {
      if (event.currentTarget.checked) {
        advancedOptionsContent.classList.add('expanded');
        // Auto-fill version if empty
        if (versionInput && !versionInput.value.trim()) {
          const latest = await getLatestSnapVersionFromNPM();
          if (latest) {
            versionInput.value = latest;
          }
        }
      } else {
        advancedOptionsContent.classList.remove('expanded');
      }
      // Refresh status messages
      detectEnvironmentAndSnap();
    });

    if (versionInput) {
      versionInput.addEventListener('input', () => {
        detectEnvironmentAndSnap();
      });
    }
  }

  // Carousel arrows
  if (carouselPrevious) {
    carouselPrevious.addEventListener('click', () => {
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

  // Periodically check for snap status changes to provide a live update feel
  setInterval(detectEnvironmentAndSnap, 5000);
}

window.addEventListener('load', init);
