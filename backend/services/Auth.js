const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { fail } = require('../helper/money');
const { text } = require('../helper/http');
const userView = u => ({ id:u.id,name:u.name,email:u.email,username:u.name,firstName:u.name,lastName:'',phone:u.phone,is_active:true,createdAt:u.created_at,updatedAt:u.created_at });
const sign = u => ({ user:userView(u),token:jwt.sign({id:u.id,version:u.token_version || 0},process.env.JWT_SECRET,{expiresIn:'12h'}) });
async function createUser(db, body) {
  const email = text(body.email,'Email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Invalid email');
  if (typeof body.password !== 'string' || body.password.length<10 || Buffer.byteLength(body.password)>72) fail('Password must have at least 10 characters and at most 72 bytes');
  const password = await bcrypt.hash(body.password,12);
  return (await db.query('INSERT INTO users(id,email,name,password,phone) VALUES($1,$2,$3,$4,$5) RETURNING *', [randomUUID(),email,text(body.name || [body.firstName,body.lastName].filter(Boolean).join(' '),'Name'),password,String(body.phone || '')])).rows[0];
}

module.exports = { userView, sign, createUser };
