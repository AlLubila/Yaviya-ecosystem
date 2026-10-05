if(window.YAVIYA_COUNTRY==='CG'){
for(const k of Object.keys(communes))delete communes[k];Object.assign(communes,{Brazzaville:['Makélékélé','Bacongo','Poto-Poto','Moungali','Ouenzé','Talangaï','Mfilou','Madibou','Djiri'],'Pointe-Noire':['Lumumba','Mvoumvou','Tié-Tié','Loandjili','Mongo-Mpoukou','Ngoyo']});
const congoNames=['Brazza Tech','Atelier Moungali','Ponton Sneakers','Maison Bacongo','Beauté Ouenzé','Les Petits de Ponton','Électro Brazza','Saveurs de Loandjili','Studio Poto-Poto','Ponton Musique'];
shops.forEach((s,i)=>{s.id=101+i;s.homeCountry='CG';s.city=i%2?'Pointe-Noire':'Brazzaville';s.commune=communes[s.city][i%communes[s.city].length];s.name=congoNames[i];s.initials=s.name.split(' ').map(x=>x[0]).slice(0,2).join('')});
paymentMethods.splice(0,paymentMethods.length,{id:'mobile',name:'Mobile Money local · prestataire à confirmer',type:'Démonstration',mark:'MM',color:'#6136dd'},{id:'card',name:'Carte bancaire · activation à confirmer',type:'Démonstration',mark:'CB',color:'#225e49'});
}

shops.forEach(s=>s.homeCountry=window.YAVIYA_COUNTRY);
