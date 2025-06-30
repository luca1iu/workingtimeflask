'use client';
import React, { useState, useEffect } from 'react';
import states from '../../utils/states';
import { getWorkingDaysInMonth } from '../../utils/holidays';
// 动态导入 ECharts 组件
let ReactECharts;
try {
  ReactECharts = require('echarts-for-react').default;
} catch {}

const defaultRegions = {
  US: 'CA - California',
  AU: 'NSW - New South Wales',
  DE: 'NW - Nordrhein-Westfalen',
  GB: 'ENG - England',
  CA: 'ON - Ontario',
};
const defaultIncome = {
  US: { gross: 5000, net: 4000 },
  AU: { gross: 7000, net: 5500 },
  DE: { gross: 4500, net: 3000 },
  GB: { gross: 4800, net: 3500 },
  CA: { gross: 5200, net: 4000 },
};

function getTodayProgress(startTime, endTime) {
  const now = new Date();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

function getTodayEarnings(gross, net, startTime, endTime) {
  const now = new Date();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);
  const totalMinutes = (end - start) / 60000;
  const workedMinutes = Math.max(0, Math.min(totalMinutes, (now - start) / 60000));
  const grossPerMinute = gross / totalMinutes;
  const netPerMinute = net / totalMinutes;
  return {
    gross: Math.max(0, Math.min(gross, workedMinutes * grossPerMinute)),
    net: Math.max(0, Math.min(net, workedMinutes * netPerMinute)),
  };
}

function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function PixelProgressBar({ percent }) {
  // 20格像素条
  const total = 20;
  const filled = Math.round((percent / 100) * total);
  return (
    <div className="flex gap-1 w-full max-w-xs">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-6 w-3 border border-green-400 ${i < filled ? 'bg-green-400' : 'bg-black'}`}
          style={{ boxShadow: i < filled ? '0 0 2px #00FF00,0 0 8px #00FF00' : 'none' }}
        />
      ))}
    </div>
  );
}

function extractRegionCode(regionStr) {
  if (!regionStr) return "";
  return regionStr.split("-")[0].trim();
}

function getAllWorkingDaysSinceOnboard(country, state, onboardDateStr) {
  const onboardDate = new Date(onboardDateStr);
  const today = new Date();
  let y = onboardDate.getFullYear();
  let m = onboardDate.getMonth() + 1;
  const allDays = [];
  while (y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth() + 1)) {
    const wds = getWorkingDaysInMonth(country, state, y, m);
    for (const d of wds) {
      if (d >= onboardDate && d <= today) {
        allDays.push(d);
      }
    }
    if (m === 12) {
      y += 1;
      m = 1;
    } else {
      m += 1;
    }
  }
  return allDays;
}

export default function Home() {
  // 表单状态
  const [country, setCountry] = useState('US');
  const [state, setState] = useState(defaultRegions['US']);
  const [gross, setGross] = useState(defaultIncome['US'].gross);
  const [net, setNet] = useState(defaultIncome['US'].net);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [onboardDate, setOnboardDate] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  // 新增：今日进度和收入
  const [todayPercent, setTodayPercent] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState({ gross: 0, net: 0 });
  const [workdaysCompleted, setWorkdaysCompleted] = useState(0);
  const [workdaysTotal, setWorkdaysTotal] = useState(0);
  const [onboardStats, setOnboardStats] = useState({ days: 0, gross: 0, net: 0 });

  useEffect(() => {
    // 只在客户端初始化日期，避免 hydration 问题
    setOnboardDate(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10));
  }, []);

  // 国家切换时自动设置默认州、省、收入
  useEffect(() => {
    setState(defaultRegions[country]);
    setGross(defaultIncome[country].gross);
    setNet(defaultIncome[country].net);
  }, [country]);

  // 每秒刷新今日进度和收入
  useEffect(() => {
    if (isWeekend()) {
      setTodayPercent(0);
      setTodayEarnings({ gross: 0, net: 0 });
      return;
    }
    const update = () => {
      setTodayPercent(getTodayProgress(startTime, endTime));
      setTodayEarnings(getTodayEarnings(gross, net, startTime, endTime));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [gross, net, startTime, endTime, country, state]);

  // 计算本月工作日和已完成工作日
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const allWorkdays = getWorkingDaysInMonth(country, state, year, month);
    setWorkdaysTotal(allWorkdays.length);
    setWorkdaysCompleted(allWorkdays.filter(d => d <= now).length);
  }, [country, state]);

  // 计算累计工作日和累计收入
  useEffect(() => {
    if (onboardDate) {
      const allDays = getAllWorkingDaysSinceOnboard(country, state, onboardDate);
      const days = allDays.length;
      // 以当前月的日薪为基准
      const now = new Date();
      const wdsThisMonth = getWorkingDaysInMonth(country, state, now.getFullYear(), now.getMonth() + 1);
      const grossPerDay = wdsThisMonth.length > 0 ? gross / wdsThisMonth.length : 0;
      const netPerDay = wdsThisMonth.length > 0 ? net / wdsThisMonth.length : 0;
      setOnboardStats({
        days,
        gross: Math.round(grossPerDay * days * 100) / 100,
        net: Math.round(netPerDay * days * 100) / 100,
      });
    }
  }, [country, state, gross, net, onboardDate]);

  // 计算 dashboard 数据（这里只是占位，后续可完善）
  const handleCalculate = (e) => {
    e.preventDefault();
    // TODO: 这里应调用 holidays/working days 计算逻辑
    setDashboardData({
      workdaysCompleted: 10,
      workdaysTotal: 22,
      percent: 45,
    });
  };

  // ECharts 配置示例
  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        progress: { show: true, width: 18 },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { show: false },
        splitLine: { length: 15, lineStyle: { width: 2, color: '#00FF00' } },
        axisLabel: { distance: 25, color: '#00FF00', fontSize: 16 },
        pointer: { width: 8, length: '70%' },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          color: '#00FF00',
          formatter: () => `${workdaysCompleted}/${workdaysTotal}`,
        },
        data: [{ value: workdaysTotal > 0 ? (workdaysCompleted / workdaysTotal) * 100 : 0 }],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* 导航栏 */}
      <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-green-700">
        <span className="text-2xl font-bold tracking-widest">Home</span>
      </nav>
      {/* 表单 */}
      <form className="flex flex-row flex-wrap gap-2 items-center justify-center py-8" onSubmit={handleCalculate}>
        <label htmlFor="country" className="min-w-max">Country:</label>
        <select className="select select-success" value={country} onChange={e => setCountry(e.target.value)}>
          <option value="US">United States</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="GB">United Kingdom</option>
          <option value="CA">Canada</option>
        </select>
        <label htmlFor="state" className="min-w-max">State:</label>
        <select className="input input-success" value={state} onChange={e => setState(e.target.value)}>
          {states[country]?.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label htmlFor="gross" className="min-w-max">Gross Income:</label>
        <input className="input input-success" type="number" value={gross} onChange={e => setGross(Number(e.target.value))} placeholder="Gross Income" />
        <label htmlFor="net" className="min-w-max">Net Income:</label>
        <input className="input input-success" type="number" value={net} onChange={e => setNet(Number(e.target.value))} placeholder="Net Income" />
        <label htmlFor="startTime" className="min-w-max">Start Time:</label>
        <input className="input input-success" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        <input className="input input-success" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        <input className="input input-success" type="date" value={onboardDate} onChange={e => setOnboardDate(e.target.value)} />
        
      </form>
      {/* Dashboard 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto py-8">
        {/* Box 1: Workdays Completed This Month */}
        <div className="bg-green-950 rounded-xl p-6 flex flex-col items-center shadow-lg">
          <div className="text-lg mb-2">Workdays Completed This Month</div>
          {/* ECharts 仪表盘 */}
          {ReactECharts ? (
            <ReactECharts option={gaugeOption} style={{ height: 180, width: '100%' }} />
          ) : (
            <div className="w-full h-32 flex items-center justify-center text-green-400">[Please install <code>echarts-for-react</code>]</div>
          )}
        </div>
        {/* Box 2: Today&apos;s Working Time */}
        <div className="bg-green-950 rounded-xl p-6 flex flex-col items-center shadow-lg">
          <div className="text-lg mb-2">Today&apos;s Working Time</div>
          {/* Pixel Progress Bar & 动态收入/周末提示 */}
          {isWeekend() ? (
            <div className="w-full h-8 flex items-center justify-center text-xl font-bold tracking-widest" style={{fontFamily:'monospace',textShadow:'0 0 8px #00FF00'}}>
              Enjoy weekend, see you next week
            </div>
          ) : (
            <>
              <PixelProgressBar percent={todayPercent} />
              <div className="mt-2 text-lg">
                Gross: <span className="font-bold">${todayEarnings.gross.toFixed(2)}</span> &nbsp;|
                Net: <span className="font-bold">${todayEarnings.net.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        {/* Box 3: Total Since Onboard */}
        <div className="bg-green-950 rounded-xl p-6 flex flex-col items-center shadow-lg">
          <div className="text-lg mb-2">Total Since Onboard</div>
          <div className="text-green-400 text-lg mt-2">Days Worked: <span className="font-bold">{onboardStats.days}</span></div>
          <div className="text-green-400 text-lg mt-2">Total Gross Earnings: <span className="font-bold">${onboardStats.gross}</span></div>
          <div className="text-green-400 text-lg mt-2">Total Net Earnings: <span className="font-bold">${onboardStats.net}</span></div>
        </div>
        {/* Box 4: Month Remaining */}
        <div className="bg-green-950 rounded-xl p-6 flex flex-col items-center shadow-lg">
          <div className="text-lg mb-2">Month Remaining</div>
          <div>[Workdays Left, Earnings Left]</div>
        </div>
      </div>
    </div>
  );
} 