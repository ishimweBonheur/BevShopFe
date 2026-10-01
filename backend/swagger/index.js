const swaggerUi=require('swagger-ui-express');
const string={type:'string'},number={type:'number',minimum:0},uuid={type:'string',format:'uuid'},quantity={type:'integer',minimum:1};
const object=(properties,required=[])=>({type:'object',properties,required});
const date={type:'string',format:'date'},paths={};
function operation(path,method,summary,body,options={}){
 paths[path]||={};paths[path][method]={summary,...(options.public?{security:[]}:{}),parameters:[...(path.includes('{id}')?[{name:'id',in:'path',required:true,schema:uuid}]:[]),...(['post','put'].includes(method)&&!options.public?[{name:'Idempotency-Key',in:'header',schema:uuid,description:'Reuse for an identical retry to prevent duplicate entries.'}]:[]),...(options.parameters||[])],...(body?{requestBody:{required:true,content:{'application/json':{schema:body}}}}:{}),responses:{[options.created?'201':'200']:{description:'Success'},400:{description:'Invalid input'},401:{description:'Sign in required'},409:{description:'Duplicate name, changed retry, or insufficient stock'}}};
}
operation('/auth/setup-status','get','Check whether owner setup is needed',null,{public:true});
operation('/auth/setup','post','Create the single owner',object({name:string,email:string,password:string,setupToken:string},['name','email','password','setupToken']),{public:true,created:true});
operation('/auth/login','post','Sign in',object({email:string,password:string},['email','password']),{public:true});
operation('/auth/check','get','Current owner');
operation('/auth/password','post','Change password',object({currentPassword:string,newPassword:string},['currentPassword','newPassword']));
operation('/auth/recovery-code','post','Create a recovery code',object({currentPassword:string},['currentPassword']));
operation('/auth/recover','post','Reset password',object({email:string,recoveryCode:string,newPassword:string},['email','recoveryCode','newPassword']),{public:true});
const schemas={
 categories:object({name:string,description:string},['name']),
 products:object({name:string,categoryId:uuid,description:string,unitsPerPack:quantity,sellingPrice:number,lowStockLevel:{type:'integer',minimum:0}},['name','unitsPerPack','sellingPrice']),
 suppliers:object({name:string,phone:string,email:string,address:string,notes:string},['name']),
 purchases:object({date,supplierId:uuid,notes:string,items:{type:'array',minItems:1,maxItems:100,items:object({productId:uuid,packs:quantity,unitsPerPack:quantity,pricePerPack:number},['productId','packs','pricePerPack'])}},['items']),
 sales:object({date,notes:string,paymentMethod:{type:'string',enum:['cash','mobile_money','bank']},items:{type:'array',minItems:1,maxItems:100,items:object({productId:uuid,quantity,sellingPrice:number},['productId','quantity'])}},['items']),
 expenses:object({date,name:string,category:string,description:string,amount:number},['name','amount']),
 'damaged-items':object({date,productId:uuid,quantity,reason:string},['productId','quantity']),
 'owner-money':object({date,type:{type:'string',enum:['money_added','money_taken']},amount:number,notes:string},['type','amount'])
};
for(const [name,schema]of Object.entries(schemas)){
 operation('/'+name,'get','List '+name,null,{parameters:[{name:'page',in:'query',schema:{type:'integer',minimum:1}}]});
 operation('/'+name,'post','Save '+name,schema,{created:true});
 if(['products','categories','suppliers','expenses'].includes(name))operation('/'+name+'/{id}','put','Edit '+name,schema);
 if(['purchases','sales','expenses','damaged-items','owner-money'].includes(name))operation('/'+name+'/{id}','get','View '+name);
}
operation('/history','get','Combined notebook history',null,{parameters:[{name:'page',in:'query',schema:{type:'integer',minimum:1}},{name:'type',in:'query',schema:{type:'string',enum:['Bought','Sold','Expense','Damaged','Money Added','Money Taken']}}]});
operation('/reports/summary','get','Sales, sold-item costs, expenses, damage and profit',null,{parameters:[{name:'period',in:'query',schema:{type:'string',enum:['daily','weekly','monthly','yearly','custom']}},...['startDate','endDate'].map(name=>({name,in:'query',schema:date}))]});
operation('/settings','get','Fixed RWF and Kigali time configuration');
operation('/health','get','Database health',null,{public:true});
operation('/backups','get','Backup status');operation('/backups','post','Create encrypted backup',null,{created:true});
operation('/backups/{name}','get','Download encrypted backup',null,{parameters:[{name:'name',in:'path',required:true,schema:string}]});
const specs={openapi:'3.0.3',info:{title:'Beverage Shop Notebook API',version:'2.0.0',description:'Single-owner notebook. RWF only. Kigali dates. Stock is counted in individual items. Profit is sales minus stored sold-item costs, expenses and damaged losses.'},servers:[{url:'/api'}],security:[{BearerAuth:[]}],components:{securitySchemes:{BearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}}},paths};
module.exports={swaggerUi,specs};
