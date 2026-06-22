const fs = require('fs');
let c = fs.readFileSync('examinations.html', 'utf8');

// Find start and end markers
const SM = '// ===== RESULTS & ANALYTICS TAB =====';
const EM = '// ===== ALERTS TAB =====';
const s = c.indexOf(SM);
const e = c.indexOf(EM);
if (s === -1 || e === -1) { console.error('markers not found s='+s+' e='+e); process.exit(1); }
console.log('Replacing from', s, 'to', e);


const NEW_CODE = `// ===== RESULTS & ANALYTICS — 4-step drill-down =====
// State: types -> classes -> students -> report
var RES = { examType: null, examId: null, classId: null, studentId: null };

// Subject definitions with icons+colours (used for the per-subject marks in report)
var REPORT_SUBJECTS = [
    { name:'Mathematics',   icon:'bi-calculator-fill',  bg:'#eff6ff', col:'#2563eb' },
    { name:'English',       icon:'bi-book-fill',        bg:'#f5f3ff', col:'#7c3aed' },
    { name:'Science',       icon:'bi-lightning-fill',   bg:'#f0fdf4', col:'#16a34a' },
    { name:'History',       icon:'bi-hourglass-split',  bg:'#fff7ed', col:'#ea580c' },
    { name:'Geography',     icon:'bi-globe-americas',   bg:'#f0fdfa', col:'#0d9488' },
    { name:'Computer Sci.', icon:'bi-cpu-fill',         bg:'#fdf2f8', col:'#db2777' }
];

// ── Breadcrumb renderer ──
function renderResBreadcrumb() {
    var parts = [];
    parts.push('<button class="res-bc-btn" onclick="resGoStep(0)"><i class="bi bi-grid-3x3-gap-fill me-1"></i>Exam Types</button>');
    if (RES.examType) {
        parts.push('<span class="res-bc-sep">›</span>');
        parts.push('<button class="res-bc-btn' + (RES.classId ? '' : ' active') + '" onclick="resGoStep(1)">' + RES.examType + '</button>');
    }
    if (RES.classId) {
        var clsObj = EXAM_CLASSES.find(function(c){ return c.id === RES.classId; });
        parts.push('<span class="res-bc-sep">›</span>');
        parts.push('<button class="res-bc-btn' + (RES.studentId ? '' : ' active') + '" onclick="resGoStep(2)">' + (clsObj ? clsObj.name : RES.classId) + '</button>');
    }
    if (RES.studentId) {
        var st = findResStudent(RES.classId, RES.studentId);
        parts.push('<span class="res-bc-sep">›</span>');
        parts.push('<span class="res-bc-btn active">' + (st ? st.name : RES.studentId) + '</span>');
    }
    document.getElementById('resBreadcrumb').innerHTML = parts.join('');
}

function findResStudent(classId, studentId) {
    var list = EXAM_STUDENTS[classId] || [];
    return list.find(function(s){ return s.id === studentId; }) || null;
}

// Show a step, hide others
function resShowStep(stepName) {
    ['res-step-types','res-step-classes','res-step-students','res-step-report'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.style.display = id === stepName ? '' : 'none';
    });
    renderResBreadcrumb();
}

function resGoStep(n) {
    if (n === 0) { RES.examType = null; RES.examId = null; RES.classId = null; RES.studentId = null; renderResTypes(); }
    if (n === 1) { RES.classId = null; RES.studentId = null; renderResClasses(); }
    if (n === 2) { RES.studentId = null; renderResStudents(); }
}

// ── STEP 1: Exam Types ──
function renderResTypes() {
    var exams = loadExams();
    // Group by type
    var typeMap = {};
    exams.forEach(function(ex) {
        if (!typeMap[ex.type]) typeMap[ex.type] = { count: 0, exams: [] };
        typeMap[ex.type].count++;
        typeMap[ex.type].exams.push(ex);
    });
    var types = Object.keys(typeMap);
    var container = document.getElementById('res-step-types');
    if (!types.length) {
        container.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-inbox fs-2 d-block mb-2 opacity-50"></i>No exams scheduled yet.</div>';
    } else {
        var html = '<div class="mb-4"><h5 class="fw-bold mb-1">Results &amp; Analytics</h5>'
            + '<p class="text-muted" style="font-size:.85rem;">Select an exam type to explore class and student results.</p></div>'
            + '<div class="row g-3">';
        types.forEach(function(type) {
            var col = typeColor(type); var ic = typeIcon(type);
            var completed = typeMap[type].exams.filter(function(e){ return e.status === 'completed'; }).length;
            html += '<div class="col-6 col-md-4 col-lg-3">'
                + '<div class="res-type-card" style="--tc:' + col + ';" onclick="resSelectType(\'' + type + '\')">'
                + '<div class="res-type-icon" style="background:' + col + '18;color:' + col + ';"><i class="bi ' + ic + '"></i></div>'
                + '<div class="fw-bold" style="font-size:.92rem;margin-bottom:4px;">' + type + '</div>'
                + '<div style="font-size:.75rem;color:#94a3b8;">' + typeMap[type].count + ' exam' + (typeMap[type].count !== 1 ? 's' : '') + '</div>'
                + '<div style="font-size:.7rem;color:#16a34a;margin-top:4px;">'
                + '<i class="bi bi-check-circle me-1"></i>' + completed + ' completed</div>'
                + '</div></div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }
    resShowStep('res-step-types');
}

function resSelectType(type) {
    RES.examType = type; RES.examId = null; RES.classId = null; RES.studentId = null;
    renderResClasses();
}

`;
fs.writeFileSync('examinations.html', c.slice(0, s) + NEW_CODE, 'utf8');
console.log('Part 1 written.');
