window.YAVIYA_COUNTRY=new URLSearchParams(location.search).get('country')==='CG'||location.pathname.endsWith('/congo.html')?'CG':'CD';
window.countryCopy=s=>window.YAVIYA_COUNTRY!=='CG'||typeof s!=='string'?s:s.replace(/francs congolais/g,'francs CFA').replace(/\bFC\b/g,'FCFA').replace(/Toutes les provinces/g,'Tous les départements').replace(/All provinces/g,'All departments').replace(/Province/g,'Département').replace(/\+243 000 000 000/g,'+242 000 000 000').replace(/contact@yaviya\.cd/g,'contact Congo à confirmer').replace(/M-Pesa|M-PESA|Airtel Money|Orange Money|Afrimoney|VODACOM/g,'Mobile Money local');
window.countryCityOptions=()=>Object.keys(communes).map(c=>`<option>${c}</option>`).join('');
if(window.YAVIYA_COUNTRY==='CG'){const regionalFetch=window.fetch.bind(window);window.fetch=(input,init)=>{if(typeof input==='string'&&input.startsWith('/api/')){const u=new URL(input,location.origin);u.searchParams.set('country','CG');input=u.pathname+u.search}return regionalFetch(input,init)}}

window.readSellerMarkets=()=>{try{return JSON.parse(sessionStorage.getItem('yaviya-seller-markets-demo')||'{}')}catch{return {}}};
window.sellerInCurrentMarket=s=>!!s&&(s.marketCountries||readSellerMarkets()[s.id]?.countries||[s.homeCountry||window.YAVIYA_COUNTRY]).includes(window.YAVIYA_COUNTRY);

window.regionalContentCopy=s=>window.YAVIYA_COUNTRY==='CG'&&typeof s==='string'?countryCopy(s).replace(/Kinshasa/g,'Brazzaville').replace(/Lubumbashi/g,'Pointe-Noire').replace(/République démocratique du Congo/g,'République du Congo'):s;
