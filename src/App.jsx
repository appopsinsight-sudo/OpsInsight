import React, { useState, useCallback, useEffect, useRef } from "react";

const C = {
  bg:"#0B0E13",surface:"#13161E",surfaceUp:"#181C26",card:"#1A1F2B",
  accent:"#00D4AA",accentDim:"rgba(0,212,170,0.10)",accentGlow:"rgba(0,212,170,0.22)",
  warn:"#FF6347",warnDim:"rgba(255,99,71,0.10)",
  caution:"#F5A623",cautionDim:"rgba(245,166,35,0.10)",
  info:"#5B8DEF",infoDim:"rgba(91,141,239,0.10)",
  purple:"#A78BFA",purpleDim:"rgba(167,139,250,0.10)",
  text:"#E6EAF2",sub:"#8A95AB",dim:"#556178",
  border:"rgba(255,255,255,0.06)",borderL:"rgba(255,255,255,0.10)",
};
const fmt=v=>{const n=parseFloat(v);return isNaN(n)?"£0":(n<0?"-£":"£")+Math.abs(n).toLocaleString("en-GB",{maximumFractionDigits:0})};
const pct=v=>(parseFloat(v)||0).toFixed(1)+"%";

function useStored(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch (e) {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }, [val, key]);
  return [val, setVal];
}

/* ═══════════════════════════════════════════════════════════════════
   EXPLANATIONS
   ═══════════════════════════════════════════════════════════════════ */
const EX={
  // ── COGS ──
  "opening-stock":{title:"Opening Stock",icon:"📋",paragraphs:["Opening stock is your last closing stock — the value of food, drinks, and supplies left at the end of your previous stock take.","If you do stock weekly, last Sunday's closing stock becomes this week's opening stock.","Like checking your bank balance at the start of the month."],tip:"Always check this matches your last closing stock exactly."},
  "purchases":{title:"Purchases",icon:"🛒",paragraphs:["Total value of food and drinks bought between stock takes.","Weekly: add up every delivery note. Monthly: same thing, bigger number."],tip:"Keep every delivery note."},
  "closing-stock":{title:"Closing Stock",icon:"📦",paragraphs:["Value of everything left now. Count every item × cost price (not selling price).","Becomes next period's opening stock — accuracy matters twice."],tip:"Always count at the same time for consistency."},
  "revenue-sales":{title:"Revenue (Sales)",icon:"💷",paragraphs:["This is your Net Revenue (Sales excluding VAT) for the period you are calculating.","Pull this from your POS system — most POS systems can show Net Sales directly. If yours only shows Gross (including VAT), divide by 1.2 (for 20% VAT) to get Net Revenue.","All calculations in this app use Net Revenue. This keeps your percentages accurate and consistent."],tip:"Period must match your stock take exactly. Weekly COGS = that week's Net Sales."},
  "cogs-result":{title:"Cost of Goods Sold (COGS)",icon:"📊",paragraphs:["How much stock you used — consumed, wasted, stolen.","COGS = Opening Stock + Purchases − Closing Stock","COGS % = (COGS ÷ Revenue) × 100","Target: 28–35% of sales."],tip:"If COGS jumps: check prices, portions, waste, theft."},
  // ── GP ──
  "gp-revenue":{title:"Revenue (Sales)",icon:"💷",paragraphs:["This is your Net Revenue (Sales excluding VAT) for the same period you are calculating GP%, P&L, COGS and Waste.","All numbers must match the exact same period. If you are calculating GP% for a week, enter that week's Net Sales here."],tip:"Track daily sales."},
  "gp-cogs":{title:"Cost of Goods Sold",icon:"📦",paragraphs:["Cost of Goods Sold is the value of food and drinks you actually used in the same period as your sales. It is NOT what you purchased.","It is calculated as: Opening Stock + Purchases − Closing Stock.","This is important — Purchases are only one part of the calculation. If you just enter your purchases here without doing a proper stock take, your GP% will not be accurate."],tip:"Do not confuse Purchases with Cost of Goods Sold. For accurate GP, always use full stock-based COGS."},
  "gp-result":{title:"Gross Profit (GP%)",icon:"📈",paragraphs:["Money left after deducting the cost of food and drinks actually used to generate those sales.","GP = Revenue − COGS","GP% = (GP ÷ Revenue) × 100","GP% is only related to Food & Beverage costs. No other cost lines affect this number. This is how it's calculated — labour, rent, overheads are separate.","Target: Commercial Restaurants 65–75%."],tip:"2% improvement on £50k = £1,000 extra/month — as an example."},
  // ── WASTE ──
  "waste-waste":{title:"Waste",icon:"🗑️",paragraphs:["Food or drink that was paid for but cannot be sold.","This includes expired items, overproduction, mistakes, or items that were damaged or thrown away."],tip:"Under 5% of Net Revenue — each company may set their own target in KPI Targets."},
  "waste-breakage":{title:"Breakage",icon:"💔",paragraphs:["Physical items that are damaged or broken, such as glasses, plates, or equipment."],tip:"If breakage increases during busy periods, it may indicate understaffing or pressure on the team."},
  "waste-comps":{title:"Comps",icon:"🎁",paragraphs:["Items (food & drinks) given away free. Record every one with a reason."],tip:"Set weekly comp budget (1–2%)."},
  "waste-revenue":{title:"Revenue (Sales)",icon:"💷",paragraphs:["This is your Net Revenue (Sales excluding VAT) for the same period. This is used to calculate all percentages."],tip:"Always look at % not just £."},
  "waste-result":{title:"Total Losses",icon:"📉",paragraphs:["Waste + Breakage + Comps.","Total Losses % = (Losses ÷ Revenue) × 100","Target: under 5–8%."],tip:"Track daily."},
  // ── P&L ──
  "pnl-revenue":{title:"Revenue (Sales)",icon:"💷",paragraphs:["This is your Net Revenue (Sales excluding VAT) for the same period you are calculating your P&L."],tip:"Track daily."},
  "pnl-food-cost":{title:"Food Cost",icon:"🥩",paragraphs:["Cost of food ingredients used in the period. This forms part of your Cost of Sales.","Typically 28–35% of Net Revenue in a commercial setting."],tip:"Cost every dish and check prices going up on ingredients — this will affect your overall profit for each dish and eventually increase your COGS %."},
  "pnl-beverage-cost":{title:"Beverage Cost",icon:"🍷",paragraphs:["Cost of drinks used in the period (coffee, soft drinks, alcohol). This forms part of your Cost of Sales.","Typically 18–25% of Net Revenue in a commercial setting."],tip:"Use measures and for built-in-house juices, make sure you stay ahead of price increases on fruits or vegetables for smoothies."},
  "pnl-other-cos":{title:"Other Cost of Sales",icon:"📋",paragraphs:["Packaging, disposables, chemicals."],tip:"Negotiate prices."},
  "pnl-gp":{title:"Gross Profit",icon:"📈",paragraphs:["Revenue − Cost of Sales (Food & Beverage only).","GP% is only affected by Food & Beverage costs. Labour, rent, and overheads do NOT affect GP%.","Target in commercial setting: 65–75%."],tip:"Track weekly to have time to react if you have a poor week of GP%."},
  "pnl-wages":{title:"Wages & Salaries",icon:"👥",paragraphs:["All staff pay. Labour: 25–35% of Net Revenue in commercial setting."],tip:"Revenue per labour hour is the best measure of labour efficiency. It shows how much sales each hour of work generates."},
  "pnl-ni-pension":{title:"NI & Pension",icon:"🏛️",paragraphs:["Adds 13–15% on top of wages."],tip:"Add 15% when budgeting for labour — this will keep things clear."},
  "pnl-agency":{title:"Agency Staff",icon:"📱",paragraphs:["Temp workers with markup (higher cost)."],tip:"High use = recruitment problem."},
  "pnl-rent":{title:"Rent & Rates",icon:"🏢",paragraphs:["Fixed cost usually between 8–15% of Net Revenue. It does not change with sales."],tip:"Know your break-even daily revenue — the minimum you need to cover all costs."},
  "pnl-utilities":{title:"Utilities",icon:"⚡",paragraphs:["Gas, electric, water. 3–6%."],tip:"LED, turn off unused equipment, sleep mode overnight on coffee machines, lights etc."},
  "pnl-insurance":{title:"Insurance",icon:"🛡️",paragraphs:["1–3% of revenue."],tip:"Shop annually, check better prices for the same or better coverage."},
  "pnl-marketing":{title:"Marketing",icon:"📣",paragraphs:["Ads, PR, events. 2–5%."],tip:"Ask how customers found you — e.g. word of mouth, Instagram, Facebook etc."},
  "pnl-repairs":{title:"Repairs & Maintenance",icon:"🔧",paragraphs:["Budget 1–3%."],tip:"Maintenance calendar, but best practice is to stay ahead of this and train team properly on how to use equipment to not damage it."},
  "pnl-other-overheads":{title:"Other Overheads",icon:"📂",paragraphs:["POS, accountancy, licences. 3–6%."],tip:"Review subscriptions quarterly — where possible, depends on what you previously signed."},
  "pnl-net":{title:"Net Profit",icon:"💰",paragraphs:["What's left after everything.","Net = Revenue − CoS − Labour − Overheads","8–15% good. Below 5% needs attention."],tip:"Find the ONE area dragging you down and make improvements ASAP."},
  // ── EBITDA ──
  "ebitda-result":{title:"EBITDA (Monthly)",icon:"🎯",paragraphs:["Earnings Before Interest, Tax, Depreciation and Amortisation.","EBITDA = Net Revenue − Cost of Sales − Labour − Overheads","Professional explanation: EBITDA measures the profitability of the business from its core operations before financing costs, tax, and non-cash charges like depreciation.","Simple explanation: EBITDA shows how much money your business makes from running the operation before the bank, tax, and accounting adjustments are applied.","Healthy: 15–25%. Investors use 4–6x EBITDA to value businesses."],tip:"Track GP% weekly, but review EBITDA monthly."},
  "ebitda-revenue":{title:"Revenue (Sales) for the Month",icon:"💷",paragraphs:["This is your Net Revenue (Sales excluding VAT) for the full month you are calculating your EBITDA.","EBITDA is a monthly measure — make sure you insert the full month's Net Sales here, not weekly.","The period must match all the other figures you enter in this section — cost of sales, labour, and overheads must all be for the same month."],tip:"Track GP% weekly but review EBITDA monthly."},
  "ebitda-cos":{title:"Total Cost of Sales",icon:"📦",paragraphs:["This is the total direct cost of the food and beverage you sold for the month.","It includes food and drink costs only. It does not include labour, rent, utilities, repairs, marketing, or other overheads.","Connection to GP: Gross Profit is calculated as Revenue − Cost of Sales. GP% is only affected by food and beverage costs — nothing else.","Target: Commercial setting benchmark is 65–75% GP (meaning your Cost of Sales should be 25–35% of Net Revenue)."],tip:"Track GP% weekly, but review EBITDA monthly."},
  "ebitda-depreciation":{title:"Depreciation & Amortisation",icon:"📉",paragraphs:["Depreciation spreads the cost of equipment over time as it wears out.","Example: A £10,000 coffee machine is not counted in one month — its cost is spread over several years.","It is not cash leaving the business today, but it reminds you that equipment will need replacing."],tip:"Always think: when will this need replacing, and can the business afford it?"},
  "ebitda-interest":{title:"Interest & Finance Costs",icon:"🏦",paragraphs:["Loans, overdrafts, merchant fees."],tip:"Review annually for better options."},
  "ebitda-tax":{title:"Tax",icon:"📑",paragraphs:["Corporation tax 19–25% on profit."],tip:"Use hospitality accountant."},
  // ── CAPEX ──
  "capex-result":{title:"CAPEX (Capital Expenditure)",icon:"🏗️",paragraphs:["Money on assets lasting 1+ years.","In hospitality: kitchen equipment, fit-out, technology.","Doesn't hit P&L as lump sum — appears as depreciation."],tip:"Budget 3–5% annually."},
  "capex-kitchen":{title:"Kitchen Equipment",icon:"🍳",paragraphs:["Ovens, fridges, dishwashers. Lasts 7–15 years."],tip:"Buy quality."},
  "capex-fitout":{title:"Fit-out & Refurbishment",icon:"🏠",paragraphs:["Flooring, lighting, furniture. £500–2,000/sqm. Refresh every 5–7 years."],tip:"Plan refresh budget."},
  "capex-technology":{title:"Technology",icon:"💻",paragraphs:["POS, kitchen screens, booking platforms."],tip:"Good POS pays for itself."},
  "capex-other":{title:"Other CAPEX",icon:"📦",paragraphs:["Signage, outdoor areas, vehicles."],tip:"Track with purchase date and expected life."},
  // ── KPI ──
  "kpi-info":{title:"KPI Targets",icon:"🎯",paragraphs:["KPIs are the numbers you need to hit to stay profitable.","Setting targets BEFORE measuring means you instantly know when something is off.","Set realistic targets for your concept. Review quarterly."],tip:"Write targets on the office wall."},
  // ── Gross vs Net Revenue ──
  "gross-revenue":{title:"Gross Revenue",icon:"💷",paragraphs:["Gross Revenue is the total amount of money your business takes in from sales BEFORE anything is removed.","It includes everything: food sales, drink sales, service charges, delivery income — the full amount customers pay including VAT.","Example: A customer pays £24 for a meal. That £24 is part of your Gross Revenue — even though £4 of it is VAT that belongs to HMRC.","Gross Revenue is rarely used in hospitality finance reporting because it includes VAT, which is not your money. That's why we use Net Revenue instead."],tip:"Think of Gross Revenue as 'everything that came through the till' — before the taxman takes their share."},
  "net-revenue":{title:"Net Revenue (Net Sales)",icon:"💷",paragraphs:["Net Revenue is your total sales AFTER removing VAT. This is the real income your business earned.","Net Revenue = Gross Revenue − VAT","This is the number you should use for ALL calculations in this app: COGS %, GP%, P&L, Waste %, EBITDA, and CAPEX %.","Why? Because VAT is not your money — you collect it on behalf of HMRC and pass it on. Including VAT in your calculations would make your percentages look better than they really are.","Example: If your till shows £120,000 for the month (Gross Revenue) and VAT is 20%, your Net Revenue is £100,000. All your cost percentages should be calculated against that £100,000.","Your POS system can usually show you Net Sales directly. If not, divide your Gross Revenue by 1.2 (for 20% VAT) to get Net Revenue."],tip:"Always use Net Revenue (excluding VAT) for all your calculations. This gives you the true picture."},
  // ── How is it calculated? pages ──
  "how-cogs":{title:"How is COGS Calculated?",icon:"🧮",paragraphs:["Formula:","Cost of Goods Sold = Opening Stock + Purchases − Closing Stock","COGS % = (COGS ÷ Net Revenue) × 100","Professional explanation: COGS measures the direct cost of goods consumed during a trading period. It is derived by adding opening inventory to purchases made during the period and subtracting the closing inventory value.","Simple explanation: You started with some stock. You bought more stock during the week or month. You counted what's left at the end. The difference is what you used — that's your COGS.","Important rules:","• Opening Stock is always last period's Closing Stock.","• Purchases must be for the same period only.","• Revenue must also match the same period.","• Always use Net Revenue (Sales excluding VAT) for calculating COGS %.","• Count stock at cost price (what you paid), not selling price."],tip:"If your COGS % suddenly changes by more than 2–3 points, something is wrong. Investigate immediately."},
  "how-gp":{title:"How is GP% Calculated?",icon:"🧮",paragraphs:["Formula:","Gross Profit = Net Revenue − Cost of Sales","GP% = (Gross Profit ÷ Net Revenue) × 100","Professional explanation: Gross Profit represents the residual revenue after deducting the direct cost of goods sold. It is exclusively related to food and beverage costs.","Simple explanation: GP% tells you how much money you keep from every £1 of sales after paying for your ingredients and drinks.","Important — GP% is Food & Beverage ONLY:","• Labour costs do NOT affect GP%.","• Rent does NOT affect GP%.","• Utilities, marketing, repairs — NONE of these affect GP%.","Revenue used: Always use Net Revenue (Sales excluding VAT)."],tip:"GP% is the first number to check every week."},
  "how-pnl":{title:"How is the P&L Calculated?",icon:"🧮",paragraphs:["The P&L (Profit & Loss) shows you exactly where your money goes:","Step 1 — Gross Revenue: Everything that came through the till, including VAT.","Step 2 — Less VAT: Remove VAT because it's not your money.","Step 3 — Net Revenue: Your true sales income. All percentages calculated from this.","Step 4 — Minus Cost of Sales (Food + Beverage + Other)","Step 5 — = Gross Profit. Target: 65–75%.","Step 6 — Minus Labour","Step 7 — Minus Overheads","Step 8 — = Net Profit. Target: 8–15%.","Always enter Net Revenue (Sales excluding VAT)."],tip:"Read the P&L like a waterfall — money flows in at the top and costs drain it at each level."},
  "how-waste":{title:"How are Losses Calculated?",icon:"🧮",paragraphs:["Formula:","Total Losses = Waste + Breakage + Comps","Loss % = (Total Losses ÷ Net Revenue) × 100","Waste: Food or drink paid for but could not be sold.","Breakage: Physical items damaged during operations.","Comps: Items given away free. Record every comp with a reason.","Revenue used: Net Revenue (Sales excluding VAT).","Target: Combined losses under 5–8%."],tip:"Track waste daily, not weekly."},
  "how-ebita":{title:"How is EBITDA Calculated?",icon:"🧮",paragraphs:["Formula:","EBITDA = Net Revenue − Cost of Sales − Labour − Overheads","If you also enter Depreciation, Interest, and Tax below EBITDA:","Net Profit = EBITDA − Depreciation − Interest − Tax","Professional explanation: EBITDA measures the profitability of the business from its core operations before financing costs, tax, and non-cash charges like depreciation.","Simple explanation: EBITDA shows how much money your business makes from running the operation before the bank, tax, and accounting adjustments are applied.","This page is monthly. Revenue used: Net Revenue (Sales excluding VAT) for the full month."],tip:"Track GP% weekly, but review EBITDA monthly. Investors value businesses at 4–6x EBITDA."},
  "how-capex":{title:"How is CAPEX Calculated?",icon:"🧮",paragraphs:["Formula:","Total CAPEX = Kitchen Equipment + Fit-out + Technology + Other CAPEX","CAPEX % = (Total CAPEX ÷ Net Revenue) × 100","Simple explanation: CAPEX is money you spend on big things that last. The cost is spread over years as depreciation, but the cash goes out upfront.","Revenue used: Net Revenue (Sales excluding VAT). Budget 3–5% of annual Net Revenue."],tip:"Create a 3-year CAPEX plan."},
  // ── Abbreviations ──
  "abbr-cogs":{title:"COGS — Cost of Goods Sold",icon:"📦",paragraphs:["What it means: The total value of stock (food & drink) actually used in a period.","How it's calculated: COGS = Opening Stock + Purchases − Closing Stock","Why it matters: COGS directly controls your Gross Profit. If COGS is too high, your margins shrink regardless of how busy you are.","Simple: It's not what you bought — it's what you used. The difference between what you started with, what you added, and what's left.","How to improve: Tighten portion control, negotiate supplier prices, reduce waste, and do accurate stock counts."],tip:"Track COGS weekly. A sudden jump means something changed — investigate immediately."},
  "abbr-cos":{title:"COS — Cost of Sales",icon:"📊",paragraphs:["What it means: The direct costs tied to producing what you sell — food cost, beverage cost, and any other direct production costs (like packaging).","How it's calculated: COS = Food Cost + Beverage Cost + Other Direct Costs","Why it matters: COS is subtracted from Revenue to give you Gross Profit. It's the first cost layer in your P&L.","Simple: Everything you spent on ingredients and drinks that went into what you sold. If it ends up on a plate or in a glass, it's Cost of Sales.","How to improve: Cost every dish, use measures for drinks, track waste daily."],tip:"COS and COGS are closely related. COGS is stock-based (uses stock counts). COS is the broader category on the P&L."},
  "abbr-gp":{title:"GP% — Gross Profit Percentage",icon:"📈",paragraphs:["What it means: The percentage of revenue you keep after paying for food and drink costs. GP% is Food & Beverage ONLY — labour, rent, and overheads do not affect it.","How it's calculated: GP% = (Revenue − Cost of Sales) ÷ Revenue × 100","Why it matters: GP% is the single most important number in hospitality. If GP% is wrong, no amount of cost-cutting elsewhere will save you.","Simple: For every £1 of sales, GP% tells you how many pence you keep after paying for ingredients. A 68% GP means you keep 68p.","How to improve: Review menu pricing, control portions, reduce waste, compare supplier costs."],tip:"Check GP% every week. A 2% improvement on £50k revenue = £1,000 extra per month."},
  "abbr-pnl":{title:"P&L — Profit & Loss Statement",icon:"📑",paragraphs:["What it means: A financial report showing all income and expenses for a period, ending with Net Profit (or loss).","How it's structured: Revenue → minus Cost of Sales → Gross Profit → minus Labour → minus Overheads → Net Profit","Why it matters: The P&L tells you whether your business is making or losing money, and exactly where the money goes.","Simple: Think of it as a waterfall. Money comes in at the top (revenue), costs drain it at each level, and what reaches the bottom is your profit.","How to improve: Focus on the biggest cost areas first — usually GP% and labour. Small percentage improvements on large numbers create big results."],tip:"Read your P&L monthly at minimum. Understand every line."},
  "abbr-ebitda":{title:"EBITDA — Earnings Before Interest, Tax, Depreciation & Amortisation",icon:"🎯",paragraphs:["What it means: Your operating profit before the bank (interest), government (tax), and accountant (depreciation) get involved.","How it's calculated: EBITDA = Revenue − Cost of Sales − Labour − Overheads","Why it matters: EBITDA shows how well the business operates day-to-day. Investors use it to value businesses (typically 4–6x EBITDA).","Simple: If two identical restaurants have different loans, they'll have different net profits — but the same EBITDA. It strips out everything except operational performance.","How to improve: Improve GP%, optimise labour scheduling, renegotiate overhead contracts."],tip:"Track EBITDA monthly. It's the truest measure of operational performance."},
  "abbr-capex":{title:"CAPEX — Capital Expenditure",icon:"🏗️",paragraphs:["What it means: Money spent on assets that last more than one year — kitchen equipment, fit-out, technology.","How it's calculated: Total CAPEX = all capital purchases in the period. CAPEX % = Total CAPEX ÷ Revenue × 100","Why it matters: CAPEX doesn't hit your P&L as a lump sum — it appears as depreciation spread over years. But the cash goes out upfront, so you need to plan for it.","Simple: Big things you buy for the business that last a long time. An oven, a refurb, a new POS system.","How to improve: Create a 3-year replacement plan. Budget 3–5% of annual revenue. Buy quality — cheap equipment costs more long-term."],tip:"Track every asset with purchase date, cost, and expected life."},
  "abbr-lc":{title:"LC — Labour Cost",icon:"👥",paragraphs:["What it means: Total cost of employing your team — wages, NI, pension, agency staff, overtime, staff meals, training.","How it's calculated: LC% = Total Labour Cost ÷ Revenue × 100","Why it matters: Labour is usually the second-largest cost after food/drink. Target: 25–35% of revenue depending on service style.","Simple: Everything you spend on your people. If labour is too high, profit disappears. Too low, service suffers and revenue drops.","How to improve: Match rotas to demand, track revenue per labour hour, reduce agency reliance, cross-train staff."],tip:"Revenue per labour hour (RPLH) is a better measure than just LC%. It shows productivity, not just cost."},
  "abbr-rplh":{title:"RPLH — Revenue per Labour Hour",icon:"⏱️",paragraphs:["What it means: How much revenue the business generates for every hour of labour worked.","How it's calculated: RPLH = Total Revenue ÷ Total Labour Hours","Why it matters: RPLH measures labour efficiency. A restaurant doing £25 RPLH is more efficient than one doing £18 RPLH. It helps you decide if you're overstaffed or understaffed.","Simple: If your team worked 500 hours this week and you took £15,000 in sales, your RPLH is £30. That means every hour of work generated £30 of revenue.","How to improve: Review rotas against busy/quiet patterns, reduce hours on slow days, schedule more staff when revenue potential is highest."],tip:"Track RPLH daily. Aim for consistent improvement rather than cutting hours blindly."},
  "abbr-asph":{title:"ASPH — Average Sales per Hour",icon:"⏱️",paragraphs:["What it means: Average sales generated per trading hour over a period.","How it's calculated: ASPH = Total Revenue ÷ Total Trading Hours","Why it matters: It helps you understand how strongly the business trades across the day or week.","Simple: If you took £2,000 over 10 trading hours, your ASPH is £200.","How to improve: Focus marketing on quiet hours, adjust opening times if certain hours consistently underperform, match staffing to high-ASPH periods."],tip:"Use ASPH to understand trading pace."},
  "abbr-sph":{title:"SPH — Sales per Hour",icon:"📊",paragraphs:["What it means: Sales generated in a specific hour.","How it's calculated: SPH = Revenue in that hour","Why it matters: It shows your busiest and weakest trading hours. Use it to adjust staffing, opening hours, and promotions.","Simple: If you took £350 between 12pm and 1pm, that hour's SPH is £350.","How to improve: Push promotions during quiet hours, adjust staffing to match peak hours, consider reducing hours if certain periods consistently lose money."],tip:"Use SPH to match staffing to demand."},
  "abbr-spend-per-head":{title:"Spend per Head",icon:"💷",paragraphs:["What it means: The average amount each customer spends per visit.","How it's calculated: Spend per Head = Total Revenue ÷ Total Covers (customers served)","Why it matters: It helps you understand customer value, upselling effectiveness, and whether your pricing is right.","Simple: If 200 customers spent £6,000, spend per head is £30. If you can move that to £32, you've added £400 in revenue with the same number of customers.","How to improve: Train staff on upselling, review menu layout and pricing, offer add-ons (sides, drinks, desserts), improve menu descriptions."],tip:"Small increases in spend per head can create big profit improvement."},
  "abbr-aov":{title:"AOV / ATV — Average Order Value / Average Transaction Value",icon:"🧾",paragraphs:["What it means: The average value of each transaction or order.","How it's calculated: AOV = Total Revenue ÷ Total Number of Transactions","Why it matters: Similar to ASPH but measured per transaction rather than per person. Useful for takeaway, delivery, and counter-service operations where you don't count covers.","Simple: If you had 150 transactions and took £4,500, your AOV is £30. Increasing it by even £2 means £300 more revenue from the same number of orders.","How to improve: Bundle deals, suggest add-ons at point of sale, review pricing tiers, offer meal deals."],tip:"AOV is especially important for delivery and takeaway where per-head counting doesn't apply."},
  "abbr-upt":{title:"UPT — Units per Transaction",icon:"📦",paragraphs:["What it means: The average number of items in each order or transaction.","How it's calculated: UPT = Total Items Sold ÷ Total Transactions","Why it matters: UPT tells you whether customers are buying just one item or multiple. Low UPT means missed cross-selling opportunities.","Simple: If a customer buys a coffee and nothing else, UPT is 1. If they add a pastry, it's 2. More items per transaction = more revenue without needing more customers.","How to improve: Display impulse items near the till, train staff to suggest additions, create combo deals."],tip:"Track UPT alongside AOV — together they tell you the full picture of selling performance."},
  "abbr-oos":{title:"OOS — Out of Stock",icon:"🚫",paragraphs:["What it means: An item that should be available but isn't — you've run out.","Why it matters: OOS items mean lost sales, disappointed customers, and potential damage to your reputation. Frequent OOS on popular items is a serious ordering or forecasting problem.","Simple: When a customer asks for something and you don't have it. Every time that happens, you lose revenue and trust.","How to improve: Improve ordering accuracy, track which items go OOS most often, use par levels (minimum stock levels), and communicate with suppliers on lead times."],tip:"Track every OOS incident. Patterns will show you whether the problem is ordering, storage, or supplier reliability."},
  "abbr-86":{title:"86 — Item Not Available",icon:"❌",paragraphs:["What it means: Kitchen/bar term meaning an item is completely unavailable — you've run out and cannot serve it.","Why it matters: 86'd items lose you revenue immediately and frustrate customers. Frequent 86s suggest poor prep planning, ordering issues, or recipe yield problems.","Simple: When the kitchen tells the floor 'we're out of the salmon' — that salmon is 86'd. Every 86 is a missed sale.","How to improve: Better prep forecasting, accurate par levels, and pre-shift communication between kitchen and floor about potential 86 risks."],tip:"Track what gets 86'd and when. If the same item is 86'd every Friday night, your ordering or prep needs adjusting."},
  "abbr-85":{title:"85 — Running Low",icon:"⚠️",paragraphs:["What it means: Kitchen/bar term meaning an item is running low — not out yet, but getting close. It's the warning before an 86.","Why it matters: An 85 gives the team time to react — push the item to sell through remaining stock, alert the floor to stop promoting it, or adjust portions.","Simple: When the kitchen says 'we're down to 3 portions of the lamb' — that's an 85. It means act now before it becomes an 86.","How to improve: Use 85 calls consistently, empower the team to communicate early, track 85-to-86 frequency to improve ordering."],tip:"A good 85 system prevents 86s. Train the team to call 85 early rather than waiting until it's too late."},
  // ── Leadership Tips ──
  "lead-pressure":{title:"Managing Pressure",icon:"🔥",paragraphs:["What it means: Learning how to stay calm when service is busy, something goes wrong, or the team is under pressure.","Why it matters: Managers set the emotional tone. If you panic, the team feels it. If you stay calm, the team has a better chance of staying focused.","Practical advice:","• Pause before reacting","• Lower your voice, not raise it","• Prioritise the next action, not the whole problem","• Fix the issue first, review it later","• Do not take pressure out on the team","Pressure does not create leadership; it reveals it. The goal is not to feel nothing — the goal is to act properly even when you feel pressure."],tip:"Stay calm enough to make the next right decision."},
  "lead-communication":{title:"Communication",icon:"💬",paragraphs:["What it means: Being able to speak clearly, directly, and respectfully — even when frustrated, nervous, or under pressure.","Why it matters: A good message delivered badly creates resistance. A difficult message delivered well can build trust.","Practical advice:","• Be clear about what you need","• Avoid attacking the person","• Focus on the behaviour or issue","• Check that they understood you","• Speak early before frustration builds","Before you speak, ask: 'What is my intention here, and will my words actually come across that way?'"],tip:"Good communication is not just what you say — it is how it lands."},
  "lead-feedback":{title:"Giving Feedback",icon:"📋",paragraphs:["What it means: Correcting or guiding someone so performance improves without making it feel personal.","Why it matters: Managers who avoid feedback allow standards to drop. Managers who give feedback badly damage trust.","Practical advice:","• Give feedback close to the moment","• Be specific","• Explain the impact","• Agree the next action","• Praise improvement when you see it","Feedback should be about improving the work, not winning the argument."],tip:"Correct the behaviour, not the person."},
  "lead-ownership":{title:"Taking Ownership",icon:"🏆",paragraphs:["What it means: Acting like a manager before someone officially gives you the title.","Why it matters: Promotion usually follows behaviour. If you already think and act like a manager, people are more likely to trust you with responsibility.","Practical advice:","• Solve problems without waiting to be asked","• Learn the numbers","• Support weaker team members","• Think about the whole shift, not only your task","• Bring solutions, not just complaints","You do not become a manager only when your title changes. You become one when your thinking changes."],tip:"Act at the level you want to grow into."},
  "lead-self-investment":{title:"Self-Investment",icon:"📚",paragraphs:["What it means: Taking responsibility for your own growth, skills, and confidence.","Why it matters: No manager, company, or mentor can develop you more than you are willing to develop yourself.","Practical advice:","• Learn basic finance","• Ask questions","• Read your P&L","• Watch how strong managers communicate","• Practice uncomfortable conversations","• Ask for feedback","No one will invest in you more than you. Your hard work may not always be noticed immediately, but your growth is still your responsibility."],tip:"Do not wait to be developed — start developing yourself."},
  "lead-emotional-control":{title:"Emotional Control",icon:"🧘",paragraphs:["What it means: Managing your reaction before it becomes your behaviour.","Why it matters: Managers are still human, but the role requires control. A few careless words can damage trust quickly.","Practical advice:","• Do not respond instantly when angry","• Take a breath before speaking","• Ask yourself what outcome you want","• Avoid sarcasm or public embarrassment","• Come back to the conversation if needed","The question is not 'am I right to be frustrated?' The better question is: 'Will my reaction help or damage the outcome?'"],tip:"Feel it, but do not let it lead you."},
};

/* ═══════════════════════════════════════════════════════════════════
   HOW TO FIX — problem-based action data
   Keys structured for easy linking from Insights later
   ═══════════════════════════════════════════════════════════════════ */
const FIX_DATA={
  "gp-low":{title:"GP% Too Low",icon:"📉",color:"#FF6347",
    what:"Your Gross Profit percentage is below target. Too much revenue is going to food and beverage costs.",
    causes:["Supplier prices increased, menu prices not adjusted","Portion sizes too large or inconsistent","Waste too high — food in the bin, not on plates","Too many low-margin items selling in high volume","Recipes not followed — staff freestyling portions"],
    checks:["Compare this week's GP% to last 4 weeks","Check margins on top 10 selling items","Review recent supplier invoices for price jumps","Check waste logs for past 2 weeks","Watch a service — is portion control being followed?"],
    actions:["Increase prices on low-margin high-volume items","Standardise recipes with photos and exact quantities","Reduce over-generous portion sizes","Renegotiate or compare supplier prices","Remove or redesign dishes with GP below 60%"],
    tip:"Fix GP% first. Every other number in your P&L depends on it."},
  "cogs-high":{title:"COGS Too High",icon:"📦",color:"#FF6347",
    what:"Your Cost of Goods Sold is above target. You're using more stock than you should relative to sales.",
    causes:["Over-ordering — buying more than you sell","Poor stock rotation — FIFO not followed, stock expiring","Portion control issues","Theft or unrecorded usage","Inaccurate stock counts"],
    checks:["Compare COGS% to your KPI target","Check for expired stock this week","Review delivery quantities vs actual sales","Audit closing stock count accuracy","Check for unrecorded usage (staff meals, tastings)"],
    actions:["Reduce order quantities to match demand","Implement strict FIFO in all storage","Retrain on portion sizes with recipe cards","Introduce mid-week spot-checks","Record all non-sale usage"],
    tip:"COGS and GP% are two sides of the same coin. Fix COGS and GP% improves automatically."},
  "labour-high":{title:"Labour Too High",icon:"👥",color:"#FF6347",
    what:"Labour cost as a percentage of revenue is above target. Too much being spent on staff relative to sales.",
    causes:["Overstaffing during quiet periods","Too much agency/temp staff (higher cost)","Overtime not controlled","Rota doesn't match demand patterns","Revenue dropped but staffing didn't adjust"],
    checks:["Review RPLH — is each hour productive?","Compare rota hours to sales by day of week","Check agency spend as % of total labour","Check overtime hours — planned or reactive?","Compare labour% to previous months"],
    actions:["Redesign rotas based on sales patterns, not habit","Set max hours per day based on expected revenue","Reduce agency — recruit permanent staff","Cross-train staff so fewer cover more roles","Stagger start times"],
    tip:"Don't cut hours blindly. Understaffing kills service, kills revenue, makes labour% worse. Match staff to demand."},
  "waste-high":{title:"Waste Too High",icon:"🗑️",color:"#FF6347",
    what:"Too much food or drink going in the bin. This is money being thrown away.",
    causes:["Over-prepping — making more than you sell","Poor stock rotation — items expiring","Kitchen mistakes — wrong orders, burnt food","Over-ordering — too much stock arriving","Short shelf-life items not selling fast enough"],
    checks:["Review daily waste log — what's thrown away most?","Check prep quantities vs actual sales","Look at expiry-related waste","Review ordering vs actual usage","Check kitchen error rate — how many remakes?"],
    actions:["Reduce prep quantities based on actual sales data","Implement strict FIFO in all fridges and storage","Add a daily waste log reviewed every morning","Order little and often for fresh items","Remove or redesign menu items that generate waste"],
    tip:"Start with prep quantities — that's usually where the biggest waste comes from."},
  "sales-low":{title:"Sales Too Low",icon:"💷",color:"#F5A623",
    what:"Revenue is below target. Either not enough customers or each customer is spending too little.",
    causes:["Fewer customers coming in","Lower spend per head","Poor upselling by the team","Menu pricing too low","No marketing driving new customers","External factors (weather, competition)"],
    checks:["Compare covers week on week — is footfall down?","Check average spend per head","Review Google/TripAdvisor reviews","Look at marketing activity — enough?","Check competitor activity"],
    actions:["Train team on suggestive selling (drinks, sides, desserts)","Review and increase menu prices where possible","Launch a promotion to drive footfall","Improve social media presence","Make high-margin items prominent on menu","Introduce a loyalty scheme"],
    tip:"Revenue = customers × spend per head. Work on both."},
  "comps-high":{title:"Comps Too High",icon:"🎁",color:"#F5A623",
    what:"Too many free items being given away. Uncontrolled comps drain profit.",
    causes:["No comp policy — staff give away without guidelines","Too many complaints needing compensation","Managers too generous with VIPs or friends","Staff giving freebies to their own friends","Comps not being recorded"],
    checks:["Review comp log — what's given away and why?","Check comp value as % of revenue","Look for patterns — specific staff, shifts, days","Compare complaint rate to comp rate","Check if all comps are recorded in POS"],
    actions:["Set weekly comp budget (1–2% of revenue max)","Require a reason in POS for every comp","Train managers on when comps are appropriate","Fix root causes of complaints","Tighten the comp policy"],
    tip:"A smart comp saves a customer. A lazy comp just costs you money. Know the difference."},
  "breakage-high":{title:"Breakage Too High",icon:"💔",color:"#F5A623",
    what:"Too many glasses, plates, or equipment being broken. Costs add up and disrupt service.",
    causes:["Rushing during busy service","Poor handling training","Overcrowded storage — stacking too high","Wrong equipment for the job","Understaffing causing pressure"],
    checks:["Review breakage log — when does it peak?","Compare breakage to busy periods","Check storage areas — items stored safely?","Look at specific stations — one area worse?","Check equipment condition"],
    actions:["Train team on proper handling","Improve storage — use racks, don't overstack","Replace worn equipment before it causes breakage","Review staffing during peak times","Introduce breakage awareness — visibility reduces carelessness"],
    tip:"If breakage spikes during busy service, fix the system, not the people."},
  "ebitda-low":{title:"EBITDA Too Low",icon:"🎯",color:"#FF6347",
    what:"Operational profit is below target. The business isn't generating enough from core operations.",
    causes:["GP% too low — the foundation is weak","Labour too high relative to revenue","Overheads crept up without review","Revenue flat while costs increase","Multiple small issues compounding"],
    checks:["Review GP% first — is it healthy?","Check labour% — within target?","Review overhead trends","Compare EBITDA month on month","Look at revenue trend"],
    actions:["Fix GP% first — biggest impact","Optimise labour to match demand","Renegotiate overhead contracts","Focus on revenue growth with existing capacity","Review every P&L line for waste"],
    tip:"EBITDA is the sum of everything. Find the ONE biggest problem and fix that first."},
  "net-profit-low":{title:"Net Profit Too Low",icon:"💰",color:"#FF6347",
    what:"The bottom line is below target. After paying for everything, not enough is left.",
    causes:["GP% below target (most common root cause)","Labour costs too high","Overheads increased without revenue growth","Heavy borrowing or recent investment costs","Revenue not growing while costs are"],
    checks:["Review full P&L line by line — biggest gap vs target?","Is the problem GP%, Labour, Overheads, or below-the-line?","Compare net profit month on month","Check if one cost area is dragging everything down","Review revenue per available seat/hour"],
    actions:["Find the single biggest cost gap and focus there","GP% issue → fix pricing, portions, waste","Labour issue → redesign rotas, reduce agency","Overheads → renegotiate contracts, cut unnecessary spend","Revenue → invest in marketing, upselling, customer experience"],
    tip:"Net profit below 5% means almost no buffer. One bad month wipes out a quarter. Act fast."},
};

const FIX_LIST=[
  {id:"gp-low",label:"GP% too low"},
  {id:"cogs-high",label:"COGS too high"},
  {id:"labour-high",label:"Labour too high"},
  {id:"waste-high",label:"Waste too high"},
  {id:"sales-low",label:"Sales too low"},
  {id:"comps-high",label:"Comps too high"},
  {id:"breakage-high",label:"Breakage too high"},
  {id:"ebitda-low",label:"EBITDA too low"},
  {id:"net-profit-low",label:"Net Profit too low"},
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function Page({children,onBack,backLabel}){return(<div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans',sans-serif",maxWidth:480,margin:"0 auto",padding:"12px 20px 48px"}}>{onBack&&<button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.accent,fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",padding:"10px 0",fontWeight:500}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>{backLabel||"Back"}</button>}{children}</div>)}
function Ttl({text,sub}){return(<div style={{marginBottom:24,marginTop:6}}><h1 style={{fontSize:24,fontWeight:700,margin:0,letterSpacing:-0.4,lineHeight:1.25}}>{text}</h1>{sub&&<p style={{fontSize:13,color:C.sub,margin:"6px 0 0",lineHeight:1.45}}>{sub}</p>}</div>)}
function TapInput({label,value,onChange,onTap,hint}){return(<div style={{marginBottom:14}}><button onClick={onTap} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",padding:"0 0 6px",cursor:"pointer"}}><span style={{fontSize:12,color:C.accent,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",textDecorationColor:C.accent+"44",textUnderlineOffset:3}}>{label}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></button>{hint&&<div style={{fontSize:10,color:C.info,marginBottom:4,fontStyle:"italic"}}>{hint}</div>}<div style={{position:"relative"}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.dim,fontSize:15,fontWeight:600}}>£</span><input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={value} onChange={e=>{const v=e.target.value;if(v===""||/^[0-9]*\.?[0-9]*$/.test(v))onChange(v)}} placeholder="0" style={{width:"100%",padding:"13px 14px 13px 30px",background:C.bg,border:`1px solid ${hint?C.info+"44":C.border}`,borderRadius:12,color:C.text,fontSize:16,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"}} onFocus={e=>{e.target.style.borderColor=C.accent}} onBlur={e=>{e.target.style.borderColor=hint?C.info+"44":C.border}}/></div></div>)}
function BL({label,value,pctLabel,color,onTap}){const cl=color||C.accent;return(<div onClick={onTap} style={{background:`linear-gradient(135deg,${cl}08,${cl}03)`,border:`1px solid ${cl}22`,borderRadius:16,padding:"20px 22px",marginBottom:12,cursor:onTap?"pointer":"default"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:12,color:C.accent,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",textDecoration:onTap?"underline":"none",textDecorationColor:C.accent+"44",textUnderlineOffset:3}}>{label}</span>{onTap&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>}</div><div style={{display:"flex",alignItems:"baseline",gap:12,justifyContent:"center"}}><span style={{fontSize:36,fontWeight:700,color:cl,fontFamily:"'JetBrains Mono',monospace",letterSpacing:-1}}>{value}</span>{pctLabel&&<span style={{fontSize:18,fontWeight:600,color:cl,opacity:0.7,fontFamily:"'JetBrains Mono',monospace"}}>{pctLabel}</span>}</div></div>)}
function Ins({type,title,text}){const g={warning:{c:C.warn,bg:C.warnDim,i:"⚠"},success:{c:C.accent,bg:C.accentDim,i:"✓"},info:{c:C.info,bg:C.infoDim,i:"i"},caution:{c:C.caution,bg:C.cautionDim,i:"!"}}[type]||{c:C.info,bg:C.infoDim,i:"i"};return(<div style={{background:g.bg,borderLeft:`3px solid ${g.c}`,borderRadius:"0 12px 12px 0",padding:"13px 16px",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:g.c,marginBottom:3}}>{g.i} {title}</div><div style={{fontSize:13,color:C.sub,lineHeight:1.55}}>{text}</div></div>)}
function Act({text}){return(<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.accentDim,borderRadius:10,marginBottom:6}}><div style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0}}/><span style={{fontSize:13,color:C.text}}>{text}</span></div>)}
function Dv(){return(<div style={{height:1,background:C.border,margin:"20px 0"}}/>)}
function SD({label}){return(<div style={{display:"flex",alignItems:"center",gap:10,margin:"22px 0 14px"}}><div style={{height:1,flex:1,background:C.border}}/><span style={{fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:1}}>{label}</span><div style={{height:1,flex:1,background:C.border}}/></div>)}
function CR({label,value,pctVal,color,bold,border,onTap}){const cl=color||C.text;const bd=border!==false;return(<div onClick={onTap} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:bold?"12px 0":"9px 0",borderBottom:bd?`1px solid ${C.border}`:"none",cursor:onTap?"pointer":"default"}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:bold?14:13,fontWeight:bold?700:400,color:bold?cl:C.sub}}>{label}</span>{onTap&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>}</div><div style={{textAlign:"right",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:bold?15:14,fontWeight:bold?700:500,fontFamily:"'JetBrains Mono',monospace",color:bold?cl:C.text}}>{fmt(value)}</span>{pctVal!==undefined&&<span style={{fontSize:11,color:C.dim,minWidth:42,textAlign:"right"}}>{pct(pctVal)}</span>}</div></div>)}
function NB({icon,label,desc,onClick,delay}){return(<button onClick={onClick} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,marginBottom:8,cursor:"pointer",textAlign:"left",boxSizing:"border-box",transition:"all 0.2s",animation:`fadeUp 0.4s ease ${delay||0}s both`}} onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceUp}} onMouseLeave={e=>{e.currentTarget.style.background=C.surface}}><div style={{fontSize:26,width:46,height:46,borderRadius:13,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:600,color:C.text}}>{label}</div><div style={{fontSize:12,color:C.dim,marginTop:2}}>{desc}</div></div><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg></button>)}
function StartAgainBtn({onReset}){const[c,sC]=useState(false);if(c){return(<div style={{display:"flex",gap:8,marginTop:20}}><button onClick={()=>{onReset();sC(false)}} style={{flex:1,padding:"12px",background:C.warnDim,border:`1px solid ${C.warn}44`,borderRadius:12,color:C.warn,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Yes, clear all</button><button onClick={()=>sC(false)} style={{flex:1,padding:"12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.sub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button></div>)}return(<button onClick={()=>sC(true)} style={{width:"100%",padding:"12px",background:"none",border:`1px solid ${C.warn}33`,borderRadius:12,color:C.warn,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:20,fontFamily:"'DM Sans',sans-serif"}}>🔄 Start Again</button>)}
function HowCalc({onTap}){return(<button onClick={onTap} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 18px",background:C.infoDim,border:`1px solid ${C.info}22`,borderRadius:14,cursor:"pointer",marginTop:16,marginBottom:4}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.info} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg><span style={{fontSize:14,fontWeight:600,color:C.info,fontFamily:"'DM Sans',sans-serif"}}>How is it calculated?</span></button>)}
function ExplainPage({id,onBack}){const d=EX[id];if(!d)return(<Page onBack={onBack}><Ttl text="Not found"/></Page>);return(<Page onBack={onBack}><div style={{fontSize:48,marginBottom:6}}>{d.icon}</div><Ttl text={d.title}/>{d.paragraphs.map((p,i)=>(<p key={i} style={{fontSize:14,color:C.text,lineHeight:1.7,marginBottom:14,opacity:0.88,animation:`fadeUp 0.35s ease ${i*0.05}s both`}}>{p}</p>))}{d.tip&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"16px 18px",marginTop:12}}><div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Pro Tip</div><div style={{fontSize:13,color:C.text,lineHeight:1.6,opacity:0.85}}>{d.tip}</div></div>}</Page>)}
function vsTarget(actual,target,higher){if(!target||target==="")return null;const t=parseFloat(target),a=parseFloat(actual);if(isNaN(t))return null;return{ok:higher?(a>=t):(a<=t),target:t,diff:Math.abs(a-t)}}
function TargetIns({label,actual,target,higher}){const r=vsTarget(actual,target,higher);if(!r)return null;return r.ok?(<Ins type="success" title={`${label} — on target`} text={`${label} is ${pct(actual)}. Your target is ${pct(r.target)}. You're ${pct(r.diff)} better than your target.`}/>):(<Ins type="warning" title={`${label} — off target`} text={`${label} is ${pct(actual)}. Your target is ${pct(r.target)}. You're ${pct(r.diff)} ${higher?"below":"above"} your target.`}/>)}

function KPIInput({label,field,value,onChange,onBlur}){return(<div style={{marginBottom:12}}><div style={{fontSize:12,color:C.purple,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",marginBottom:6}}>{label}</div><div style={{position:"relative"}}><span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:C.dim,fontSize:14,fontWeight:600}}>%</span><input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={value} onChange={e=>{const v=e.target.value;if(v===""||/^[0-9]*\.?[0-9]*$/.test(v))onChange(field,v)}} onBlur={onBlur} placeholder="0" style={{width:"100%",padding:"12px 36px 12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:16,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"}} onFocus={e=>{e.target.style.borderColor=C.purple}}/></div></div>)}

/* ═══════════════════════════════════════════════════════════════════
   SHARED STATE HELPERS — auto-fill extension
   ═══════════════════════════════════════════════════════════════════ */
// Returns the effective value: local override if set, otherwise shared fallback.
// Key distinction: undefined/null = no local data yet (use shared).
//                  "" = user actively cleared the field (respect it).
function useSharedField(localVal, sharedVal) {
  const hasLocal = localVal !== undefined && localVal !== null;
  const shared = sharedVal || "";
  if (hasLocal) {
    // User has entered or cleared this field — respect it
    return { val: localVal, isAuto: false };
  }
  // No local value exists at all — use shared if available
  if (shared) {
    return { val: shared, isAuto: true };
  }
  return { val: "", isAuto: false };
}

// Determines hint text for auto-filled fields
function autoHint(isAuto, source) {
  return isAuto ? `Auto-filled from ${source}` : undefined;
}

/* ═══════════════════════════════════════════════════════════════════
   KPI
   ═══════════════════════════════════════════════════════════════════ */
function KPIPage({onBack,nav,kpis,setKpis}){
  const[local,setLocal]=useState(kpis);
  useEffect(()=>{setLocal(kpis)},[kpis]);
  const setL=useCallback((k,v)=>setLocal(prev=>({...prev,[k]:v})),[]);
  const localRef=useRef(local);localRef.current=local;
  const sync=useCallback(()=>setKpis(localRef.current),[setKpis]);
  return(<Page onBack={()=>{sync();onBack()}} backLabel="Back"><div style={{fontSize:48,marginBottom:6}}>🎯</div><Ttl text="KPI Targets" sub="Set your targets. Results will be measured against these."/><button onClick={()=>nav("explain:kpi-info")} style={{display:"flex",alignItems:"center",gap:6,background:C.purpleDim,border:`1px solid ${C.purple}22`,borderRadius:10,padding:"10px 14px",marginBottom:20,cursor:"pointer",width:"100%"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span style={{fontSize:13,color:C.purple,fontWeight:500}}>What are KPI targets?</span></button>
    <SD label="Cost Control"/><KPIInput label="Max COGS %" field="cogs" value={local.cogs||""} onChange={setL} onBlur={sync}/><KPIInput label="Min GP %" field="gp" value={local.gp||""} onChange={setL} onBlur={sync}/>
    <SD label="Losses"/><KPIInput label="Max Waste %" field="waste" value={local.waste||""} onChange={setL} onBlur={sync}/><KPIInput label="Max Breakage %" field="breakage" value={local.breakage||""} onChange={setL} onBlur={sync}/><KPIInput label="Max Comps %" field="comps" value={local.comps||""} onChange={setL} onBlur={sync}/><KPIInput label="Max Total Losses %" field="totalLosses" value={local.totalLosses||""} onChange={setL} onBlur={sync}/>
    <SD label="Labour & Overheads"/><KPIInput label="Max Labour %" field="labour" value={local.labour||""} onChange={setL} onBlur={sync}/><KPIInput label="Max Overheads %" field="overheads" value={local.overheads||""} onChange={setL} onBlur={sync}/>
    <SD label="Profitability"/><KPIInput label="Min EBITDA %" field="ebitda" value={local.ebitda||""} onChange={setL} onBlur={sync}/><KPIInput label="Min Net Profit %" field="netProfit" value={local.netProfit||""} onChange={setL} onBlur={sync}/>
    <SD label="Investment"/><KPIInput label="Max CAPEX %" field="capex" value={local.capex||""} onChange={setL} onBlur={sync}/>
    <StartAgainBtn onReset={()=>{setLocal({});setKpis({})}}/>
    {Object.values(local).some(v=>v&&v!=="")&&<React.Fragment><Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Your Targets</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}>{[["Max COGS",local.cogs],["Min GP",local.gp],["Max Waste",local.waste],["Max Breakage",local.breakage],["Max Comps",local.comps],["Max Losses",local.totalLosses],["Max Labour",local.labour],["Max Overheads",local.overheads],["Min EBITDA",local.ebitda],["Min Net Profit",local.netProfit],["Max CAPEX",local.capex]].filter(([,v])=>v&&v!=="").map(([l,v],i,a)=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<a.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:13,color:C.sub}}>{l}</span><span style={{fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:C.purple}}>{v}%</span></div>))}</div></React.Fragment>}
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   HOME
   ═══════════════════════════════════════════════════════════════════ */
function Home({nav}){return(<Page><div style={{textAlign:"center",padding:"36px 0 6px"}}><div style={{width:60,height:60,borderRadius:17,margin:"0 auto 16px",background:`linear-gradient(135deg,${C.accent},#00A889)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 28px ${C.accentGlow}`}}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 8v4l3 3"/></svg></div><h1 style={{fontSize:30,fontWeight:800,margin:0,letterSpacing:-0.8,fontFamily:"'Playfair Display',serif"}}>OpsInsight</h1><p style={{fontSize:13,color:C.sub,margin:"8px auto 0",lineHeight:1.45,maxWidth:240}}>Understand your numbers.<br/>Improve your business.</p></div><div style={{marginTop:24}}><NB icon="🚀" label="Start Here" desc="New to finance? Learn step by step" onClick={()=>nav("starthere")} delay={0.02}/></div><div style={{marginTop:12}}>
    <NB icon="🎯" label="KPI Targets" desc="Set your performance targets" onClick={()=>nav("kpi")} delay={0.04}/>
    <NB icon="📦" label="Cost of Goods Sold (COGS)" desc="Know your true stock usage" onClick={()=>nav("cogs")} delay={0.08}/>
    <NB icon="📈" label="Gross Profit (GP%)" desc="Measure your profitability" onClick={()=>nav("gp")} delay={0.12}/>
    <NB icon="📑" label="P&L Breakdown" desc="Full financial picture" onClick={()=>nav("pnl")} delay={0.16}/>
    <NB icon="🗑️" label="Waste, Breakage & Comps" desc="Find your hidden costs" onClick={()=>nav("waste")} delay={0.20}/>
    <NB icon="🎯" label="EBITDA (Monthly)" desc="Operational performance" onClick={()=>nav("ebitda")} delay={0.24}/>
    <NB icon="🏗️" label="CAPEX" desc="Capital investments" onClick={()=>nav("capex")} delay={0.28}/>
    <NB icon="🧠" label="Insights" desc="How you're performing against your targets" onClick={()=>nav("insights")} delay={0.32}/>
    <NB icon="🔧" label="How to Fix" desc="My number is bad — what do I do?" onClick={()=>nav("howtofix")} delay={0.36}/>
  </div><div style={{marginTop:28}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{height:1,flex:1,background:C.border}}/><span style={{fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:1}}>Tools & Learning</span><div style={{height:1,flex:1,background:C.border}}/></div><NB icon="📖" label="Abbreviations (Ops Language)" desc="Common hospitality terms explained" onClick={()=>nav("abbreviations")} delay={0.40}/><NB icon="🧭" label="Leadership Tips" desc="Practical advice for managers" onClick={()=>nav("leadership")} delay={0.44}/><NB icon="💬" label="Send Feedback" desc="Help us improve OpsInsight" onClick={()=>nav("feedback")} delay={0.48}/></div><div style={{textAlign:"center",marginTop:24,fontSize:11,color:C.dim}}>Built for hospitality teams</div><div style={{textAlign:"center",marginTop:6,fontSize:10,color:C.dim,opacity:0.5}}>OpsInsight v1.0 • We do not sell your data</div></Page>)}

/* ═══════════════════════════════════════════════════════════════════
   ABBREVIATIONS PAGE
   ═══════════════════════════════════════════════════════════════════ */
const ABBR_LIST=[
  {cat:"Core Financial",items:[
    {id:"abbr-cogs",abbr:"COGS",full:"Cost of Goods Sold"},
    {id:"abbr-cos",abbr:"COS",full:"Cost of Sales"},
    {id:"abbr-gp",abbr:"GP%",full:"Gross Profit Percentage"},
    {id:"abbr-pnl",abbr:"P&L",full:"Profit & Loss Statement"},
    {id:"abbr-ebitda",abbr:"EBITDA",full:"Earnings Before Interest, Tax, Depreciation & Amortisation"},
    {id:"abbr-capex",abbr:"CAPEX",full:"Capital Expenditure"},
    {id:"abbr-lc",abbr:"LC",full:"Labour Cost"},
  ]},
  {cat:"Performance Metrics",items:[
    {id:"abbr-rplh",abbr:"RPLH",full:"Revenue per Labour Hour"},
    {id:"abbr-asph",abbr:"ASPH",full:"Average Sales per Hour"},
    {id:"abbr-sph",abbr:"SPH",full:"Sales per Hour"},
    {id:"abbr-spend-per-head",abbr:"Spend/Head",full:"Spend per Head (Average Customer Spend)"},
    {id:"abbr-aov",abbr:"AOV / ATV",full:"Average Order / Transaction Value"},
  ]},
  {cat:"Operations",items:[
    {id:"abbr-upt",abbr:"UPT",full:"Units per Transaction"},
    {id:"abbr-oos",abbr:"OOS",full:"Out of Stock"},
    {id:"abbr-86",abbr:"86",full:"Item Not Available"},
    {id:"abbr-85",abbr:"85",full:"Running Low"},
  ]},
];

function AbbreviationsPage({onBack,nav}){
  return(<Page onBack={onBack} backLabel="Back">
    <div style={{fontSize:48,marginBottom:6}}>📖</div>
    <Ttl text="Abbreviations (Ops Language)" sub="Common hospitality terms explained. Tap any to learn more."/>
    {ABBR_LIST.map(section=>(
      <React.Fragment key={section.cat}>
        <SD label={section.cat}/>
        {section.items.map((item,i)=>(
          <button key={item.id} onClick={()=>nav("explain:"+item.id)} style={{
            width:"100%",display:"flex",alignItems:"center",gap:12,
            padding:"14px 16px",background:C.surface,border:`1px solid ${C.border}`,
            borderRadius:14,marginBottom:6,cursor:"pointer",textAlign:"left",
            boxSizing:"border-box",transition:"all 0.2s",
            animation:`fadeUp 0.3s ease ${i*0.04}s both`,
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceUp;e.currentTarget.style.borderColor=C.borderL}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border}}>
            <span style={{fontSize:15,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace",minWidth:60}}>{item.abbr}</span>
            <span style={{fontSize:13,color:C.sub,flex:1}}>{item.full}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        ))}
      </React.Fragment>
    ))}
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   LEADERSHIP TIPS PAGE
   ═══════════════════════════════════════════════════════════════════ */
const LEAD_LIST=[
  {id:"lead-pressure",icon:"🔥",label:"Managing Pressure",desc:"Stay calm when it matters most"},
  {id:"lead-communication",icon:"💬",label:"Communication",desc:"Say what you mean, clearly and respectfully"},
  {id:"lead-feedback",icon:"📋",label:"Giving Feedback",desc:"Correct without damaging trust"},
  {id:"lead-ownership",icon:"🏆",label:"Taking Ownership",desc:"Act at the level you want to grow into"},
  {id:"lead-self-investment",icon:"📚",label:"Self-Investment",desc:"Take charge of your own development"},
  {id:"lead-emotional-control",icon:"🧘",label:"Emotional Control",desc:"Feel it, but don't let it lead you"},
];

function LeadershipPage({onBack,nav}){
  return(<Page onBack={onBack} backLabel="Back">
    <div style={{fontSize:48,marginBottom:6}}>🧭</div>
    <Ttl text="Leadership Tips" sub="Practical advice for hospitality managers. Tap any topic to learn more."/>
    {LEAD_LIST.map((item,i)=>(
      <button key={item.id} onClick={()=>nav("explain:"+item.id)} style={{
        width:"100%",display:"flex",alignItems:"center",gap:12,
        padding:"16px 16px",background:C.surface,border:`1px solid ${C.border}`,
        borderRadius:14,marginBottom:6,cursor:"pointer",textAlign:"left",
        boxSizing:"border-box",transition:"all 0.2s",
        animation:`fadeUp 0.3s ease ${i*0.05}s both`,
      }}
      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceUp;e.currentTarget.style.borderColor=C.borderL}}
      onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border}}>
        <span style={{fontSize:24}}>{item.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600,color:C.text}}>{item.label}</div>
          <div style={{fontSize:12,color:C.dim,marginTop:2}}>{item.desc}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    ))}
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   START HERE PAGE
   ═══════════════════════════════════════════════════════════════════ */
const START_STEPS=[
  {n:1,title:"Revenue (Sales)",desc:"Start by understanding the money coming into the business.",meaning:"Revenue is your Net Sales excluding VAT for the period you are reviewing.",action:"Go to COGS or GP% and enter Revenue (Sales).",to:"gp"},
  {n:2,title:"Cost of Goods Sold (COGS)",desc:"Learn what stock the business actually used.",meaning:"COGS shows the cost of food and drink used to generate sales.",action:"Open COGS and learn Opening Stock, Purchases, and Closing Stock.",to:"cogs"},
  {n:3,title:"Gross Profit (GP%)",desc:"Once you understand Revenue and COGS, learn GP%.",meaning:"GP% shows how much money is left after paying for food and drink costs.",action:"Open Gross Profit and check how Revenue and COGS connect.",to:"gp"},
  {n:4,title:"Waste, Breakage & Comps",desc:"Learn where profit leaks from the business.",meaning:"Waste, breakage and comps are costs that reduce performance without always being obvious.",action:"Track them weekly and compare them to Net Revenue.",to:"waste"},
  {n:5,title:"Labour",desc:"Learn how team cost affects the business.",meaning:"Labour cost shows how much is spent on the team compared to sales.",action:"Use the P&L page to review wages, NI, pension, agency and labour %.",to:"pnl"},
  {n:6,title:"P&L Breakdown",desc:"Now look at the full business picture.",meaning:"The P&L shows Revenue, Cost of Sales, Labour, Overheads and Net Profit.",action:"Read the P&L from top to bottom like a waterfall.",to:"pnl"},
  {n:7,title:"KPI Targets",desc:"Once you understand the numbers, set your targets.",meaning:"Targets help you know if performance is good or off track.",action:"Set realistic targets for GP%, COGS, labour, waste and profit.",to:"kpi"},
  {n:8,title:"Insights",desc:"Compare actual performance against your own KPI targets.",meaning:"Insights tells you what needs attention first.",action:"Check Insights after entering your figures.",to:"insights"},
  {n:9,title:"How to Fix",desc:"Once you know what is off target, learn what to do about it.",meaning:"How to Fix gives practical actions for common problems like GP% too low, labour too high or waste too high.",action:"Open the problem that matches your result and follow the checks.",to:"howtofix"},
];

function StartHerePage({onBack,nav}){
  return(<Page onBack={onBack} backLabel="Back">
    <div style={{fontSize:48,marginBottom:6}}>🚀</div>
    <Ttl text="Start Here"/>

    <div style={{background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"16px 18px",marginBottom:20}}>
      <div style={{fontSize:13,color:C.text,lineHeight:1.6,opacity:0.9}}>New to hospitality finance? Start with one section at a time. You do not need to understand the full P&L on day one. Learn the numbers in the same order the business works.</div>
      <div style={{fontSize:12,color:C.accent,lineHeight:1.5,marginTop:10,fontWeight:600}}>Best learning order: Revenue → COGS → GP% → Waste → Labour → P&L → KPI Targets → Insights → How to Fix</div>
    </div>

    {START_STEPS.map((s,i)=>(
      <button key={s.n} onClick={()=>nav(s.to)} style={{
        width:"100%",display:"flex",alignItems:"flex-start",gap:12,
        padding:"16px 16px",background:C.surface,border:`1px solid ${C.border}`,
        borderRadius:14,marginBottom:8,cursor:"pointer",textAlign:"left",
        boxSizing:"border-box",transition:"all 0.2s",
        animation:`fadeUp 0.3s ease ${i*0.04}s both`,
      }}
      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceUp;e.currentTarget.style.borderColor=C.borderL}}
      onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border}}>
        <div style={{width:32,height:32,borderRadius:10,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
          <span style={{fontSize:14,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{s.n}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>{s.title}</div>
          <div style={{fontSize:12,color:C.sub,marginTop:3,lineHeight:1.4}}>{s.desc}</div>
          <div style={{fontSize:11,color:C.dim,marginTop:4,lineHeight:1.4,fontStyle:"italic"}}>{s.meaning}</div>
          <div style={{fontSize:11,color:C.accent,marginTop:4,opacity:0.8}}>→ {s.action}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:6}}><path d="M9 18l6-6-6-6"/></svg>
      </button>
    ))}

    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginTop:12}}>
      <div style={{fontSize:13,color:C.text,lineHeight:1.6,opacity:0.85}}>If you are new, do not start with the full P&L. Start with Revenue, COGS and GP%. Once those make sense, the rest becomes much easier.</div>
      <div style={{fontSize:12,color:C.sub,lineHeight:1.5,marginTop:8}}>Do not try to learn everything in one day. Learn one number, practise it, then move to the next.</div>
    </div>
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   FEEDBACK PAGE
   Email target: appOpsInsight@gmail.com (hidden from user)
   Ready to wire to EmailJS / Formspree / serverless endpoint
   ═══════════════════════════════════════════════════════════════════ */
const FEEDBACK_EMAIL="appOpsInsight@gmail.com";
// ── EMAIL SERVICE CONFIG ──
// Option 1: Set your Formspree form ID (free at formspree.io)
//   1. Go to formspree.io, sign up free
//   2. Create a form, point it to appOpsInsight@gmail.com
//   3. Copy the form ID (e.g. "xpzvqkdl")
//   4. Paste it below
const FORMSPREE_ID="xyklaydy";

function FeedbackPage({onBack}){
  const[name,setName]=useState("");
  const[role,setRole]=useState("");
  const[rating,setRating]=useState(0);
  const[message,setMessage]=useState("");
  const[sent,setSent]=useState(false);
  const[sending,setSending]=useState(false);
  const[error,setError]=useState("");

  const canSend=message.trim().length>5;

  const handleSubmit=async()=>{
    if(!canSend)return;
    setSending(true);
    setError("");

    const body=`Name: ${name||"Anonymous"}\nRole: ${role||"Not specified"}\nRating: ${rating||"Not rated"}/5\n\nFeedback:\n${message.trim()}\n\nSent: ${new Date().toLocaleString()}\nApp: OpsInsight`;

    // Try Formspree if configured
    if(FORMSPREE_ID){
      try{
        const res=await fetch(`https://formspree.io/f/${FORMSPREE_ID}`,{
          method:"POST",
          headers:{"Content-Type":"application/json","Accept":"application/json"},
          body:JSON.stringify({email:FEEDBACK_EMAIL,name:name||"Anonymous",message:body,_subject:"OpsInsight Feedback"})
        });
        if(res.ok){setSending(false);setSent(true);return}
        else{setError("Could not send. Opening email instead...");}}
      catch(e){setError("Could not send. Opening email instead...");}
    }

    // Fallback: open device email client
    const subject=encodeURIComponent("OpsInsight Feedback");
    const mailBody=encodeURIComponent(body);
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${mailBody}`,"_blank");
    setSending(false);
    setSent(true);
  };

  if(sent){
    return(<Page onBack={onBack} backLabel="Back">
      <div style={{textAlign:"center",padding:"60px 0 20px"}}>
        <div style={{fontSize:64,marginBottom:16}}>✅</div>
        <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 10px",color:C.accent}}>Thank you!</h2>
        <p style={{fontSize:14,color:C.sub,lineHeight:1.5,maxWidth:280,margin:"0 auto"}}>Your feedback has been received. It helps us make OpsInsight better for everyone.</p>
        <button onClick={onBack} style={{marginTop:28,padding:"12px 32px",background:C.accent,border:"none",borderRadius:12,color:C.bg,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Back to Home</button>
      </div>
    </Page>);
  }

  const inputStyle={width:"100%",padding:"12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:14};

  return(<Page onBack={onBack} backLabel="Back">
    <div style={{fontSize:48,marginBottom:6}}>💬</div>
    <Ttl text="Send Feedback" sub="Help us improve OpsInsight. All feedback is welcome — good or bad."/>

    <div style={{fontSize:12,color:C.sub,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",marginBottom:6}}>Your name (optional)</div>
    <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex" style={inputStyle} onFocus={e=>{e.target.style.borderColor=C.accent}} onBlur={e=>{e.target.style.borderColor=C.border}}/>

    <div style={{fontSize:12,color:C.sub,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",marginBottom:6}}>Your role (optional)</div>
    <input type="text" value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Assistant Manager, Head Chef" style={inputStyle} onFocus={e=>{e.target.style.borderColor=C.accent}} onBlur={e=>{e.target.style.borderColor=C.border}}/>

    <div style={{fontSize:12,color:C.sub,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",marginBottom:8}}>How useful is OpsInsight? (tap to rate)</div>
    <div style={{display:"flex",gap:8,marginBottom:18}}>
      {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>setRating(n)} style={{width:44,height:44,borderRadius:12,border:`1px solid ${n<=rating?C.accent:C.border}`,background:n<=rating?C.accentDim:C.surface,color:n<=rating?C.accent:C.dim,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all 0.15s"}}>{n}</button>))}
    </div>

    <div style={{fontSize:12,color:C.sub,fontWeight:600,letterSpacing:0.7,textTransform:"uppercase",marginBottom:6}}>Your feedback *</div>
    <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="What's working well? What could be better? What features would you like to see?" rows={5} style={{...inputStyle,resize:"vertical",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,marginBottom:6}} onFocus={e=>{e.target.style.borderColor=C.accent}} onBlur={e=>{e.target.style.borderColor=C.border}}/>
    <div style={{fontSize:11,color:C.dim,marginBottom:18}}>{message.trim().length<6?"Please write at least a few words.":"Ready to send."}</div>

    <button onClick={handleSubmit} disabled={!canSend||sending} style={{width:"100%",padding:"14px",background:canSend?C.accent:C.surface,border:`1px solid ${canSend?C.accent:C.border}`,borderRadius:12,color:canSend?C.bg:C.dim,fontSize:15,fontWeight:700,cursor:canSend?"pointer":"default",fontFamily:"'DM Sans',sans-serif",opacity:sending?0.6:1,transition:"all 0.2s"}}>{sending?"Sending...":"Send Feedback"}</button>
    {error&&<div style={{textAlign:"center",marginTop:8,fontSize:12,color:C.caution}}>{error}</div>}
    <div style={{textAlign:"center",marginTop:16,fontSize:11,color:C.dim}}>Your feedback goes directly to the OpsInsight team.</div>
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   HOW TO FIX PAGES
   ═══════════════════════════════════════════════════════════════════ */
function HowToFixPage({onBack,nav}){
  return(<Page onBack={onBack} backLabel="Back">
    <div style={{fontSize:48,marginBottom:6}}>🔧</div>
    <Ttl text="How to Fix" sub="My number is bad — what do I do? Tap a problem to see actions."/>
    {FIX_LIST.map((item,i)=>{const d=FIX_DATA[item.id];return(
      <button key={item.id} onClick={()=>nav("fix:"+item.id)} style={{
        width:"100%",display:"flex",alignItems:"center",gap:12,
        padding:"14px 16px",background:C.surface,border:`1px solid ${C.border}`,
        borderRadius:14,marginBottom:6,cursor:"pointer",textAlign:"left",
        boxSizing:"border-box",transition:"all 0.2s",
        animation:`fadeUp 0.3s ease ${i*0.04}s both`,
      }}
      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceUp;e.currentTarget.style.borderColor=C.borderL}}
      onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border}}>
        <span style={{fontSize:22}}>{d.icon}</span>
        <span style={{fontSize:14,fontWeight:600,color:d.color,flex:1}}>{d.title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    );})}
  </Page>);
}

function FixDetailPage({id,onBack}){
  const d=FIX_DATA[id];
  if(!d)return(<Page onBack={onBack}><Ttl text="Not found"/></Page>);
  const secStyle={fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10,marginTop:20};
  const cardStyle={background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`};
  const liStyle={fontSize:13,color:C.text,lineHeight:1.6,padding:"6px 0",borderBottom:`1px solid ${C.border}`};
  const lastLi={fontSize:13,color:C.text,lineHeight:1.6,padding:"6px 0"};
  return(<Page onBack={onBack}>
    <div style={{fontSize:48,marginBottom:6}}>{d.icon}</div>
    <Ttl text={d.title}/>
    <div style={{fontSize:14,color:C.text,lineHeight:1.6,opacity:0.9,marginBottom:8}}>{d.what}</div>

    <div style={secStyle}>Why it happens</div>
    <div style={cardStyle}>{d.causes.map((c,i)=>(<div key={i} style={i<d.causes.length-1?liStyle:lastLi}>• {c}</div>))}</div>

    <div style={secStyle}>What to check first</div>
    <div style={cardStyle}>{d.checks.map((c,i)=>(<div key={i} style={i<d.checks.length-1?liStyle:lastLi}>→ {c}</div>))}</div>

    <div style={secStyle}>How to fix it</div>
    <div style={cardStyle}>{d.actions.map((a,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 0",borderBottom:i<d.actions.length-1?`1px solid ${C.border}`:"none"}}><div style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:6}}/><span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{a}</span></div>))}</div>

    {d.tip&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"16px 18px",marginTop:20}}><div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Pro Tip</div><div style={{fontSize:13,color:C.text,lineHeight:1.6,opacity:0.85}}>{d.tip}</div></div>}
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   PAGES — with shared state auto-fill
   ═══════════════════════════════════════════════════════════════════ */
function COGSPage({onBack,nav,data,setData,kpis,shared,setShared}){
  const s=(k,v)=>{
    setData({...data,[k]:v});
    if(k==="rv"&&v)setShared(prev=>({...prev,revenue:v}));
  };
  const rv=useSharedField(data.rv,shared.revenue);
  const o=parseFloat(data.os)||0,p=parseFloat(data.pu)||0,cl=parseFloat(data.cs)||0,r=parseFloat(rv.val)||0;
  const cogs=o+p-cl,cogsPct=r>0?(cogs/r)*100:0,gp=r-cogs,gpPct=r>0?(gp/r)*100:0;
  const has=o>0||p>0;
  // Sync calculated COGS to shared
  useEffect(()=>{if(has&&cogs>0)setShared(prev=>({...prev,cogs:String(cogs)}))},[cogs,has]);
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="Cost of Goods Sold" sub="Tap any label to learn what it means"/>
    <TapInput label="Opening Stock" value={data.os||""} onChange={v=>s("os",v)} onTap={()=>nav("explain:opening-stock")}/>
    <TapInput label="Purchases" value={data.pu||""} onChange={v=>s("pu",v)} onTap={()=>nav("explain:purchases")}/>
    <TapInput label="Closing Stock" value={data.cs||""} onChange={v=>s("cs",v)} onTap={()=>nav("explain:closing-stock")}/>
    <TapInput label="Revenue (Sales)" value={rv.val} onChange={v=>s("rv",v)} onTap={()=>nav("explain:revenue-sales")} hint={autoHint(rv.isAuto,"another section")}/>
    {has&&cogs>=0&&<div style={{marginTop:20,animation:"fadeUp 0.3s ease"}}><BL label="Cost of Goods Sold" value={fmt(cogs)} pctLabel={r>0?pct(cogsPct):undefined} color={cogsPct>35?C.warn:C.accent} onTap={()=>nav("explain:cogs-result")}/>{r>0&&<BL label="Gross Profit" value={fmt(gp)} pctLabel={pct(gpPct)} color={gpPct<60?C.warn:gpPct<65?C.caution:C.accent} onTap={()=>nav("explain:gp-result")}/>}{r>0&&<TargetIns label="COGS" actual={cogsPct} target={kpis.cogs} higher={false}/>}{r>0&&!kpis.cogs&&cogsPct>35&&<Ins type="warning" title="High" text={`COGS ${pct(cogsPct)} above 35%.`}/>}{r>0&&!kpis.cogs&&cogsPct<=35&&<Ins type="success" title="Healthy" text={`COGS ${pct(cogsPct)}.`}/>}<Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Calculation</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}><CR label="Opening Stock" value={o}/><CR label="+ Purchases" value={p}/><CR label="− Closing Stock" value={cl}/><CR label="= Cost of Goods Sold" value={cogs} pctVal={r>0?cogsPct:undefined} color={cogsPct>35?C.warn:C.accent} bold onTap={()=>nav("explain:cogs-result")} border={r>0}/>{r>0&&<CR label="Revenue (Sales)" value={r}/>}{r>0&&<CR label="= Gross Profit" value={gp} pctVal={gpPct} color={gpPct<60?C.warn:C.accent} bold border={false} onTap={()=>nav("explain:gp-result")}/>}</div></div>}
    <HowCalc onTap={()=>nav("explain:how-cogs")}/>
    <StartAgainBtn onReset={()=>setData({rv:""})}/>
  </Page>);
}

function GPPage({onBack,nav,data,setData,kpis,shared,setShared}){
  const s=(k,v)=>{
    setData({...data,[k]:v});
    if(k==="rv"&&v)setShared(prev=>({...prev,revenue:v}));
  };
  const rv=useSharedField(data.rv,shared.revenue);
  const co=useSharedField(data.co,shared.cogs);
  const r=parseFloat(rv.val)||0,c=parseFloat(co.val)||0,gp=r-c,gpPct=r>0?(gp/r)*100:0,cPct=r>0?(c/r)*100:0;
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="Gross Profit (GP%)" sub="Tap any label to learn what it means"/>
    <TapInput label="Revenue (Sales)" value={rv.val} onChange={v=>s("rv",v)} onTap={()=>nav("explain:gp-revenue")} hint={autoHint(rv.isAuto,"COGS / P&L")}/>
    <TapInput label="Cost of Goods Sold" value={co.val} onChange={v=>s("co",v)} onTap={()=>nav("explain:gp-cogs")} hint={autoHint(co.isAuto,"COGS calculation")}/>
    {r>0&&<div style={{marginTop:20,animation:"fadeUp 0.3s ease"}}><BL label="Gross Profit" value={fmt(gp)} pctLabel={pct(gpPct)} color={gpPct<60?C.warn:gpPct<65?C.caution:C.accent} onTap={()=>nav("explain:gp-result")}/><TargetIns label="GP" actual={gpPct} target={kpis.gp} higher={true}/><Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Calculation</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}><CR label="Revenue (Sales)" value={r} pctVal={100}/><CR label="− Cost of Goods Sold" value={c} pctVal={cPct}/><CR label="= Gross Profit" value={gp} pctVal={gpPct} color={gpPct<60?C.warn:C.accent} bold border={false} onTap={()=>nav("explain:gp-result")}/></div></div>}
    <HowCalc onTap={()=>nav("explain:how-gp")}/>
    <StartAgainBtn onReset={()=>setData({rv:"",co:""})}/>
  </Page>);
}

function WastePage({onBack,nav,data,setData,kpis,shared,setShared}){
  const s=(k,v)=>{
    setData({...data,[k]:v});
    if(k==="rv"&&v)setShared(prev=>({...prev,revenue:v}));
  };
  const rv=useSharedField(data.rv,shared.revenue);
  const w=parseFloat(data.wa)||0,b=parseFloat(data.br)||0,co=parseFloat(data.cm)||0,r=parseFloat(rv.val)||0;
  const wP=r>0?(w/r)*100:0,bP=r>0?(b/r)*100:0,cP=r>0?(co/r)*100:0,tot=w+b+co,tP=r>0?(tot/r)*100:0;
  const has=w>0||b>0||co>0;
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="Waste, Breakage & Comps" sub="Tap any label to learn what it means"/>
    <TapInput label="Waste" value={data.wa||""} onChange={v=>s("wa",v)} onTap={()=>nav("explain:waste-waste")}/>
    <TapInput label="Breakage" value={data.br||""} onChange={v=>s("br",v)} onTap={()=>nav("explain:waste-breakage")}/>
    <TapInput label="Comps" value={data.cm||""} onChange={v=>s("cm",v)} onTap={()=>nav("explain:waste-comps")}/>
    <TapInput label="Revenue (Sales)" value={rv.val} onChange={v=>s("rv",v)} onTap={()=>nav("explain:waste-revenue")} hint={autoHint(rv.isAuto,"another section")}/>
    {has&&<div style={{marginTop:20,animation:"fadeUp 0.3s ease"}}><BL label="Total Losses" value={fmt(tot)} pctLabel={r>0?pct(tP):undefined} color={tP>8?C.warn:tP>5?C.caution:C.accent} onTap={()=>nav("explain:waste-result")}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>{[["Waste",w,wP,"🗑️"],["Breakage",b,bP,"💔"],["Comps",co,cP,"🎁"]].map(([l,v,p,i])=>(<div key={l} style={{background:C.surface,borderRadius:12,padding:"13px 8px",textAlign:"center",border:`1px solid ${C.border}`}}><div style={{fontSize:16,marginBottom:3}}>{i}</div><div style={{fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.text}}>{fmt(v)}</div>{r>0&&<div style={{fontSize:12,color:C.sub,marginTop:2}}>{pct(p)}</div>}</div>))}</div>{r>0&&<React.Fragment><TargetIns label="Waste" actual={wP} target={kpis.waste} higher={false}/><TargetIns label="Breakage" actual={bP} target={kpis.breakage} higher={false}/><TargetIns label="Comps" actual={cP} target={kpis.comps} higher={false}/><TargetIns label="Total Losses" actual={tP} target={kpis.totalLosses} higher={false}/></React.Fragment>}<Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Calculation</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}><CR label="Waste" value={w} pctVal={r>0?wP:undefined}/><CR label="+ Breakage" value={b} pctVal={r>0?bP:undefined}/><CR label="+ Comps" value={co} pctVal={r>0?cP:undefined}/><CR label="= Total Losses" value={tot} pctVal={r>0?tP:undefined} color={tP>8?C.warn:C.accent} bold onTap={()=>nav("explain:waste-result")} border={r>0}/>{r>0&&<CR label="Revenue" value={r}/>}{r>0&&<CR label="= After Losses" value={r-tot} pctVal={100-tP} bold border={false}/>}</div></div>}
    <HowCalc onTap={()=>nav("explain:how-waste")}/>
    <StartAgainBtn onReset={()=>setData({rv:""})}/>
  </Page>);
}

function PLPage({onBack,nav,data,setData,kpis,shared,setShared}){
  const s=(k,v)=>{
    setData({...data,[k]:v});
    if(k==="rev"&&v)setShared(prev=>({...prev,revenue:v}));
  };
  const rv=useSharedField(data.rev,shared.revenue);
  const R=parseFloat(rv.val)||0,vfc=parseFloat(data.fc)||0,vbc=parseFloat(data.bc)||0,voc=parseFloat(data.oc)||0;
  const vwg=parseFloat(data.wg)||0,vni=parseFloat(data.ni)||0,vag=parseFloat(data.ag)||0;
  const vrn=parseFloat(data.rn)||0,vut=parseFloat(data.ut)||0,vis=parseFloat(data.ins)||0,vmk=parseFloat(data.mk)||0,vrp=parseFloat(data.rp)||0,voh=parseFloat(data.oh)||0;
  const tCOS=vfc+vbc+voc,gp=R-tCOS,gpP=R>0?(gp/R)*100:0;
  const tLab=vwg+vni+vag,labP=R>0?(tLab/R)*100:0;
  const tOH=vrn+vut+vis+vmk+vrp+voh,ohP=R>0?(tOH/R)*100:0;
  const net=gp-tLab-tOH,netP=R>0?(net/R)*100:0;
  const has=R>0,hc=tCOS>0||tLab>0||tOH>0;
  // Sync P&L totals to shared
  useEffect(()=>{if(has&&hc)setShared(prev=>({...prev,totalCOS:String(tCOS),totalLabour:String(tLab),totalOverheads:String(tOH)}))},[tCOS,tLab,tOH,has,hc]);
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="P&L Breakdown" sub="Enter figures. Tap any label to learn what it means."/>
    <SD label="Revenue"/><TapInput label="Revenue (Sales)" value={rv.val} onChange={v=>s("rev",v)} onTap={()=>nav("explain:pnl-revenue")} hint={autoHint(rv.isAuto,"another section")}/>
    <SD label="Cost of Sales"/><TapInput label="Food Cost" value={data.fc||""} onChange={v=>s("fc",v)} onTap={()=>nav("explain:pnl-food-cost")}/><TapInput label="Beverage Cost" value={data.bc||""} onChange={v=>s("bc",v)} onTap={()=>nav("explain:pnl-beverage-cost")}/><TapInput label="Other CoS" value={data.oc||""} onChange={v=>s("oc",v)} onTap={()=>nav("explain:pnl-other-cos")}/>
    <SD label="Labour"/><TapInput label="Wages & Salaries" value={data.wg||""} onChange={v=>s("wg",v)} onTap={()=>nav("explain:pnl-wages")}/><TapInput label="NI & Pension" value={data.ni||""} onChange={v=>s("ni",v)} onTap={()=>nav("explain:pnl-ni-pension")}/><TapInput label="Agency Staff" value={data.ag||""} onChange={v=>s("ag",v)} onTap={()=>nav("explain:pnl-agency")}/>
    <SD label="Overheads"/><TapInput label="Rent & Rates" value={data.rn||""} onChange={v=>s("rn",v)} onTap={()=>nav("explain:pnl-rent")}/><TapInput label="Utilities" value={data.ut||""} onChange={v=>s("ut",v)} onTap={()=>nav("explain:pnl-utilities")}/><TapInput label="Insurance" value={data.ins||""} onChange={v=>s("ins",v)} onTap={()=>nav("explain:pnl-insurance")}/><TapInput label="Marketing" value={data.mk||""} onChange={v=>s("mk",v)} onTap={()=>nav("explain:pnl-marketing")}/><TapInput label="Repairs & Maintenance" value={data.rp||""} onChange={v=>s("rp",v)} onTap={()=>nav("explain:pnl-repairs")}/><TapInput label="Other Overheads" value={data.oh||""} onChange={v=>s("oh",v)} onTap={()=>nav("explain:pnl-other-overheads")}/>
    {has&&hc&&<div style={{marginTop:24,animation:"fadeUp 0.3s ease"}}>{tCOS>0&&<BL label="Gross Profit" value={fmt(gp)} pctLabel={pct(gpP)} color={gpP<60?C.warn:gpP<65?C.caution:C.accent} onTap={()=>nav("explain:pnl-gp")}/>}<BL label="Net Profit" value={fmt(net)} pctLabel={pct(netP)} color={netP<5?C.warn:netP<8?C.caution:C.accent} onTap={()=>nav("explain:pnl-net")}/><TargetIns label="GP" actual={gpP} target={kpis.gp} higher={true}/><TargetIns label="Labour" actual={labP} target={kpis.labour} higher={false}/><TargetIns label="Overheads" actual={ohP} target={kpis.overheads} higher={false}/><TargetIns label="Net Profit" actual={netP} target={kpis.netProfit} higher={true}/><Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Full P&L</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}><CR label="Revenue" value={R} pctVal={100} onTap={()=>nav("explain:pnl-revenue")}/>{vfc>0&&<CR label="  Food" value={-vfc} pctVal={(vfc/R)*100}/>}{vbc>0&&<CR label="  Beverage" value={-vbc} pctVal={(vbc/R)*100}/>}{voc>0&&<CR label="  Other CoS" value={-voc} pctVal={(voc/R)*100}/>}{tCOS>0&&<CR label="= Gross Profit" value={gp} pctVal={gpP} color={gpP<60?C.warn:C.accent} bold onTap={()=>nav("explain:pnl-gp")}/>}{vwg>0&&<CR label="  Wages" value={-vwg} pctVal={(vwg/R)*100}/>}{vni>0&&<CR label="  NI/Pension" value={-vni} pctVal={(vni/R)*100}/>}{vag>0&&<CR label="  Agency" value={-vag} pctVal={(vag/R)*100}/>}{tLab>0&&<CR label="Total Labour" value={-tLab} pctVal={labP} color={labP>35?C.warn:C.text} bold/>}{vrn>0&&<CR label="  Rent" value={-vrn} pctVal={(vrn/R)*100}/>}{vut>0&&<CR label="  Utilities" value={-vut} pctVal={(vut/R)*100}/>}{vis>0&&<CR label="  Insurance" value={-vis} pctVal={(vis/R)*100}/>}{vmk>0&&<CR label="  Marketing" value={-vmk} pctVal={(vmk/R)*100}/>}{vrp>0&&<CR label="  Repairs" value={-vrp} pctVal={(vrp/R)*100}/>}{voh>0&&<CR label="  Other" value={-voh} pctVal={(voh/R)*100}/>}{tOH>0&&<CR label="Total Overheads" value={-tOH} pctVal={ohP} color={ohP>25?C.warn:C.text} bold/>}<CR label="= NET PROFIT" value={net} pctVal={netP} color={netP<5?C.warn:C.accent} bold border={false} onTap={()=>nav("explain:pnl-net")}/></div></div>}
    <HowCalc onTap={()=>nav("explain:how-pnl")}/>
    <StartAgainBtn onReset={()=>setData({rev:""})}/>
  </Page>);
}

function EBITDAPage({onBack,nav,data,setData,kpis,shared,setShared}){
  const s=(k,v)=>{
    setData({...data,[k]:v});
    if(k==="rev"&&v)setShared(prev=>({...prev,revenue:v}));
  };
  const rv=useSharedField(data.rev,shared.revenue);
  const cos=useSharedField(data.cos,shared.totalCOS);
  const lab=useSharedField(data.lab,shared.totalLabour);
  const oh=useSharedField(data.oh,shared.totalOverheads);
  const R=parseFloat(rv.val)||0,vc=parseFloat(cos.val)||0,vl=parseFloat(lab.val)||0,vo=parseFloat(oh.val)||0;
  const vd=parseFloat(data.dep)||0,vi=parseFloat(data.int)||0,vt=parseFloat(data.tax)||0;
  const ebitda=R-vc-vl-vo,eP=R>0?(ebitda/R)*100:0,net=ebitda-vd-vi-vt,nP=R>0?(net/R)*100:0;
  const has=R>0&&(vc>0||vl>0||vo>0);
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="EBITDA (Monthly)" sub="Earnings Before Interest, Tax, Depreciation and Amortisation"/>
    <SD label="Core"/><TapInput label="Revenue (Sales) for the Month" value={rv.val} onChange={v=>s("rev",v)} onTap={()=>nav("explain:ebitda-revenue")} hint={autoHint(rv.isAuto,"another section")}/><TapInput label="Total Cost of Sales" value={cos.val} onChange={v=>s("cos",v)} onTap={()=>nav("explain:ebitda-cos")} hint={autoHint(cos.isAuto,"P&L")}/><TapInput label="Total Labour" value={lab.val} onChange={v=>s("lab",v)} onTap={()=>nav("explain:pnl-wages")} hint={autoHint(lab.isAuto,"P&L")}/><TapInput label="Total Overheads" value={oh.val} onChange={v=>s("oh",v)} onTap={()=>nav("explain:pnl-rent")} hint={autoHint(oh.isAuto,"P&L")}/>
    <SD label="Below EBITDA"/><TapInput label="Depreciation" value={data.dep||""} onChange={v=>s("dep",v)} onTap={()=>nav("explain:ebitda-depreciation")}/><TapInput label="Interest" value={data.int||""} onChange={v=>s("int",v)} onTap={()=>nav("explain:ebitda-interest")}/><TapInput label="Tax" value={data.tax||""} onChange={v=>s("tax",v)} onTap={()=>nav("explain:ebitda-tax")}/>
    {has&&<div style={{marginTop:24,animation:"fadeUp 0.3s ease"}}><BL label="EBITDA (Monthly)" value={fmt(ebitda)} pctLabel={pct(eP)} color={eP<15?C.caution:C.accent} onTap={()=>nav("explain:ebitda-result")}/>{(vd>0||vi>0||vt>0)&&<BL label="Net Profit" value={fmt(net)} pctLabel={pct(nP)} color={nP<5?C.warn:C.accent} onTap={()=>nav("explain:pnl-net")}/>}<TargetIns label="EBITDA" actual={eP} target={kpis.ebitda} higher={true}/><Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Calculation</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}><CR label="Revenue" value={R} pctVal={100}/><CR label="− Cost of Sales" value={vc} pctVal={R>0?(vc/R)*100:0}/><CR label="− Labour" value={vl} pctVal={R>0?(vl/R)*100:0}/><CR label="− Overheads" value={vo} pctVal={R>0?(vo/R)*100:0}/><CR label="= EBITDA (Monthly)" value={ebitda} pctVal={eP} color={eP<15?C.caution:C.accent} bold onTap={()=>nav("explain:ebitda-result")} border={vd>0||vi>0||vt>0}/>{vd>0&&<CR label="− Depreciation" value={vd} pctVal={(vd/R)*100}/>}{vi>0&&<CR label="− Interest" value={vi} pctVal={(vi/R)*100}/>}{vt>0&&<CR label="− Tax" value={vt} pctVal={(vt/R)*100}/>}{(vd>0||vi>0||vt>0)&&<CR label="= Net Profit" value={net} pctVal={nP} color={nP<5?C.warn:C.accent} bold border={false} onTap={()=>nav("explain:pnl-net")}/>}</div></div>}
    <HowCalc onTap={()=>nav("explain:how-ebita")}/>
    <StartAgainBtn onReset={()=>setData({rev:"",cos:"",lab:"",oh:""})}/>
  </Page>);
}

function CAPEXPage({onBack,nav,data,setData,kpis,shared,setShared}){
  const s=(k,v)=>{
    setData({...data,[k]:v});
    if(k==="rev"&&v)setShared(prev=>({...prev,revenue:v}));
  };
  const rv=useSharedField(data.rev,shared.revenue);
  const R=parseFloat(rv.val)||0,vk=parseFloat(data.kit)||0,vf=parseFloat(data.fit)||0,vt=parseFloat(data.tech)||0,vo=parseFloat(data.oth)||0;
  const total=vk+vf+vt+vo,tP=R>0?(total/R)*100:0;
  const has=vk>0||vf>0||vt>0||vo>0;
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="CAPEX" sub="Capital Expenditure — investments in your business"/>
    <TapInput label="Revenue (Sales) for %" value={rv.val} onChange={v=>s("rev",v)} onTap={()=>nav("explain:pnl-revenue")} hint={autoHint(rv.isAuto,"another section")}/>
    <SD label="Capital Items"/><TapInput label="Kitchen Equipment" value={data.kit||""} onChange={v=>s("kit",v)} onTap={()=>nav("explain:capex-kitchen")}/><TapInput label="Fit-out & Refurbishment" value={data.fit||""} onChange={v=>s("fit",v)} onTap={()=>nav("explain:capex-fitout")}/><TapInput label="Technology" value={data.tech||""} onChange={v=>s("tech",v)} onTap={()=>nav("explain:capex-technology")}/><TapInput label="Other CAPEX" value={data.oth||""} onChange={v=>s("oth",v)} onTap={()=>nav("explain:capex-other")}/>
    {has&&<div style={{marginTop:24,animation:"fadeUp 0.3s ease"}}><BL label="Total CAPEX" value={fmt(total)} pctLabel={R>0?pct(tP):undefined} color={C.info} onTap={()=>nav("explain:capex-result")}/><TargetIns label="CAPEX" actual={tP} target={kpis.capex} higher={false}/><Dv/><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Calculation</div><div style={{background:C.surface,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}>{vk>0&&<CR label="Kitchen" value={vk} pctVal={R>0?(vk/R)*100:undefined}/>}{vf>0&&<CR label="Fit-out" value={vf} pctVal={R>0?(vf/R)*100:undefined}/>}{vt>0&&<CR label="Technology" value={vt} pctVal={R>0?(vt/R)*100:undefined}/>}{vo>0&&<CR label="Other" value={vo} pctVal={R>0?(vo/R)*100:undefined}/>}<CR label="= Total CAPEX" value={total} pctVal={R>0?tP:undefined} color={C.info} bold border={false} onTap={()=>nav("explain:capex-result")}/></div></div>}
    <HowCalc onTap={()=>nav("explain:how-capex")}/>
    <StartAgainBtn onReset={()=>setData({rev:""})}/>
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   INSIGHTS — uses allData + kpis (unchanged logic)
   ═══════════════════════════════════════════════════════════════════ */
function InsightsPage({onBack,allData,kpis}){
  const primary=[];const benchmarks=[];
  const cd=allData.cogs||{},gd=allData.gp||{},wd=allData.waste||{},ed=allData.ebitda||{},pd=allData.pnl||{},cx=allData.capex||{};
  function addMetric(label,actual,kpiKey,higher,benchVal,benchLabel){
    if(isNaN(actual))return;const kt=kpis[kpiKey];
    if(kt&&kt!==""){const t=parseFloat(kt);if(isNaN(t))return;const diff=Math.abs(actual-t);const ok=higher?(actual>=t):(actual<=t);const better=higher?(actual>t):(actual<t);
      if(ok&&better)primary.push({type:"success",title:`${label} — on target`,text:`${label} is ${pct(actual)}. Your target is ${pct(t)}. You're ${pct(diff)} better than your target.`});
      else if(ok)primary.push({type:"success",title:`${label} — on target`,text:`${label} is ${pct(actual)}, exactly on your target of ${pct(t)}.`});
      else primary.push({type:"warning",title:`${label} — off target`,text:`${label} is ${pct(actual)}. Your target is ${pct(t)}. You're ${pct(diff)} ${higher?"below":"above"} your target.`});
    }else if(benchVal!==undefined){const bOk=higher?(actual>=benchVal):(actual<=benchVal);benchmarks.push({type:bOk?"success":"caution",title:`${label} — ${benchLabel||"benchmark"}`,text:`${label} is ${pct(actual)}. No KPI target set. General commercial benchmark: ${pct(benchVal)}.`})}
  }
  const cogsO=parseFloat(cd.os)||0,cogsP2=parseFloat(cd.pu)||0,cogsCl=parseFloat(cd.cs)||0,cogsR=parseFloat(cd.rv)||0;
  const cogsVal=cogsO+cogsP2-cogsCl,cogsPct=cogsR>0?(cogsVal/cogsR)*100:0;
  if(cogsO>0||cogsP2>0)addMetric("COGS",cogsPct,"cogs",false,35,"max 35%");
  const gpR=parseFloat(gd.rv)||0,gpC=parseFloat(gd.co)||0,gpV=gpR-gpC,gpPct=gpR>0?(gpV/gpR)*100:0;
  if(gpR>0)addMetric("GP%",gpPct,"gp",true,65,"min 65%");
  const wW=parseFloat(wd.wa)||0,wR=parseFloat(wd.rv)||0,wastePct=wR>0?(wW/wR)*100:0;
  if(wW>0&&wR>0)addMetric("Waste",wastePct,"waste",false,5,"max 5%");
  const plR=parseFloat(pd.rev)||0,plWg=parseFloat(pd.wg)||0,plNi=parseFloat(pd.ni)||0,plAg=parseFloat(pd.ag)||0;
  const tLab2=plWg+plNi+plAg,labPct2=plR>0?(tLab2/plR)*100:0;
  if(tLab2>0&&plR>0)addMetric("Labour",labPct2,"labour",false,35,"max 35%");
  const plRn=parseFloat(pd.rn)||0,plUt=parseFloat(pd.ut)||0,plIs=parseFloat(pd.ins)||0,plMk=parseFloat(pd.mk)||0,plRp=parseFloat(pd.rp)||0,plOh2=parseFloat(pd.oh)||0;
  const tOH2=plRn+plUt+plIs+plMk+plRp+plOh2,ohPct2=plR>0?(tOH2/plR)*100:0;
  if(tOH2>0&&plR>0)addMetric("Overheads",ohPct2,"overheads",false,25,"max 25%");
  const plFC=parseFloat(pd.fc)||0,plBC=parseFloat(pd.bc)||0,plOC=parseFloat(pd.oc)||0;
  const plCOS=plFC+plBC+plOC,plGP=plR-plCOS,plNet=plGP-tLab2-tOH2,netPct2=plR>0?(plNet/plR)*100:0;
  if(plR>0&&(plCOS>0||tLab2>0||tOH2>0))addMetric("Net Profit",netPct2,"netProfit",true,8,"min 8%");
  // EBITDA
  const eR=parseFloat(ed.rev)||0,eCos=parseFloat(ed.cos)||0,eLab=parseFloat(ed.lab)||0,eOh=parseFloat(ed.oh)||0;
  const ebitda=eR-eCos-eLab-eOh,ebitdaP=eR>0?(ebitda/eR)*100:0;
  if(eR>0&&(eCos>0||eLab>0||eOh>0))addMetric("EBITDA",ebitdaP,"ebitda",true,15,"min 15%");
  const cxR=parseFloat(cx.rev)||0,cxK=parseFloat(cx.kit)||0,cxF=parseFloat(cx.fit)||0,cxT=parseFloat(cx.tech)||0,cxO=parseFloat(cx.oth)||0;
  const cxTot=cxK+cxF+cxT+cxO,cxPct=cxR>0?(cxTot/cxR)*100:0;
  if(cxTot>0&&cxR>0)addMetric("CAPEX",cxPct,"capex",false,5,"max 5%");
  const hasData=primary.length>0||benchmarks.length>0;const warnCount=primary.filter(i=>i.type==="warning").length;
  return(<Page onBack={onBack} backLabel="Back"><Ttl text="Insights" sub="How you're performing against your targets"/><div style={{background:`linear-gradient(135deg,${C.accent}0A,${C.info}06)`,border:`1px solid ${C.accent}14`,borderRadius:16,padding:"16px 18px",marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:20}}>🧠</span><span style={{fontSize:14,fontWeight:600}}>Manager Briefing</span></div><div style={{fontSize:13,color:C.sub,lineHeight:1.5}}>{hasData?(warnCount>0?`${warnCount} area${warnCount!==1?"s":""} need${warnCount===1?"s":""} attention. Review below.`:"All metrics are on target. Keep it up."):"Enter numbers in any section and set your KPI targets to see insights here."}</div></div>
    {primary.length>0&&<React.Fragment><div style={{fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>vs Your KPI Targets</div>{primary.map((x,i)=>(<div key={"p"+i} style={{animation:`fadeUp 0.35s ease ${i*0.06}s both`}}><Ins {...x}/></div>))}</React.Fragment>}
    {benchmarks.length>0&&<React.Fragment><Dv/><div style={{fontSize:12,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Commercial Benchmark Reference</div><div style={{fontSize:11,color:C.dim,marginBottom:10}}>No KPI target set for these. Showing general industry benchmarks for reference only.</div>{benchmarks.map((x,i)=>(<div key={"b"+i} style={{animation:`fadeUp 0.35s ease ${(primary.length+i)*0.06}s both`}}><Ins {...x}/></div>))}</React.Fragment>}
    {!hasData&&<Ins type="info" title="No Data Yet" text="Enter numbers in any category and set your KPI targets. Your insights will appear here."/>}
  </Page>);
}

/* ═══════════════════════════════════════════════════════════════════
   APP — with shared state
   ═══════════════════════════════════════════════════════════════════ */
export default function OpsInsight(){
  const[h,sH]=useState(["home"]);
  const[kpis,setKpis]=useStored("opsinsight-kpis",{});
  const[cogsData,setCogsData]=useStored("opsinsight-cogs",{});
  const[gpData,setGpData]=useStored("opsinsight-gp",{});
  const[pnlData,setPnlData]=useStored("opsinsight-pnl",{});
  const[wasteData,setWasteData]=useStored("opsinsight-waste",{});
  const[ebitdaData,setEbitdaData]=useStored("opsinsight-ebitda",{});
  const[capexData,setCapexData]=useStored("opsinsight-capex",{});
  const[shared,setShared]=useStored("opsinsight-shared",{});
  const pg=h[h.length-1];
  const nav=useCallback(p=>{sH(x=>[...x,p]);window.scrollTo(0,0)},[]);
  const back=useCallback(()=>{sH(x=>x.length>1?x.slice(0,-1):x);window.scrollTo(0,0)},[]);
  const home=useCallback(()=>{sH(["home"]);window.scrollTo(0,0)},[]);
  const allData={cogs:cogsData,gp:gpData,pnl:pnlData,waste:wasteData,ebitda:ebitdaData,capex:capexData};
  const sp={shared,setShared};
  return(<React.Fragment>
    {pg==="home"&&<Home nav={nav}/>}
    {pg==="starthere"&&<StartHerePage onBack={back} nav={nav}/>}
    {pg==="kpi"&&<KPIPage onBack={back} nav={nav} kpis={kpis} setKpis={setKpis}/>}
    {pg==="abbreviations"&&<AbbreviationsPage onBack={back} nav={nav}/>}
    {pg==="leadership"&&<LeadershipPage onBack={back} nav={nav}/>}
    {pg==="feedback"&&<FeedbackPage onBack={back}/>}
    {pg==="howtofix"&&<HowToFixPage onBack={back} nav={nav}/>}
    {pg.startsWith("fix:")&&<FixDetailPage id={pg.replace("fix:","")} onBack={()=>back()}/>}
    {pg==="cogs"&&<COGSPage onBack={back} nav={nav} data={cogsData} setData={setCogsData} kpis={kpis} {...sp}/>}
    {pg==="gp"&&<GPPage onBack={back} nav={nav} data={gpData} setData={setGpData} kpis={kpis} {...sp}/>}
    {pg==="pnl"&&<PLPage onBack={back} nav={nav} data={pnlData} setData={setPnlData} kpis={kpis} {...sp}/>}
    {pg==="waste"&&<WastePage onBack={back} nav={nav} data={wasteData} setData={setWasteData} kpis={kpis} {...sp}/>}
    {pg==="ebitda"&&<EBITDAPage onBack={back} nav={nav} data={ebitdaData} setData={setEbitdaData} kpis={kpis} {...sp}/>}
    {pg==="capex"&&<CAPEXPage onBack={back} nav={nav} data={capexData} setData={setCapexData} kpis={kpis} {...sp}/>}
    {pg==="insights"&&<InsightsPage onBack={back} allData={allData} kpis={kpis}/>}
    {pg.startsWith("explain:")&&<ExplainPage id={pg.replace("explain:","")} onBack={back}/>}
  </React.Fragment>);
}
