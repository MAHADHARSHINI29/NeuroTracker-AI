const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix Recharts axes and grids for light mode
content = content.replace(/rgba\(255,255,255,0\.04\)/g, 'rgba(0,0,0,0.06)');
content = content.replace(/rgba\(255,255,255,0\.06\)/g, 'rgba(0,0,0,0.1)');
content = content.replace(/rgba\(255,255,255,0\.4\)/g, 'rgba(0,0,0,0.5)');
content = content.replace(/rgba\(255,255,255,0\.3\)/g, 'rgba(0,0,0,0.4)');
content = content.replace(/rgba\(255,255,255,0\.2\)/g, 'rgba(0,0,0,0.3)');
content = content.replace(/rgba\(255,255,255,0\.5\)/g, 'rgba(0,0,0,0.6)');
content = content.replace(/rgba\(255,255,255,0\.1\)/g, 'rgba(0,0,0,0.2)');
content = content.replace(/color: '#fff'/g, "color: '#0f172a'");
content = content.replace(/backgroundColor: '#1a1f35'/g, "backgroundColor: '#ffffff'");

// Fix remaining text-white opacities
content = content.replace(/text-white\/25/g, 'text-slate-500');
content = content.replace(/text-white\/30/g, 'text-slate-500');
content = content.replace(/text-white\/50/g, 'text-slate-600');
content = content.replace(/text-white\/60/g, 'text-slate-600');
content = content.replace(/text-white\/70/g, 'text-slate-700');

// Fix specific text colors in stat cards
content = content.replace(/<p className="text-3xl font-extrabold text-white">/g, '<p className="text-3xl font-extrabold text-slate-900">');
content = content.replace(/<h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight">/g, '<h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">');
content = content.replace(/<span className="font-display font-bold text-white text-sm tracking-tight">/g, '<span className="font-display font-bold text-slate-900 text-sm tracking-tight">');

// Revert table cell white text back to slate
content = content.replace(/<TableRow className="border-border hover:bg-slate-100">/g, '<TableRow className="border-border hover:bg-slate-50">');
content = content.replace(/text-white\/40/g, 'text-slate-500'); // Catch any stragglers
content = content.replace(/text-white/g, 'text-slate-900'); // Final catch-all for any unstyled text-white (will break icon tags again so I must restore them below)

content = content.replace(/<([A-Za-z]+) className="([^"]*)text-slate-900([^"]*)" \/>/g, '<$1 className="$2text-white$3" />');
content = content.replace(/text-slate-900(\s+)text-sm/g, 'text-slate-900$1text-sm');
content = content.replace(/<p className="text-3xl font-extrabold text-slate-900">/g, '<p className="text-3xl font-extrabold text-slate-900">');
content = content.replace(/<h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">/g, '<h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">');
content = content.replace(/<span className="font-display font-bold text-slate-900 text-sm tracking-tight">/g, '<span className="font-display font-bold text-slate-900 text-sm tracking-tight">');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Second pass theme replacement complete.');
