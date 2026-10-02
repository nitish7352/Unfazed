const { execSync } = require('child_process');
const REPO = 'c:\\Users\\Adarsh\\OneDrive\\Desktop\\Major Project';
const ENV  = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' };
const OPT  = { cwd: REPO, encoding: 'utf8', env: ENV, timeout: 60000 };

try {
  console.log('Staging all changes...');
  execSync('git add -A', OPT);
  console.log(execSync('git status --short', OPT));

  console.log('Committing...');
  try {
    console.log(execSync('git commit -m "feat: premium SaaS UI redesign — calm professional aesthetic, live session join, full responsive layout"', OPT));
  } catch(e) {
    if (e.message.includes('nothing to commit')) { console.log('Nothing to commit'); }
    else throw e;
  }

  console.log(execSync('git log --oneline -3', OPT));
  console.log('Pushing...');
  console.log(execSync('git push origin master', OPT));
  console.log('✅ Done!');
} catch(e) {
  console.error('ERROR:', e.message.slice(0, 500));
}
