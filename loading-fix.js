// Lightweight page safety helper.
// Keep this file intentionally small: the main app handles loading errors itself.
(function(){
  const mode=document.getElementById('competitionMode');
  if(mode){
    mode.addEventListener('change',()=>{
      const button=document.getElementById('analyze');
      if(button) button.click();
    });
  }
})();
