const router=require('express').Router();
const {pool,transaction}=require('../models');
const {wrap}=require('../helper/http');
const notebook=require('../services/notebook');
router.get('/settings',(req,res)=>res.json({currency:'RWF',timezone:'Africa/Kigali'}));
router.get('/reports/summary',wrap(async(req,res)=>{
 const result=await transaction(async db=>{await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');return notebook.report(db,req.query);});
 res.json(result);
}));
router.get('/history',wrap(async(req,res)=>res.json(await notebook.list(pool,'history',req.query))));
for(const resource of ['categories','products','suppliers','purchases','sales','expenses','damaged-items','owner-money']) {
 router.get('/'+resource,wrap(async(req,res)=>res.json(await notebook.list(pool,resource,req.query))));
 router.post('/'+resource,wrap(async(req,res)=>res.status(201).json(await transaction(db=>notebook.save(db,resource,req.body,null,req.get('Idempotency-Key'))))));
 if(['categories','products','suppliers','expenses'].includes(resource)) router.put('/'+resource+'/:id',wrap(async(req,res)=>res.json(await transaction(db=>notebook.save(db,resource,req.body,req.params.id,req.get('Idempotency-Key'))))));
 if(['purchases','sales','expenses','damaged-items','owner-money'].includes(resource)) router.get('/'+resource+'/:id',wrap(async(req,res)=>res.json(await notebook.detail(pool,resource,req.params.id))));
}
module.exports=router;
