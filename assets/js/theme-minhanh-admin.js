(()=>{
  'use strict';
  if(!window.ADMIN_DATA)return;
  if(!window.ADMIN_DATA.themes.some(([key])=>key==='minhanh'))window.ADMIN_DATA.themes.push(['minhanh','Hồng hoa']);
})();
