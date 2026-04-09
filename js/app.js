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
const dimensionsLabel = document.getElementById('dimensionsLabel');
const yearDisplay = document.getElementById('yearDisplay');
const tabBtns = document.querySelectorAll('.tab-btn');
const deviceBtns = document.querySelectorAll('.device-btn');

// ===================================
// Device Mode Configuration
// ===================================

const deviceModes = {
    desktop: { width: 1200, label: '1200 × AUTO' },
    tablet:  { width: 768,  label: '768 × AUTO'  },
    mobile:  { width: 375,  label: '375 × AUTO'  }
};

let currentDevice = 'desktop';

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
        previewFrame.setAttribute('data-device', device);
        dimensionsLabel.textContent = deviceModes[device].label;

        runCode();
    });
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
.runner-preview, .runner-preview *, .runner-preview *::before, .runner-preview *::after {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
}
${css}
    </style>
</head>
<body>
<div class="runner-preview">
${html}
</div>
<script>
${js}
<\/script>
</body>
</html>`.trim();

    previewFrame.srcdoc = fullHTML;
}

// Run button click handler
runBtn.addEventListener('click', runCode);

// Auto-run on page load
window.addEventListener('DOMContentLoaded', runCode);

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
