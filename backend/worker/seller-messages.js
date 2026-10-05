const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function handleSellerMessages(request,env){
 const url=new URL(request.url),user=request.headers.get('oai-authenticated-user-id');
 if(!user)return json({error:'Sign in required'},401);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Origin rejected'},403);
 try{
  const country=user.startsWith('cg:')?'CG':'CD',base=user.startsWith('cg:')?user.slice(3):user;
  const admin=await env.DB.prepare('SELECT user_id FROM admin_access WHERE id=?').bind('owner').first(),isAdmin=admin?.user_id===base;
  const profile=await env.DB.prepare('SELECT account_type FROM customers WHERE user_id=?').bind(user).first();
  if(!isAdmin&&profile?.account_type!=='seller')return json({error:'Seller or administrator access required'},403);
  const threadQuery='SELECT c.user_id AS userId,c.name,i.company_name AS companyName,i.status FROM customers c LEFT JOIN identity_checks i ON i.user_id=c.user_id WHERE c.account_type=? AND '+(country==='CG'?"c.user_id LIKE 'cg:%'":"c.user_id NOT LIKE 'cg:%'")+ ' ORDER BY c.name LIMIT 200';
  const actingAdmin=isAdmin&&url.searchParams.get('view')!=='seller';if(!actingAdmin&&profile?.account_type!=='seller')return json({error:'Create a seller account first'},403);const threads=actingAdmin?(await env.DB.prepare(threadQuery).bind('seller').all()).results:[];
  if(request.method==='GET'){
   const target=actingAdmin?url.searchParams.get('sellerUserId'):user;
   if(!target)return json({isAdmin:actingAdmin,threads,messages:[],sellerUserId:null});
   if(actingAdmin&&!threads.some(t=>t.userId===target))return json({error:'Seller not found in this country'},404);
   const messages=(await env.DB.prepare('SELECT id,sender,message,created_at AS createdAt FROM seller_messages WHERE country=? AND seller_user_id=? ORDER BY created_at DESC LIMIT 100').bind(country,target).all()).results.reverse();
   return json({isAdmin:actingAdmin,threads,messages,sellerUserId:target});
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const d=await request.json(),target=actingAdmin?d.sellerUserId:user;
  if(actingAdmin&&!threads.some(t=>t.userId===target))return json({error:'Seller not found in this country'},404);
  if(typeof d.message!=='string'||!d.message.trim()||d.message.length>2000)return json({error:'Enter a message of 1–2000 characters'},400);
  if(isAdmin&&d.asSeller===true&&(target!==user||profile?.account_type!=='seller'))return json({error:'Only your own seller account may send as seller'},403);const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO seller_messages (id,seller_user_id,country,sender,message,created_at) VALUES (?,?,?,?,?,?)').bind(id,target,country,actingAdmin?'admin':'seller',d.message.trim(),Date.now()).run();
  return json({ok:true,id});
 }catch(e){console.error('Seller messaging unavailable',e);return json({error:'Messaging unavailable. Please retry.'},503)}
}
