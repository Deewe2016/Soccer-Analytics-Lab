// Reliability fixes for GitHub Pages loading and match-format changes.
(function(){
  function ready(){
    const status=document.getElementById('dataStatus');
    const mode=document.getElementById('competitionMode');
    const analyze=()=>{if(window.SoccerModel&&typeof window.SoccerModel.analyzeMatch==='function'){try{window.dispatchEvent(new Event('soccer-lab-analyze'));}catch(e){}}};
    if(mode) mode.addEventListener('change',()=>{
      const button=document.getElementById('analyze');
      if(button) button.click(); else analyze();
    });
    // Never leave the UI stuck on "Loading automatic ratings" if the network request fails.
    window.setTimeout(()=>{
      if(status && /Loading automatic ratings/i.test(status.textContent)){
        status.textContent=document.documentElement.lang==='zh-CN'
          ? '自动评分暂时无法加载，正在使用备用评分'
          : 'Automatic ratings unavailable — using fallback ratings';
      }
    },8000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready); else ready();
})();
