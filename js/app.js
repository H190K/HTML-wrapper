/**
 * HTML Runner — SWE402
 * Main Application Logic
 * Fully client-side live code preview tool
 */

// ===================================
// DOM Element References
// ===================================

const runBtn = document.getElementById('runBtn');
const saveBtn = document.getElementById('saveBtn');
const aboutBtn = document.getElementById('aboutBtn');
const modalClose = document.getElementById('modalClose');
const aboutModal = document.getElementById('aboutModal');
const aboutContent = document.getElementById('aboutContent');
const htmlEditor = document.getElementById('htmlEditor');
const cssEditor = document.getElementById('cssEditor');
const jsEditor = document.getElementById('jsEditor');
const previewFrame = document.getElementById('previewFrame');
const previewWrapper = document.getElementById('previewWrapper');
const dimensionsLabel = document.getElementById('dimensionsLabel');
const yearDisplay = document.getElementById('yearDisplay');
const tabBtns = document.querySelectorAll('.tab-btn');
const deviceBtns = document.querySelectorAll('.device-btn');
const resizeHandle = document.getElementById('resizeHandle');
const mainContainer = document.querySelector('.main-container');

// ===================================
// Device Mode Configuration
// ===================================

const deviceModes = {
    desktop: { width: 1200, label: '1200 × AUTO' },
    tablet:  { width: 768,  label: '768 × AUTO'  },
    mobile:  { width: 375,  label: '375 × AUTO'  }
};

let currentDevice = 'desktop';

function applyDeviceViewport(device) {
    const mode = deviceModes[device];

    if (!mode) {
        return;
    }

    previewFrame.setAttribute('data-device', device);
    previewFrame.style.maxWidth = '';
    dimensionsLabel.textContent = mode.label;

    previewWrapper.scrollLeft = 0;
    previewWrapper.scrollTop = 0;
}

// ===================================
// Tab Switching Logic
// ===================================

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTab = btn.dataset.tab;
        document.querySelectorAll('.code-editor').forEach(editor => {
            editor.classList.remove('active');
            if (editor.dataset.lang === targetTab) {
                editor.classList.add('active');
            }
        });
    });
});

// ===================================
// Device Mode Switching
// ===================================

deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const device = btn.dataset.device;

        deviceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentDevice = device;

        // Start settle animation BEFORE changing viewport
        previewFrame.classList.remove('just-switched');
        void previewFrame.offsetWidth;
        previewFrame.classList.add('just-switched');

        // Change viewport
        applyDeviceViewport(device);

        // Run code - srcdoc template includes just-switched class for inner animation
        runCode();
        setTimeout(() => previewFrame.classList.remove('just-switched'), 400);
    });
});

// ===================================
// Resizable Panel Handle
// ===================================

let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeHandle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const containerRect = mainContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const newEditorWidth = e.clientX - containerRect.left;

    // Enforce min/max constraints
    const minEditorWidth = 250;
    const maxEditorWidth = containerWidth * 0.6;

    if (newEditorWidth >= minEditorWidth && newEditorWidth <= maxEditorWidth) {
        const editorPanel = document.querySelector('.editor-panel');
        const previewPanel = document.querySelector('.preview-panel');

        const editorPercent = (newEditorWidth / containerWidth) * 100;
        const previewPercent = 100 - editorPercent;

        editorPanel.style.width = `${editorPercent}%`;
        previewPanel.style.width = `${previewPercent}%`;
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
});

// ===================================
// Run / Rerun Code Logic
// ===================================

function runCode() {
    const html = htmlEditor.value;
    const css = cssEditor.value;
    const js = jsEditor.value;

    const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=${deviceModes[currentDevice].width}, initial-scale=1.0">
    <style>
*, *::before, *::after {
    box-sizing: border-box;
}
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
}
/* Outer wrapper that receives the animation trigger */
.runner-preview {
    width: 100%;
    margin: 0;
    padding: 0;
    /* Smooth content morph when device width changes - 300ms to sync with outer 400ms */
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity, transform;
}
/* Coordinated animation with outer iframe transition */
.runner-preview.just-switched {
    opacity: 0.85;
    transform: scale(0.985);
}
${css}
    </style>
</head>
<body>
<div class="runner-preview just-switched" id="runnerPreview">
${html}
</div>
<script>
// Remove animation class after it plays so it can be re-triggered
(function() {
    const preview = document.getElementById('runnerPreview');
    if (preview) {
        setTimeout(() => preview.classList.remove('just-switched'), 300);
    }
})();
<\/script>
<script>
${js}
<\/script>
    </body>
</html>`.trim();

    previewFrame.srcdoc = fullHTML;
    previewWrapper.scrollLeft = 0;
    previewWrapper.scrollTop = 0;
}

// Run button click handler
runBtn.addEventListener('click', runCode);

// Auto-run on page load
window.addEventListener('DOMContentLoaded', () => {
    applyDeviceViewport(currentDevice);
    runCode();
});

// ===================================
// Save as ZIP Logic
// ===================================

saveBtn.addEventListener('click', async () => {
    const html = htmlEditor.value || '<!-- Empty -->';
    const css = cssEditor.value || '/* Empty */';
    const js = jsEditor.value || '// Empty';

    if (typeof JSZip === 'undefined') {
        alert('JSZip not loaded. Please check your internet connection.');
        return;
    }

    const zip = new JSZip();

    zip.file('index.html', `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
${html}
    <script src="script.js"><\/script>
</body>
</html>`);

    zip.file('style.css', css);
    zip.file('script.js', js);

    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'html-runner-project.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Failed to create ZIP file: ' + err.message);
    }
});

// ===================================
// Footer Year Display
// ===================================

yearDisplay.textContent = new Date().getFullYear();

// ===================================
// About Modal
// ===================================

async function loadAbout() {
    try {
        const res = await fetch('assets/ABOUT.md');
        if (!res.ok) throw new Error('not found');
        const text = await res.text();
        const html = parseMarkdown(text);
        aboutContent.innerHTML = html;
    } catch {
        aboutContent.innerHTML = '<p>About information unavailable.</p>';
    }
}

function parseMarkdown(text) {
    let html = text;

    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    const tableRegex = /^\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm;
    html = html.replace(tableRegex, (match, header, body) => {
        const headerCells = header.split('|').map(h => h.trim()).filter(Boolean);
        const rows = body.trim().split('\n').map(row => 
            row.split('|').map(cell => cell.trim()).filter(Boolean)
        );
        let table = '<table><thead><tr>';
        headerCells.forEach(h => table += `<th>${h}</th>`);
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(cell => table += `<td>${cell}</td>`);
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    });

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    html = html.split('\n\n').map(block => {
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<pre') || block.startsWith('<table')) {
            return block;
        }
        return `<p>${block}</p>`;
    }).join('\n');

    return html;
}

aboutBtn.addEventListener('click', async () => {
    if (!aboutContent.innerHTML) await loadAbout();
    aboutModal.classList.add('open');
    aboutModal.setAttribute('aria-hidden', 'false');
});

function closeModal() {
    aboutModal.classList.remove('open');
    aboutModal.setAttribute('aria-hidden', 'true');
}

modalClose.addEventListener('click', closeModal);
aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal.classList.contains('open')) closeModal();
});

// ===================================
// Tab Key Support (Tab inserts tab character)
// ===================================

document.querySelectorAll('.code-editor').forEach(editor => {
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '\t' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 1;
        }
    });
});
