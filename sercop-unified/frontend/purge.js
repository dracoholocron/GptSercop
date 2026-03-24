const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');
const killWords = ['LCImport', 'LCExport', 'Workbox', 'Guarantee', 'Bank', 'Currenc', 'ExchangeRate', 'Commission', 'FinancialInstitution', 'Collection', 'Swift', 'DynamicSwift'];
let lines = content.split('\n');
let newLines = [];
let skipRoute = false;
for(let i=0; i<lines.length; i++) {
   let line = lines[i];
   if (line.trim().startsWith('<Route') && killWords.some(w => line.includes(w))) {
       skipRoute = true;
       continue;
   }
   if (skipRoute) {
       if (line.includes('/>') || line.includes('</Route>')) {
           skipRoute = false;
       }
       continue;
   }
   if (line.trim().startsWith('import') && killWords.some(w => line.includes(w))) {
       continue;
   }
   newLines.push(line);
}
let res = newLines.join('\n');
res = res.replace(
  "import { ComprasPublicasExpert } from './pages/ComprasPublicasExpert';",
  "import { ComprasPublicasExpert } from './pages/ComprasPublicasExpert';\nimport { InfimaCuantiaPage } from './pages/cp/InfimaCuantiaPage';\nimport { AdvancedSearchPage } from './pages/cp/AdvancedSearchPage';"
);
res = res.replace("</Routes>", "  <Route path=\"/cp/infima-cuantia\" element={<ProtectedRoute><Dashboard><InfimaCuantiaPage /></Dashboard></ProtectedRoute>} />\n        <Route path=\"/search\" element={<ProtectedRoute><Dashboard><AdvancedSearchPage /></Dashboard></ProtectedRoute>} />\n    </Routes>");
fs.writeFileSync(file, res);
console.log('App.tsx Restored, Cleaned and Expanded');
