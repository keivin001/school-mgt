const fs = require('fs');
let c = fs.readFileSync('attendance.html', 'utf8');
const sm = '    function buildTeacherComplianceCharts() {';
const em = '\n    function _kpiPill(';
const s  = c.indexOf(sm);
const e  = c.indexOf(em, s);
if (s === -1 || e === -1) { console.error('markers not found'); process.exit(1); }

const newFn = `    function buildTeacherComplianceCharts() {
        var statuses = getTeacherStatuses();
        var sub   = statuses.filter(function(t){ return t.status === 'submitted'; }).length;
        var late  = statuses.filter(function(t){ return t.status === 'late'; }).length;
        var miss  = statuses.filter(function(t){ return t.status === 'missing'; }).length;
        var total = statuses.length;
        var pct   = total ? Math.round(((sub + late) / total) * 100) : 0;

        // Centre label
        var cpEl = document.getElementById('tcCompPct');
        if (cpEl) { cpEl.textContent = pct + '%'; cpEl.style.color = pct>=80?'#16a34a':pct>=50?'#ea580c':'#dc2626'; }

        // 1. TODAY Doughnut with readable tooltips
        var ctx1 = document.getElementById('chartTeacherComp');
        if (ctx1) {
            if (ctx1._chartInstance) ctx1._chartInstance.destroy();
            ctx1._chartInstance = new Chart(ctx1, {
                type: 'doughnut',
                data: { labels:['On Time','Late','Missing'],
                    datasets:[{ data:[sub,late,miss], backgroundColor:['#22c55e','#f59e0b','#ef4444'], borderWidth:3, borderColor:'#fff', hoverOffset:8 }] },
                options: { responsive:true, maintainAspectRatio:true, cutout:'68%',
                    plugins: { legend:{display:false},
                        tooltip:{ callbacks:{
                            label:function(c){ var v=c.parsed, p=total?Math.round((v/total)*100):0; return ' '+c.label+': '+v+' teacher'+(v!==1?'s':'')+' ('+p+'%)'; },
                            afterLabel:function(c){ var m={'On Time':'Submitted before 9:30 AM deadline','Late':'Submitted after 9:30 AM deadline','Missing':'No submission recorded today'}; return m[c.label]||''; }
                        }}
                    }
                }
            });
        }

        // Legend with counts + % + description
        var leg = document.getElementById('tcChartLegend');
        if (leg) {
            var items = [
                {color:'#22c55e',label:'Submitted on time',val:sub, desc:'Before 9:30 AM deadline'},
                {color:'#f59e0b',label:'Submitted late',   val:late,desc:'After 9:30 AM deadline'},
                {color:'#ef4444',label:'Not submitted',    val:miss,desc:'No attendance record yet'}
            ];
            leg.innerHTML = items.map(function(l){
                var p = total ? Math.round((l.val/total)*100) : 0;
                return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border-color,#f1f5f9);">'
                    +'<span style="width:10px;height:10px;border-radius:50%;background:'+l.color+';flex-shrink:0;display:inline-block;"></span>'
                    +'<div style="flex:1;min-width:0;"><div style="font-size:.78rem;font-weight:700;color:var(--text-primary,#0f172a);">'+l.label+'</div>'
                    +'<div style="font-size:.68rem;color:#94a3b8;">'+l.desc+'</div></div>'
                    +'<div style="text-align:right;flex-shrink:0;">'
                    +'<span style="font-size:.9rem;font-weight:800;color:'+l.color+';">'+l.val+'</span>'
                    +'<span style="font-size:.7rem;color:#94a3b8;"> / '+total+'</span>'
                    +'<div style="font-size:.68rem;font-weight:700;color:'+l.color+';">'+p+'%</div>'
                    +'</div></div>';
            }).join('');
        }

        // 2. Weekly bar chart with readable Y axis labels
        var onTimeArr = [0,1,2,3,4].map(function(di){ return TEACHERS.filter(function(t){ return (t.weekHistory||[])[di]===1; }).length; });
        var lateArr   = [0,1,2,3,4].map(function(di){ return di%2===0?1:0; });
        var missArr   = onTimeArr.map(function(v,i){ return Math.max(0,total-v-lateArr[i]); });
        var ctx2 = document.getElementById('chartTeacherWeek');
        if (ctx2) {
            if (ctx2._chartInstance) ctx2._chartInstance.destroy();
            ctx2._chartInstance = new Chart(ctx2, {
                type:'bar',
                data:{ labels:['Mon','Tue','Wed','Thu','Fri'],
                    datasets:[
                        {label:'On Time',data:onTimeArr,backgroundColor:'#22c55ecc',borderRadius:5},
                        {label:'Late',   data:lateArr,  backgroundColor:'#f59e0bcc',borderRadius:5},
                        {label:'Missing',data:missArr,  backgroundColor:'#ef4444cc',borderRadius:5}
                    ]
                },
                options:{ responsive:true, maintainAspectRatio:true,
                    plugins:{ legend:{position:'bottom',labels:{boxWidth:10,font:{size:10},color:textColor()}},
                        tooltip:{callbacks:{
                            title:function(i){ return 'Week — '+i[0].label; },
                            label:function(c){ var v=c.parsed.y, p=total?Math.round((v/total)*100):0; return ' '+c.dataset.label+': '+v+' teacher'+(v!==1?'s':'')+' ('+p+'%)'; }
                        }}
                    },
                    scales:{
                        x:{stacked:true,grid:{display:false},ticks:{color:textColor(),font:{size:10}}},
                        y:{stacked:true,max:total+1,grid:{color:gridColor()},
                            ticks:{color:textColor(),font:{size:10},stepSize:1,callback:function(v){ return v+'/'+total; }}}
                    }
                }
            });
        }

        // Summary pills below weekly chart
        var wkSumEl = document.getElementById('tcWeekSummary');
        if (wkSumEl) {
            var bestIdx  = onTimeArr.indexOf(Math.max.apply(null,onTimeArr));
            var worstIdx = missArr.indexOf(Math.max.apply(null,missArr));
            var fullDays = onTimeArr.filter(function(v,i){ return v+lateArr[i]>=total; }).length;
            var dn = ['Mon','Tue','Wed','Thu','Fri'];
            wkSumEl.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">'
                +_kpiPill('Best Day',dn[bestIdx],'#16a34a','#f0fdf4')
                +_kpiPill('Most Missed',dn[worstIdx],'#dc2626','#fef2f2')
                +_kpiPill('Full Days',fullDays+' / 5','#2563eb','#eff6ff')
                +'</div>';
        }

        // 3. Weekly Compliance Score — per-day bars with numbers
        var wsEl = document.getElementById('tcWeekScore');
        if (wsEl) {
            var weekPcts   = [0,1,2,3,4].map(function(di){ var on=TEACHERS.filter(function(t){ return (t.weekHistory||[])[di]===1; }).length; return total?Math.round((on/total)*100):0; });
            var weekCounts = [0,1,2,3,4].map(function(di){ return TEACHERS.filter(function(t){ return (t.weekHistory||[])[di]===1; }).length; });
            var avgWeek    = Math.round(weekPcts.reduce(function(a,b){ return a+b; },0)/weekPcts.length);
            var sc         = avgWeek>=80?'#16a34a':avgWeek>=60?'#ea580c':'#dc2626';
            var grade      = avgWeek>=90?'Excellent':avgWeek>=75?'Good':avgWeek>=60?'Average':'Poor';
            var dn2        = ['Mon','Tue','Wed','Thu','Fri'];
            wsEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
                +'<div><div style="font-size:.82rem;font-weight:700;color:var(--text-primary,#0f172a);">Weekly Average</div>'
                +'<div style="font-size:.68rem;color:#94a3b8;">'+total+' teachers \u00d7 5 days</div></div>'
                +'<div style="text-align:right;">'
                +'<div style="font-size:1.5rem;font-weight:900;color:'+sc+';line-height:1;">'+avgWeek+'%</div>'
                +'<span style="background:'+sc+'18;color:'+sc+';border-radius:999px;padding:2px 8px;font-size:.65rem;font-weight:700;">'+grade+'</span>'
                +'</div></div>'
                +'<div style="height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-bottom:14px;">'
                +'<div style="height:100%;width:'+avgWeek+'%;background:'+sc+';border-radius:99px;transition:width .6s;"></div></div>'
                +dn2.map(function(day,i){
                    var p=weekPcts[i],cnt=weekCounts[i],cl=p>=80?'#16a34a':p>=60?'#ea580c':'#dc2626';
                    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
                        +'<span style="min-width:30px;font-size:.76rem;font-weight:600;color:#94a3b8;">'+day+'</span>'
                        +'<div style="flex:1;height:7px;border-radius:99px;background:#e2e8f0;overflow:hidden;">'
                        +'<div style="height:100%;width:'+p+'%;background:'+cl+';border-radius:99px;transition:width .6s;"></div></div>'
                        +'<span style="min-width:32px;font-size:.75rem;font-weight:800;color:'+cl+';text-align:right;">'+p+'%</span>'
                        +'<span style="min-width:36px;font-size:.68rem;color:#94a3b8;text-align:right;">'+cnt+'/'+total+'</span>'
                        +'</div>';
                }).join('')
                +'<div style="margin-top:10px;padding:9px 11px;background:var(--bg-secondary,#f8fafc);border-radius:10px;font-size:.72rem;color:var(--text-muted,#64748b);">'
                +'<i class="bi bi-lightbulb-fill me-1" style="color:#f59e0b;"></i>'
                +(avgWeek>=80?'Great week! Most teachers are consistently submitting on time.':avgWeek>=60?'A few teachers are missing submissions. Consider sending reminders.':'Compliance is low this week. Immediate action recommended.')
                +'</div>';
        }

        // Leaderboard with mini progress bars
        var lbEl = document.getElementById('tcLeaderboard');
        if (lbEl) {
            var statuses2 = getTeacherStatuses();
            var maxPts    = 3 + 5*2;
            var scored    = TEACHERS.map(function(t){
                var st=statuses2.find(function(x){ return x.id===t.id; });
                var td=st?(st.status==='submitted'?3:st.status==='late'?1:0):0;
                var wk=(t.weekHistory||[]).reduce(function(a,v){ return a+(v?2:0); },0);
                return Object.assign({},t,{score:td+wk,todayStatus:st?st.status:'missing'});
            }).sort(function(a,b){ return b.score-a.score; });
            lbEl.innerHTML = scored.map(function(t,i){
                var medal   = i===0?'\uD83E\uDD47':i===1?'\uD83E\uDD48':i===2?'\uD83E\uDD49':(i+1)+'.';
                var stColor = t.todayStatus==='submitted'?'#16a34a':t.todayStatus==='late'?'#ea580c':'#dc2626';
                var stText  = t.todayStatus==='submitted'?'\u2713 Today':t.todayStatus==='late'?'\u26A0 Late':'\u2717 Missing';
                var barPct  = Math.round((t.score/maxPts)*100);
                return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-color,#f1f5f9);">'
                    +'<span style="min-width:22px;font-size:.85rem;">'+medal+'</span>'
                    +'<img src="'+t.photo+'" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="" onerror="this.src=\'https://i.pravatar.cc/60?u='+t.id+'\'">'
                    +'<div style="flex:1;min-width:0;">'
                    +'<div style="font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-primary,#0f172a);">'+t.name+'</div>'
                    +'<div style="height:4px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-top:3px;">'
                    +'<div style="height:100%;width:'+barPct+'%;background:'+stColor+';border-radius:99px;"></div></div>'
                    +'</div>'
                    +'<div style="text-align:right;flex-shrink:0;">'
                    +'<span style="font-size:.72rem;font-weight:700;color:'+stColor+';">'+stText+'</span>'
                    +'<div style="font-size:.65rem;color:#94a3b8;">'+t.score+' pts</div>'
                    +'</div></div>';
            }).join('');
        }
    }

    function _kpiPill(label, val, color, bg) {
        return '<div style="background:'+bg+';border-radius:10px;padding:6px 12px;display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:72px;">'
            +'<span style="font-size:.92rem;font-weight:800;color:'+color+';">'+val+'</span>'
            +'<span style="font-size:.62rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">'+label+'</span>'
            +'</div>';
    }`;

const result = c.slice(0, s) + newFn + c.slice(e);
fs.writeFileSync('attendance.html', result, 'utf8');
console.log('Done. Characters: before=' + s + ' after=' + e + ' new length=' + result.length);
