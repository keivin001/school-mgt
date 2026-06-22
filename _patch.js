const fs = require('fs');
let c = fs.readFileSync('examinations.html', 'utf8');

// Pattern in file: onclick="resSelectType('" + type + "')"
// Fixed:          onclick="\'" + type + "\')"
c = c.split('\'" onclick="resSelectType(\'\" + type + \"\')"\'')
     .join('\' onclick="resSelectType(\\\'\" + type + \"\\\')"\'');

// Direct string replacements for each broken pattern
const fixes = [
  // resSelectType
  ['onclick="resSelectType(\'" + type + "\')"', 'onclick="\\'+ "'" + '" + type + "' + "'" + '\\")"'],
];

// Simpler approach: just replace the exact broken substrings
c = c.replace(
  `onclick="resSelectType('" + type + "')"`,
  `onclick="resSelectType('\" + type + \"')\"`
);
c = c.replace(
  `onclick="resSelectClass('" + cid + "')"`,
  `onclick="resSelectClass('\" + cid + \"')\"`
);
c = c.replace(
  `onclick="resSelectStudent('" + row.st.id + "')"`,
  `onclick="resSelectStudent('\" + row.st.id + \"')\"`
);
// onerror avatar broken quotes  
c = c.replace(
  `onerror="this.src='https://i.pravatar.cc/60?u=' + row.st.id + ''"`,
  `onerror="this.src='https://i.pravatar.cc/60?u=\" + row.st.id + \"'"`
);
c = c.replace(
  `onerror="this.src='https://i.pravatar.cc/150?u=' + student.id + ''"`,
  `onerror="this.src='https://i.pravatar.cc/150?u=\" + student.id + \"'"`
);
// Teacher's curly apostrophe
c = c.replace(/Teacher\u2019s/g, "Teacher's");
// Any remaining smart quotes
c = c.replace(/\u2018/g, "'").replace(/\u2019/g, "'");

fs.writeFileSync('examinations.html', c, 'utf8');
console.log('Done. Length:', c.length);
