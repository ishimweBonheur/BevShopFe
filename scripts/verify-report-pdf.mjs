import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
const fixture=JSON.parse(readFileSync(join(tmpdir(),'bevshop-report-verification.json'),'utf8'))
const origin=process.env.FRONTEND_URL || 'http://127.0.0.1:5174'
const out=join(tmpdir(),'bevshop-pdf-verification');mkdirSync(out,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(token=>sessionStorage.setItem('bevshop-token',token),fixture.token)
 let lastReport
 await page.route('**/api/v1/**',async route=>{
  const incoming=new URL(route.request().url())
  assert.equal(route.request().method(),'GET','Browser report test must never mutate records')
  const response=await route.fetch({url:fixture.base+incoming.pathname+incoming.search})
  if(incoming.pathname.endsWith('/reports/print'))lastReport=await response.json()
  await route.fulfill({response})
 })
 await page.goto(origin+'/dashboard')
 await page.getByLabel('Loss: RWF 2,733.26', {exact:true}).waitFor()
 await page.goto(origin+'/reports')
 const download=page.getByRole('button',{name:'Download PDF',exact:true})
 for(const period of ['today','week','month','year','custom']) {
  await page.getByLabel('Period',{exact:true}).selectOption(period)
  if(period==='custom') {
   const day=fixture.loss.period.from.slice(0,10)
   await page.getByLabel('From Date',{exact:true}).fill(day)
   await page.getByLabel('To Date',{exact:true}).fill(day)
  }
  await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Download PDF');return b&&!b.disabled})
  await page.locator('p.total').filter({hasText:'Loss: RWF 2,733.26'}).waitFor()
  const [file]=await Promise.all([page.waitForEvent('download'),download.click()])
  const filename=file.suggestedFilename();assert.match(filename,/^business-report-.*\.pdf$/)
  const path=join(out,period+'-'+filename);await file.saveAs(path)
  const task=getDocument({data:new Uint8Array(readFileSync(path)),useSystemFonts:true}); const pdf=await task.promise
  assert.ok(pdf.numPages>1)
  let text=''
  for(let number=1;number<=pdf.numPages;number++) {
   const sheet=await pdf.getPage(number);const viewport=sheet.getViewport({scale:1})
   assert.ok(Math.abs(viewport.width-595.28)<1 && Math.abs(viewport.height-841.89)<1,'A4 portrait')
   const content=await sheet.getTextContent()
   const pageText=content.items.map(item=>item.str).join(' ')
   assert.ok(pageText.includes(`Page ${number} of ${pdf.numPages}`))
   for(const item of content.items)if(item.str.trim()) {
    assert.ok(item.transform[4]>=30 && item.transform[4]+item.width<=viewport.width-25,`text overflows horizontally: ${item.str}`)
    assert.ok(item.transform[5]>20 && item.transform[5]<viewport.height-20,`text overflows vertically: ${item.str}`)
   }
   if(pageText.includes('History completeness row'))assert.ok(pageText.includes('Item / Description'),'Repeating history header missing')
   text+=pageText+' '
  }
  for(const phrase of ['BEVERAGE SHOP BUSINESS REPORT','RWF 192,000','RWF 10,666.6','RWF 1,066.66','LOSS: RWF 2,733.26','FINAL RESULT','Money Taken','Bought','Sold','Damaged','Expense','Stock Summary','Payment Summary'])assert.ok(text.includes(phrase),`PDF missing ${phrase}`)
  for(let i=1;i<=55;i++)assert.ok(text.includes(`History completeness row ${i};`),`Missing history row ${i}`)
  assert.equal(lastReport.history.length,62)
  if(period==='year')assert.ok(text.includes('Monthly Summary'))
  console.log(`PASS ${period}: ${filename}; ${pdf.numPages} A4 pages; all 62 rows, exact totals, repeated headers, page numbers and margins.`)
  await task.destroy()
 }
 // Exercise the actual generator with real positive and zero snapshots too.
 for(const state of ['profit','loss','zero']) {
  const snapshot=fixture[state]
  const result=await page.evaluate(async ({snapshot})=>{
   const {createReportPDF}=await import('/src/features/reports/pdf.ts')
   const doc=createReportPDF(snapshot,'today')
   const probe=document.createElement('span');probe.style.color='var(--color-'+(snapshot.summary.profit_loss>0?'success':snapshot.summary.profit_loss<0?'danger':'text')+')';document.body.append(probe);const color=getComputedStyle(probe).color;probe.remove();return {raw:doc.output(),color}
  },{snapshot})
  const label=state==='profit'?'PROFIT: RWF 3,333.4':state==='loss'?'LOSS: RWF 2,733.26':'NO PROFIT / LOSS: RWF 0'
  assert.ok(result.raw.includes(label))
  const expected=result.color.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255)
  const actual=[...result.raw.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) rg/g)].map(m=>m.slice(1).map(Number))
  assert.ok(actual.some(rgb=>rgb.every((v,i)=>Math.abs(v-expected[i])<0.005)), 'PDF result must use theme color')
 }
 await page.route('**/api/v1/reports/print?**',route=>route.fulfill({json:{...fixture.loss,history:null}}))
 await page.reload()
 await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Download PDF');return b&&!b.disabled})
 await download.click()
 await page.getByText('Could not generate the report PDF. Please try again.',{exact:true}).waitFor()
 assert.deepEqual(errors,[])
 console.log('PASS positive and zero PDFs; dashboard and report totals match. Files:',out)
} finally { await browser.close() }
