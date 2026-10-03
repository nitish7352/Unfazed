const { execSync } = require('child_process');
const REPO = 'c:\\Users\\Adarsh\\OneDrive\\Desktop\\Major Project';
const ENV  = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' };
const OPT  = { cwd: REPO, encoding: 'utf8', env: ENV, timeout: 60000 };
try {
  execSync('git add -A', OPT);
  const status = execSync('git status --short', OPT);
  console.log('Changed files:\n' + status);
  try {
    console.log(execSync('git commit -m "fix: live session button for scheduled/confirmed/in_progress + premium landing page redesign + Inter font via HTML head"', OPT));
  } catch(e) {
    if (e.message.includes('nothing to commit')) { console.log('Nothing to commit'); process.exit(0); }
    else throw e;
  }
  console.log(execSync('git log --oneline -3', OPT));
  console.log(execSync('git push origin master', OPT));
  console.log('✅ Pushed!');
} catch(e) { console.error('ERROR:', e.message.slice(0, 500)); }
