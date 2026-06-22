const fs = require('fs');
let c = fs.readFileSync('examinations.html', 'utf8');

// Fix 1: resSelectType - broken: (\\''+type+'\\')
c = c.split("onclick=\"resSelectType(\\''"+"+type+'"+"'\\\\')\">").join(
    "onclick=\"resSelectType('\" + type + \"')\">'"
);
// Direct exact replacement using what we saw
c = c.split("onclick=\"resSelectType(\\''+type+'\\')\"").join(
    "onclick=\"resSelectType('\\'' + type + '\\'')\"");

fs.writeFileSync('examinations.html', c, 'utf8');
console.log('done');
