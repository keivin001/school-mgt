const fs = require('fs');
let head = fs.readFileSync('examinations.html', 'utf8');
// Build all missing parts as one string
let rest = '';

// ── STEP 2: Classes for selected exam type ──
rest += `
function renderResClasses() {
    var exams = loadExams().filter(function(ex){ return ex.type === RES.examType; });
    var classIds = [];
    exams.forEach(function(ex){ if(classIds.indexOf(ex.classId) === -1) classIds.push(ex.classId); });
    var container = document.getElementById('res-step-classes');
    var html = '<div class="d-flex align-items-center gap-3 mb-4 flex-wrap">'
        + '<button class="res-bc-btn" onclick="resGoStep(0)"><i class="bi bi-arrow-left me-1"></i>Back</button>'
        + '<div><h5 class="fw-bold mb-0">' + RES.examType + '</h5>'
        + '<small class="text-muted">Select a class to view results</small></div></div>'
        + '<div class="row g-3">';
    classIds.forEach(function(cid) {
        var clsObj = EXAM_CLASSES.find(function(c){ return c.id === cid; }) || {name: cid, teacher: '—'};
        var clsExams = exams.filter(function(ex){ return ex.classId === cid; });
        var col = typeColor(RES.examType);
        var totalStudents = (EXAM_STUDENTS[cid] || []).length;
        var completedExams = clsExams.filter(function(e){ return e.status === 'completed'; }).length;
        // Compute avg pass rate across completed exams
        var totalPassed = 0, totalStu = 0;
        clsExams.forEach(function(ex) {
            var stuList = EXAM_STUDENTS[ex.classId] || [];
            var marks = loadMarks(ex.id);
            stuList.forEach(function(st) {
                var m = marks[st.id] || genDefaultMarks(ex)[st.id];
                totalStu++;
                if (m && m.marks >= ex.passMarks) totalPassed++;
            });
        });
        var avgPass = totalStu ? Math.round(totalPassed / totalStu * 100) : 0;
        var passColor = avgPass >= 80 ? '#16a34a' : avgPass >= 60 ? '#ea580c' : '#dc2626';
        html += '<div class="col-sm-6 col-md-4 col-lg-3">'
            + '<div class="res-class-card" onclick="resSelectClass(\'' + cid + '\')">'
            + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
            + '<div style="width:42px;height:42px;border-radius:12px;background:' + col + '18;color:' + col + ';display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">'
            + '<i class="bi bi-door-open-fill"></i></div>'
            + '<div style="flex:1;min-width:0;">'
            + '<div class="fw-bold" style="font-size:.88rem;">' + clsObj.name + '</div>'
            + '<div style="font-size:.72rem;color:#94a3b8;">' + clsObj.teacher + '</div>'
            + '</div></div>'
            + '<div style="display:flex;gap:8px;margin-bottom:10px;">'
            + '<div style="flex:1;background:#f8fafc;border-radius:9px;padding:7px;text-align:center;">'
            + '<div class="fw-bold" style="font-size:.88rem;color:#2563eb;">' + totalStudents + '</div>'
            + '<div style="font-size:.6rem;color:#94a3b8;text-transform:uppercase;">Students</div></div>'
            + '<div style="flex:1;background:#f8fafc;border-radius:9px;padding:7px;text-align:center;">'
            + '<div class="fw-bold" style="font-size:.88rem;color:#7c3aed;">' + clsExams.length + '</div>'
            + '<div style="font-size:.6rem;color:#94a3b8;text-transform:uppercase;">Exams</div></div>'
            + '<div style="flex:1;background:#f8fafc;border-radius:9px;padding:7px;text-align:center;">'
            + '<div class="fw-bold" style="font-size:.88rem;color:' + passColor + ';">' + avgPass + '%</div>'
            + '<div style="font-size:.6rem;color:#94a3b8;text-transform:uppercase;">Pass</div></div>'
            + '</div>'
            + '<div style="height:6px;border-radius:99px;background:#e2e8f0;overflow:hidden;">'
            + '<div style="height:100%;width:' + avgPass + '%;background:' + passColor + ';border-radius:99px;"></div></div>'
            + '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
    resShowStep('res-step-classes');
}
function resSelectClass(classId) {
    RES.classId = classId; RES.studentId = null;
    // Pick the exam for this class+type (latest or first completed)
    var exams = loadExams().filter(function(ex){ return ex.type === RES.examType && ex.classId === classId; });
    var completed = exams.filter(function(e){ return e.status === 'completed'; });
    var chosen = completed.length ? completed[completed.length - 1] : exams[0];
    RES.examId = chosen ? chosen.id : null;
    renderResStudents();
}
`;

// ── STEP 3: Students ──
rest += `
function renderResStudents() {
    var exam = RES.examId ? loadExams().find(function(e){ return e.id === RES.examId; }) : null;
    var students = EXAM_STUDENTS[RES.classId] || [];
    var marks = exam ? loadMarks(exam.id) : {};
    if (exam && !Object.keys(marks).length) marks = genDefaultMarks(exam);
    var container = document.getElementById('res-step-students');
    var clsObj = EXAM_CLASSES.find(function(c){ return c.id === RES.classId; }) || {name: RES.classId};
    // Compute stats
    var total = students.length, passed = 0, sum = 0, topScore = 0;
    var rows = students.map(function(st) {
        var m = marks[st.id] || { marks: 0, grade: 'F', remarks: '' };
        var score = m.marks || 0;
        sum += score;
        if (exam && score >= exam.passMarks) passed++;
        if (score > topScore) topScore = score;
        var grade = exam ? calcGrade(score, exam.maxMarks) : m.grade || 'F';
        var pct = exam ? Math.round(score / exam.maxMarks * 100) : 0;
        return { st: st, score: score, grade: grade, pct: pct, pass: exam ? score >= exam.passMarks : false };
    }).sort(function(a, b){ return b.score - a.score; });
    var avg = total ? Math.round(sum / total) : 0;
    var passRate = total ? Math.round(passed / total * 100) : 0;
    var prColor = passRate >= 80 ? '#16a34a' : passRate >= 60 ? '#ea580c' : '#dc2626';
    // Banners
    var html = '<div class="d-flex align-items-center gap-3 mb-3 flex-wrap">'
        + '<button class="res-bc-btn" onclick="resGoStep(1)"><i class="bi bi-arrow-left me-1"></i>Back</button>'
        + '<div><h5 class="fw-bold mb-0">' + clsObj.name + (exam ? ' — ' + exam.name : '') + '</h5>'
        + '<small class="text-muted">' + (exam ? exam.subject + ' · ' + exam.date : 'No exam data') + '</small></div>'
        + '<div class="ms-auto d-flex gap-2">'
        + (exam ? '<a href="exam-marks.html?exam=' + exam.id + '" class="btn btn-sm btn-outline-primary rounded-pill"><i class="bi bi-pencil me-1"></i>Edit Marks</a>' : '')
        + '</div></div>'
        // KPI strip
        + '<div class="d-flex gap-3 flex-wrap mb-4 p-3 rounded-3" style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;">'
        + _kpiPillWhite(total, 'Students')
        + _kpiPillWhite(passed, 'Passed')
        + _kpiPillWhite(total - passed, 'Failed')
        + _kpiPillWhite(passRate + '%', 'Pass Rate')
        + _kpiPillWhite(avg + (exam ? '/' + exam.maxMarks : ''), 'Class Avg')
        + _kpiPillWhite(topScore, 'Top Score')
        + '</div>'
        // Cards grid
        + '<div class="row g-3">';
    var banners = ['linear-gradient(135deg,#2563eb,#7c3aed)','linear-gradient(135deg,#0d9488,#2563eb)','linear-gradient(135deg,#ea580c,#f59e0b)','linear-gradient(135deg,#db2777,#7c3aed)','linear-gradient(135deg,#16a34a,#0d9488)','linear-gradient(135deg,#7c3aed,#2563eb)'];
    rows.forEach(function(row, i) {
        var gc = gradeColor(row.grade); var gcBg = gradeBg(row.grade);
        var banner = banners[i % banners.length];
        html += '<div class="col-6 col-md-4 col-lg-3">'
            + '<div class="res-student-card" onclick="resSelectStudent(\'' + row.st.id + '\')">'
            + '<div class="res-student-banner" style="background:' + banner + ';">'
            + '<div style="position:absolute;top:8px;left:10px;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.22);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.6rem;font-weight:800;">' + (i+1) + '</div>'
            + '<div class="res-student-avatar-wrap"><img src="' + row.st.photo + '" class="res-student-avatar" onerror="this.src=\'https://i.pravatar.cc/60?u=' + row.st.id + '\'"></div>'
            + '</div>'
            + '<div class="res-student-body">'
            + '<div class="fw-bold" style="font-size:.85rem;">' + row.st.name + '</div>'
            + '<div style="font-size:.68rem;color:#94a3b8;margin-bottom:8px;">ID: ' + row.st.id + '</div>'
            + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">'
            + '<span class="grade-chip ' + gradeClass(row.grade) + '">' + row.grade + '</span>'
            + '<span style="font-size:.72rem;font-weight:700;color:' + gc + ';">' + row.pct + '%</span>'
            + '</div>'
            + '<div style="width:100%;height:5px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-bottom:8px;">'
            + '<div style="height:100%;width:' + row.pct + '%;background:' + gc + ';border-radius:99px;"></div></div>'
            + '<div style="font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:999px;background:' + (row.pass ? '#f0fdf4' : '#fef2f2') + ';color:' + (row.pass ? '#16a34a' : '#dc2626') + ';">'
            + (row.pass ? '✓ Pass' : '✗ Fail') + '</div>'
            + '</div></div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
    resShowStep('res-step-students');
}
function _kpiPillWhite(val, lbl) {
    return '<div style="flex:1;min-width:72px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:10px;text-align:center;backdrop-filter:blur(8px);">'
        + '<div style="font-size:1.1rem;font-weight:800;line-height:1;">' + val + '</div>'
        + '<div style="font-size:.6rem;opacity:.75;text-transform:uppercase;letter-spacing:.06em;margin-top:3px;">' + lbl + '</div>'
        + '</div>';
}
function resSelectStudent(studentId) {
    RES.studentId = studentId;
    renderResReport();
}
`;

// ── STEP 4: Full Report Card ──
rest += `
function gradeClass(g){var m={'A+':'grade-aplus','A':'grade-a','B+':'grade-bplus','B':'grade-b','C+':'grade-cplus','C':'grade-c','F':'grade-f'};return m[g]||'grade-f';}
function gradeColor(g){var m={'A+':'#15803d','A':'#1e40af','B+':'#7e22ce','B':'#c2410c','C+':'#a16207','C':'#dc2626','F':'#7f1d1d'};return m[g]||'#1e293b';}
function gradeBg(g){var m={'A+':'#dcfce7','A':'#dbeafe','B+':'#f3e8ff','B':'#ffedd5','C+':'#fef9c3','C':'#fee2e2','F':'#fecaca'};return m[g]||'#f1f5f9';}

function renderResReport() {
    var exam = RES.examId ? loadExams().find(function(e){ return e.id === RES.examId; }) : null;
    if (!exam) return;
    var student = findResStudent(RES.classId, RES.studentId);
    if (!student) return;
    var marks = loadMarks(exam.id);
    if (!Object.keys(marks).length) marks = genDefaultMarks(exam);
    var sm = marks[student.id] || { marks: 0, grade: 'F', remarks: '' };
    var score = sm.marks || 0;
    var grade = calcGrade(score, exam.maxMarks);
    var pct = Math.round(score / exam.maxMarks * 100);
    var pass = score >= exam.passMarks;
    var gc = gradeColor(grade);
    var gcBg = gradeBg(grade);
    // Class rank
    var students = EXAM_STUDENTS[RES.classId] || [];
    var ranked = students.map(function(st){ var m2=marks[st.id]||{marks:0}; return {id:st.id,s:m2.marks||0}; }).sort(function(a,b){return b.s-a.s;});
    var rank = ranked.findIndex(function(r){return r.id===student.id;}) + 1;
    var classAvg = ranked.length ? Math.round(ranked.reduce(function(a,r){return a+r.s;},0)/ranked.length) : 0;
    // Per-subject marks (deterministic from student+exam seed)
    var subjects = REPORT_SUBJECTS;
    var subjMarks = subjects.map(function(sub, i){
        var base = score;
        var offset = ((student.id.charCodeAt(student.id.length-1)*7 + i*11) % 20) - 10;
        var sm2 = Math.min(exam.maxMarks, Math.max(Math.round(exam.passMarks*0.3), base + offset));
        var pct2 = Math.round(sm2/exam.maxMarks*100);
        var g = calcGrade(sm2, exam.maxMarks);
        return { name: sub.name, icon: sub.icon, bg: sub.bg, col: sub.col, score: sm2, max: exam.maxMarks, pct: pct2, grade: g };
    });
    // Recalculate total from subject marks
    var totalScore = subjMarks.reduce(function(a,s){ return a+s.score; }, 0);
    var totalMax   = exam.maxMarks * subjects.length;
    var totalPct   = Math.round(totalScore / totalMax * 100);
    var totalGrade = calcGrade(totalScore, totalMax);
    var container = document.getElementById('res-step-report');
    var nowStr = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
    var examDate = exam.date ? new Date(exam.date+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : exam.date;
    var html = '<div class="d-flex align-items-center gap-3 mb-4 flex-wrap">'
        + '<button class="res-bc-btn" onclick="resGoStep(2)"><i class="bi bi-arrow-left me-1"></i>Back to Students</button>'
        + '<div class="ms-auto d-flex gap-2">'
        + '<button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print</button>'
        + '</div></div>'
        // ── REPORT CARD ──
        + '<div class="report-card-premium" id="rcPremium">'
        // Banner
        + '<div class="rcp-banner">'
        + '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;position:relative;z-index:1;">'
        + '<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">'
        + '<img src="https://img.icons8.com/color/96/graduation-cap.png" style="width:26px;"></div>'
        + '<div><div style="font-size:1rem;font-weight:800;">Bright Future School</div>'
        + '<div style="font-size:.7rem;opacity:.7;">Official Examination Result Card &nbsp;&bull;&nbsp; Academic Year 2025–2026</div></div></div>'
        + '<div style="position:relative;z-index:1;">'
        + '<div style="font-size:1.25rem;font-weight:800;opacity:.9;margin-bottom:3px;">' + exam.name + ' — ' + exam.type + '</div>'
        + '<div style="font-size:.8rem;opacity:.7;">' + exam.className + ' &nbsp;&bull;&nbsp; ' + exam.subject + ' &nbsp;&bull;&nbsp; ' + examDate + ' at ' + exam.time + '</div>'
        + '</div></div>'
        // Avatar strip
        + '<div class="rcp-avatar-strip">'
        + '<img src="' + student.photo + '" class="rcp-avatar" onerror="this.src=\'https://i.pravatar.cc/150?u=' + student.id + '\'">'
        + '<div style="flex:1;padding-bottom:10px;">'
        + '<div style="font-size:1.3rem;font-weight:900;color:#0f172a;line-height:1.2;">' + student.name + '</div>'
        + '<div style="font-size:.8rem;color:#64748b;margin-top:3px;">Roll No: ' + student.roll + ' &nbsp;&bull;&nbsp; ' + exam.className + '</div>'
        + '<div style="margin-top:8px;"><span class="pass-status-badge ' + (pass?'pass-badge':'fail-badge') + '">'
        + (pass ? '<i class="bi bi-patch-check-fill me-2"></i>PASSED' : '<i class="bi bi-x-circle-fill me-2"></i>FAILED')
        + '</span></div></div>'
        + '<div style="padding-bottom:10px;text-align:center;">'
        + '<div class="rcp-grade-pill" style="background:' + gcBg + ';color:' + gc + ';border:3px solid ' + gc + '40;">' + totalGrade + '</div>'
        + '<div style="font-size:.62rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:3px;">Overall</div>'
        + '</div></div>'
        // Body
        + '<div class="rcp-body">'
        // Score strip
        + '<div class="rcp-score-grid">'
        + _rcpBox(totalScore+'/'+totalMax, 'Total Marks', gc)
        + _rcpBox(totalPct+'%', 'Percentage', totalPct>=75?'#16a34a':totalPct>=45?'#f59e0b':'#ef4444')
        + _rcpBox('#'+rank+' / '+ranked.length, 'Class Rank', '#f59e0b')
        + _rcpBox(classAvg+'/'+exam.maxMarks, 'Class Avg', '#7c3aed')
        + '</div>'
        // Info grids
        + '<div class="row g-3 mb-5">'
        + '<div class="col-lg-6"><div style="font-size:.67rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:8px;">Student Information</div>'
        + '<div class="rcp-info-grid">'
        + _rcpCell('Full Name', student.name)
        + _rcpCell('Student ID', student.id)
        + _rcpCell('Roll Number', student.roll)
        + _rcpCell('Class', exam.className)
        + _rcpCell('Section', student.roll <= '03' ? 'A' : 'B')
        + _rcpCell('Academic Year', '2025–2026')
        + '</div></div>'
        + '<div class="col-lg-6"><div style="font-size:.67rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:8px;">Examination Details</div>'
        + '<div class="rcp-info-grid">'
        + _rcpCell('Exam Name', exam.name)
        + _rcpCell('Exam Type', exam.type)
        + _rcpCell('Subject', exam.subject)
        + _rcpCell('Date & Time', examDate + ' ' + exam.time)
        + _rcpCell('Venue', exam.room)
        + _rcpCell('Invigilator', exam.invigilator)
        + '</div></div></div>'
        // Subject marks table
        + '<div style="font-size:.67rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:10px;">Subject-wise Performance</div>';
    subjMarks.forEach(function(s2) {
        html += '<div class="rcp-subject-row">'
            + '<div class="rcp-subj-icon" style="background:' + s2.bg + ';color:' + s2.col + ';"><i class="bi ' + s2.icon + '"></i></div>'
            + '<div style="flex:2;min-width:0;">'
            + '<div style="font-weight:700;font-size:.84rem;">' + s2.name + '</div>'
            + '<div style="font-size:.7rem;color:#94a3b8;">' + s2.score + ' / ' + s2.max + ' marks</div>'
            + '</div>'
            + '<div style="flex:1;min-width:90px;">'
            + '<div style="height:6px;border-radius:99px;background:#e2e8f0;overflow:hidden;">'
            + '<div style="height:100%;width:' + s2.pct + '%;background:' + gradeColor(s2.grade) + ';border-radius:99px;"></div></div>'
            + '</div>'
            + '<div style="min-width:32px;text-align:right;font-size:.78rem;font-weight:800;color:' + gradeColor(s2.grade) + ';">' + s2.pct + '%</div>'
            + '<span class="grade-chip ' + gradeClass(s2.grade) + '">' + s2.grade + '</span>'
            + '</div>';
    });
    // Total bar
    html += '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:1.5px solid #bfdbfe;margin-top:10px;margin-bottom:24px;">'
        + '<div style="font-weight:800;font-size:.88rem;flex:1;">Grand Total</div>'
        + '<div style="font-size:.88rem;font-weight:800;color:#2563eb;">' + totalScore + ' / ' + totalMax + '</div>'
        + '<div style="min-width:80px;"><div style="height:7px;border-radius:99px;background:#dbeafe;overflow:hidden;">'
        + '<div style="height:100%;width:' + totalPct + '%;background:' + gradeColor(totalGrade) + ';border-radius:99px;"></div></div></div>'
        + '<div style="font-size:.88rem;font-weight:800;color:' + gradeColor(totalGrade) + ';">' + totalPct + '%</div>'
        + '<span class="grade-chip ' + gradeClass(totalGrade) + '">' + totalGrade + '</span>'
        + '</div>'
        // Remarks
        + (sm.remarks && sm.remarks !== 'Auto-generated' ? '<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:.82rem;color:#475569;"><strong>Teacher\'s Remarks:</strong> ' + sm.remarks + '</div>' : '')
        // Result declaration
        + '<div style="display:flex;align-items:center;justify-content:center;padding:20px;border-radius:16px;background:' + (pass?'linear-gradient(135deg,#f0fdf4,#dcfce7)':'linear-gradient(135deg,#fef2f2,#fee2e2)') + ';border:2px solid ' + (pass?'#86efac':'#fca5a5') + ';margin-bottom:24px;">'
        + '<div style="text-align:center;">'
        + '<div style="font-size:1.5rem;font-weight:900;color:' + (pass?'#15803d':'#b91c1c') + ';">' + (pass ? 'RESULT: PASS' : 'RESULT: FAIL') + '</div>'
        + '<div style="font-size:.82rem;color:' + (pass?'#16a34a':'#dc2626') + ';margin-top:4px;">'
        + (pass ? 'Congratulations! The student has successfully passed the examination.' : 'The student did not meet the minimum passing criteria of ' + exam.passMarks + ' marks.')
        + '</div></div></div>'
        + '</div>'
        // Footer
        + '<div class="rcp-footer">'
        + '<div style="font-size:.72rem;color:#94a3b8;"><div>Generated: ' + nowStr + '</div><div>Bright Future School Management System</div></div>'
        + '<div style="text-align:center;"><div class="rcp-seal"><i class="bi bi-patch-check-fill" style="color:#2563eb;"></i></div><div style="font-size:.6rem;color:#94a3b8;margin-top:4px;">Official Seal</div></div>'
        + '<div style="text-align:right;font-size:.72rem;color:#94a3b8;"><div>Exam: ' + exam.id + '</div><div>Student: ' + student.id + '</div></div>'
        + '</div></div>';
    container.innerHTML = html;
    resShowStep('res-step-report');
}
function _rcpBox(val, lbl, color) {
    return '<div class="rcp-score-box" style="border-color:' + color + '22;">'
        + '<div class="rsv" style="color:' + color + ';">' + val + '</div>'
        + '<div class="rsl">' + lbl + '</div></div>';
}
function _rcpCell(lbl, val) {
    return '<div class="rcp-cell"><div class="rl">' + lbl + '</div><div class="rv">' + val + '</div></div>';
}
function pass_status_badge(p){return p?'pass-badge':'fail-badge';}

// Entry point for Results tab
function renderResultsGrid() {
    renderResTypes();
}
`;

// ── Alerts + boot + closing HTML ──
rest += `
// ===== ALERTS TAB =====
function renderAlerts(){
    var exams=loadExams();
    var today=new Date();
    var failMap={};
    exams.forEach(function(ex){
        var marks=loadMarks(ex.id);
        var students=EXAM_STUDENTS[ex.classId]||[];
        students.forEach(function(st){
            var m=marks[st.id];
            if(m&&m.marks!==null&&m.marks<ex.passMarks){
                if(!failMap[st.id])failMap[st.id]={st:st,count:0};
                failMap[st.id].count++;
            }
        });
    });
    var atRisk=Object.values(failMap).filter(function(v){return v.count>=2;});
    var atHtml='';
    atRisk.forEach(function(v){
        atHtml+='<div class="alert-card-risk"><img src="'+v.st.photo+'" style="width:40px;height:40px;border-radius:50%;border:2px solid #fca5a5;">'
            +'<div><div class="fw-semibold">'+v.st.name+'</div><div style="font-size:.75rem;color:#dc2626;"><i class="bi bi-exclamation-circle me-1"></i>Failed '+v.count+' exam(s)</div></div>'
            +'<div class="ms-auto"><span class="badge-cancelled">At Risk</span></div></div>';
    });
    document.getElementById('atRiskList').innerHTML=atHtml||'<div class="text-muted text-center py-3"><i class="bi bi-check-circle-fill text-success d-block fs-3 mb-1"></i>No at-risk students.</div>';
    var decHtml='';
    [{name:'Ethan Moore',photo:'https://i.pravatar.cc/150?img=18',delta:'-12 pts vs last exam'},{name:'Ravi Kumar',photo:'https://i.pravatar.cc/150?img=14',delta:'-8 pts vs last exam'}].forEach(function(d){
        decHtml+='<div class="alert-card-warning"><img src="'+d.photo+'" style="width:40px;height:40px;border-radius:50%;border:2px solid #fed7aa;">'
            +'<div><div class="fw-semibold">'+d.name+'</div><div style="font-size:.75rem;color:#c2410c;"><i class="bi bi-graph-down me-1"></i>'+d.delta+'</div></div>'
            +'<div class="ms-auto"><span style="background:#fff7ed;color:#c2410c;border-radius:20px;padding:3px 10px;font-size:.72rem;font-weight:700;">Declining</span></div></div>';
    });
    document.getElementById('decliningList').innerHTML=decHtml;
    var remHtml='';
    exams.filter(function(ex){if(ex.status!=='upcoming')return false;var diff=(new Date(ex.date)-today)/(1000*60*60*24);return diff>=0&&diff<=7;}).forEach(function(ex){
        var diff=Math.ceil((new Date(ex.date)-today)/(1000*60*60*24));
        remHtml+='<div class="alert-card-info"><div class="activity-dot" style="background:#dbeafe;color:#2563eb;"><i class="bi bi-calendar-event-fill"></i></div>'
            +'<div><div class="fw-semibold">'+ex.name+'</div><div style="font-size:.75rem;color:#1d4ed8;">'+ex.className+' · '+ex.subject+' · '+ex.date+'</div></div>'
            +'<div class="ms-auto"><span class="badge-upcoming">'+diff+'d</span></div></div>';
    });
    document.getElementById('reminderList').innerHTML=remHtml||'<div class="text-muted text-center py-3"><i class="bi bi-calendar-check text-primary d-block fs-3 mb-1"></i>No upcoming exams in 7 days.</div>';
    var naHtml='';
    exams.filter(function(e){return e.status==='completed';}).forEach(function(ex){
        var marks=loadMarks(ex.id);
        (EXAM_STUDENTS[ex.classId]||[]).forEach(function(st){
            if(!marks[st.id]||marks[st.id].marks===null){
                naHtml+='<div class="alert-card-risk" style="border-color:#e2e8f0;background:#f8fafc;">'
                    +'<img src="'+st.photo+'" style="width:40px;height:40px;border-radius:50%;border:2px solid #e2e8f0;">'
                    +'<div><div class="fw-semibold">'+st.name+'</div><div style="font-size:.75rem;color:#64748b;">'+ex.name+' · '+ex.className+'</div></div>'
                    +'<div class="ms-auto"><span class="badge-completed">Not Marked</span></div></div>';
            }
        });
    });
    document.getElementById('notAppearedList').innerHTML=naHtml||'<div class="text-muted text-center py-3"><i class="bi bi-person-check-fill text-success d-block fs-3 mb-1"></i>All students marked.</div>';
}
// ===== TAB SWITCHING =====
document.getElementById('examTabNav').addEventListener('click',function(e){
    var btn=e.target.closest('.att-tab-btn');if(!btn)return;
    document.querySelectorAll('.att-tab-btn').forEach(function(b){b.classList.remove('active');});
    document.querySelectorAll('.att-tab-panel').forEach(function(p){p.classList.remove('active');});
    btn.classList.add('active');
    var tab=btn.dataset.tab;
    document.getElementById('tab-'+tab).classList.add('active');
    if(tab==='overview'){setTimeout(renderOverviewCharts,50);}
    if(tab==='schedule')renderScheduleTable();
    if(tab==='results'){RES.examType=null;RES.examId=null;RES.classId=null;RES.studentId=null;renderResultsGrid();}
    if(tab==='alerts')renderAlerts();
});
// ===== INIT =====
renderHeroKpis();
populateMarksSelectors();
populateMarksExams();
setTimeout(renderOverviewCharts,100);
    </script>
</body>
</html>`;

// Write complete file
fs.writeFileSync('examinations.html', head + rest, 'utf8');
console.log('Complete. Total length:', (head + rest).length);
