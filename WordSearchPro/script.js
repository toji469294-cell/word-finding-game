const WORDS = ["APPLE", "BANANA", "ORANGE", "GRAPE", "MANGO", "PEACH", "BERRY", "LEMON"];
const SIZE = 10;
const DIRECTIONS = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
let board = [], placements = [], foundWords = new Set(), selected = [], score = 0, seconds = 240, timerId = null, gameOver = false, soundOn = true, toastTimeout;

const gridEl = document.getElementById("grid");
const listEl = document.getElementById("wordList");
const toastEl = document.getElementById("toast");

function randomLetter(){ return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random()*26)]; }
function makeBoard(){
  board = Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  placements = [];
  WORDS.forEach(word=>{
    let placed = false, attempts = 0;
    while(!placed && attempts++ < 500){
      const [dr,dc] = DIRECTIONS[Math.floor(Math.random()*DIRECTIONS.length)];
      const r = Math.floor(Math.random()*SIZE), c = Math.floor(Math.random()*SIZE);
      const er = r + dr*(word.length-1), ec = c + dc*(word.length-1);
      if(er<0 || er>=SIZE || ec<0 || ec>=SIZE) continue;
      let ok = true;
      for(let i=0;i<word.length;i++){
        const existing = board[r+dr*i][c+dc*i];
        if(existing && existing !== word[i]) { ok=false; break; }
      }
      if(!ok) continue;
      const cells=[];
      for(let i=0;i<word.length;i++){ const rr=r+dr*i, cc=c+dc*i; board[rr][cc]=word[i]; cells.push(`${rr}-${cc}`); }
      placements.push({word,cells}); placed=true;
    }
  });
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!board[r][c]) board[r][c]=randomLetter();
}
function renderGrid(){
  gridEl.innerHTML="";
  board.forEach((row,r)=>row.forEach((letter,c)=>{
    const btn=document.createElement("button");
    btn.className="letter"; btn.textContent=letter; btn.dataset.cell=`${r}-${c}`;
    btn.setAttribute("aria-label",`Row ${r+1}, column ${c+1}, letter ${letter}`);
    btn.addEventListener("click",()=>selectCell(r,c));
    gridEl.appendChild(btn);
  }));
}
function renderWords(){
  listEl.innerHTML="";
  WORDS.forEach(word=>{
    const li=document.createElement("li"); li.id=`word-${word}`;
    li.innerHTML=`<span class="word-check">${foundWords.has(word)?"✓":""}</span><span>${word}</span>`;
    if(foundWords.has(word)) li.classList.add("found");
    listEl.appendChild(li);
  });
}
function selectCell(r,c){
  if(gameOver) return;
  const cell=`${r}-${c}`;
  if(selected.length===0){ selected=[cell]; updateSelection(); document.getElementById("selectionHint").textContent="Now select the last letter"; return; }
  if(selected.length===1 && selected[0]===cell){ selected=[]; updateSelection(); document.getElementById("selectionHint").textContent="Select a word on the grid"; return; }
  selected.push(cell);
  const path=getPath(selected[0],selected[1]);
  const word=path.map(key=>{const [rr,cc]=key.split("-").map(Number);return board[rr][cc];}).join("");
  const reverse=word.split("").reverse().join("");
  const match=placements.find(p=>!foundWords.has(p.word) && (p.word===word || p.word===reverse) && sameCells(path,p.cells));
  if(match){
    foundWords.add(match.word); score+=match.word.length*10;
    renderWords(); updateStats(); markFound(match.cells);
    showToast(`✨ ${match.word} found! +${match.word.length*10} points`);
    if(soundOn) try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value=660; gain.gain.value=.035; osc.start(); osc.stop(ctx.currentTime+.12); }catch(e){}
    if(foundWords.size===WORDS.length) endGame(true);
  }else{ showToast("Not a hidden word — try again!"); }
  selected=[]; updateSelection(); document.getElementById("selectionHint").textContent="Select a word on the grid";
}
function getPath(a,b){
  const [r1,c1]=a.split("-").map(Number),[r2,c2]=b.split("-").map(Number);
  const dr=r2-r1, dc=c2-c1;
  if(dr!==0 && dc!==0 && Math.abs(dr)!==Math.abs(dc)) return [a,b];
  const steps=Math.max(Math.abs(dr),Math.abs(dc));
  if(steps===0) return [a];
  const sr=Math.sign(dr),sc=Math.sign(dc),path=[];
  for(let i=0;i<=steps;i++) path.push(`${r1+sr*i}-${c1+sc*i}`);
  return path;
}
function sameCells(a,b){return a.length===b.length && a.every((v,i)=>v===b[i]) || a.length===b.length && a.every((v,i)=>v===b[b.length-1-i]);}
function updateSelection(){
  document.querySelectorAll(".letter.selected").forEach(el=>el.classList.remove("selected"));
  selected.forEach(key=>{const el=gridEl.querySelector(`[data-cell="${key}"]`);if(el)el.classList.add("selected");});
}
function markFound(cells){cells.forEach(key=>{const el=gridEl.querySelector(`[data-cell="${key}"]`);if(el)el.classList.add("found");});}
function updateStats(){
  document.getElementById("score").textContent=String(score).padStart(3,"0");
  document.getElementById("progress").textContent=`${foundWords.size} / ${WORDS.length}`;
  const pct=Math.round(foundWords.size/WORDS.length*100);
  document.getElementById("progressPercent").textContent=`${pct}%`;
  document.getElementById("progressBar").style.width=`${pct}%`;
}
function showToast(message){
  toastEl.textContent=message;toastEl.classList.add("show");clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>toastEl.classList.remove("show"),2100);
}
function updateTimer(){
  const m=String(Math.floor(seconds/60)).padStart(2,"0"),s=String(seconds%60).padStart(2,"0");
  document.getElementById("timer").textContent=`${m}:${s}`;
}
function startTimer(){
  clearInterval(timerId);timerId=setInterval(()=>{if(gameOver)return;seconds--;updateTimer();if(seconds<=0)endGame(false);},1000);
}
function endGame(won){
  gameOver=true;clearInterval(timerId);
  document.getElementById("modalTitle").textContent=won?"Brilliant! You did it!":"Time's up!";
  document.getElementById("modalMessage").textContent=won?"You found every hidden word. Champion move!":`You found ${foundWords.size} out of ${WORDS.length} words. Give it another shot!`;
  document.getElementById("finalScore").textContent=String(score).padStart(3,"0");
  document.getElementById("modal").classList.remove("hidden");
}
function newGame(){
  foundWords=new Set();selected=[];score=0;seconds=240;gameOver=false;
  document.getElementById("modal").classList.add("hidden");
  makeBoard();renderGrid();renderWords();updateStats();updateTimer();startTimer();
  document.getElementById("selectionHint").textContent="Select a word on the grid";
  showToast("New challenge ready. Good luck!");
}
document.getElementById("newGameBtn").addEventListener("click",newGame);
document.getElementById("playAgainBtn").addEventListener("click",newGame);
document.getElementById("soundBtn").addEventListener("click",()=>{soundOn=!soundOn;document.getElementById("soundBtn").textContent=soundOn?"♫":"♪";showToast(soundOn?"Sound effects on":"Sound effects off");});
document.getElementById("hintBtn").addEventListener("click",()=>{
  if(gameOver)return;
  const remaining=placements.filter(p=>!foundWords.has(p.word));
  if(!remaining.length)return;
  score=Math.max(0,score-5);updateStats();
  const chosen=remaining[Math.floor(Math.random()*remaining.length)];
  const first=gridEl.querySelector(`[data-cell="${chosen.cells[0]}"]`);
  first.classList.add("selected");setTimeout(()=>first.classList.remove("selected"),1200);
  showToast(`Hint: look for a word starting with ${chosen.word[0]} (−5 points)`);
});
newGame();
