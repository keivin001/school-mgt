const fs = require('fs');
let c = fs.readFileSync('examinations.html', 'utf8');

// Fix onclick handlers with broken quote escaping
// Current broken form: onclick=\"resSelectType(\\''+type+'\\')\"
// What it should produce in HTML: onclick="resSelectType('VALUE')"
// Correct JS string: + 'onclick="resSelectType(\\'' + type + '\\')"'

c = c.replace(/onclick=\\"resSelectType\\(\\\\''\+type\+'\\\\'\)\\"/g,
  'onclick=\\"resSelectType(\\\'\" + type + \"\\\')\\"');

// Simpler approach: fix all three patterns by direct char-level replacement
c = c.split(" onclick=\"resSelectType(\\''+type+'\\')\"").join(" onclick=\"resSelectType('\" + type + \"')\"");
c = c.split(" onclick=\"resSelectClass(\\''+cid+'\\')\"").join(" onclick=\"resSelectClass('\" + cid + \"')\"");
c = c.split(" onclick=\"resSelectStudent(\\''+row.st.id+'\\')\"").join(" onclick=\"resSelectStudent('\" + row.st.id + \"')\"");

// Fix onerror broken patterns
c = c.split("onerror=\"this.src='https://i.pravatar.cc/60?u='+row.st.id+'\\'\"").join("onerror=\"this.src='https://i.pravatar.cc/60?u=\" + row.st.id + \"'\"");
c = c.split("onerror=\"this.src='https://i.pravatar.cc/150?u='+student.id+'\\'\"").join("onerror=\"this.src='https://i.pravatar.cc/150?u=\" + student.id + \"'\"");

fs.writeFileSync('examinations.html', c, 'utf8');
console.log('Done. Length:', c.length);
