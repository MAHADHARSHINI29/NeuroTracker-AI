const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the forced dark wrapper
content = content.replace('<div className="dark">', '<div>');

// Fix background gradient
content = content.replace(
  'from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a]',
  'from-slate-50 via-white to-slate-50'
);

// Semantic replacements
content = content.replace(/text-white\/40/g, 'text-slate-500');
content = content.replace(/text-white\/20/g, 'text-slate-400');
content = content.replace(/text-white\b(?!\/)/g, 'text-slate-900');

content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-white');
content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-slate-100');
content = content.replace(/bg-white\/\[0\.05\]/g, 'bg-slate-50');
content = content.replace(/bg-white\/\[0\.06\]/g, 'bg-slate-100');
content = content.replace(/bg-white\/5/g, 'bg-slate-100');
content = content.replace(/bg-white\/10/g, 'bg-slate-200');

content = content.replace(/border-white\/\[0\.06\]/g, 'border-slate-200');
content = content.replace(/border-white\/10/g, 'border-slate-200');
content = content.replace(/border-slate-800/g, 'border-slate-200');

content = content.replace(/bg-black\/40/g, 'bg-white/80');

// Fix specific icons that were white inside gradients (we still want them white)
// I'll revert text-slate-900 back to text-white for icon tags inside colored boxes
content = content.replace(/<([A-Za-z]+) className="([^"]*)text-slate-900([^"]*)" \/>/g, '<$1 className="$2text-white$3" />');
// The shield check specifically
content = content.replace(/text-slate-900(\s+)text-sm/g, 'text-slate-900$1text-sm');

// Confusion Matrix tooltip text color might be inverted now, let's ensure Tooltip text is visible
content = content.replace(/contentStyle=\{\{ backgroundColor: '#0f172a', borderColor: '#1e293b'/g, "contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0'");
content = content.replace(/itemStyle=\{\{ color: '#f8fafc' \}\}/g, "itemStyle={{ color: '#0f172a' }}");


fs.writeFileSync(filePath, content, 'utf8');
console.log('Theme changed to light mode.');
