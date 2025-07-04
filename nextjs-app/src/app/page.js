'use client';
import React, { useState, useEffect } from 'react';
import states from '../../utils/states';
import { getWorkingDaysInMonth } from '../../utils/holidays';
// 动态导入 ECharts 组件
let ReactECharts;
try {
  ReactECharts = require('echarts-for-react').default;
} catch {
  // ECharts not available
}

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
  
  // 计算总工作时间和已工作时间（分钟）
  const totalMinutes = (end - start) / 60000;
  const workedMinutes = Math.max(0, Math.min(totalMinutes, (now - start) / 60000));
  
  // 计算每分钟收入
  const grossPerMinute = gross / totalMinutes;
  const netPerMinute = net / totalMinutes;
  
  // 计算当前收入
  const currentGross = workedMinutes * grossPerMinute;
  const currentNet = workedMinutes * netPerMinute;
  
  return {
    gross: Math.max(0, Math.min(gross, currentGross)),
    net: Math.max(0, Math.min(net, currentNet)),
  };
}

function isWeekend() {
  const day = new Date().getDay();
  const isWeekendDay = day === 0 || day === 6;
  console.log('Weekend check:', { day, isWeekendDay, dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] });
  return isWeekendDay;
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
    // 临时移除周末检查以测试功能
    // if (isWeekend()) {
    //   setTodayPercent(0);
    //   setTodayEarnings({ gross: 0, net: 0 });
    //   return;
    // }
    const update = () => {
      const progress = getTodayProgress(startTime, endTime);
      const earnings = getTodayEarnings(gross, net, startTime, endTime);
      console.log('Updating today:', { progress, earnings, gross, net, startTime, endTime });
      setTodayPercent(progress);
      setTodayEarnings(earnings);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [gross, net, startTime, endTime]);

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
    console.log('Calculate button clicked');
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
    <div className="min-h-screen bg-base-100">
      {/* 导航栏 */}
      <div className="navbar bg-base-200 shadow-lg">
        <div className="navbar-start">
          <span className="text-2xl font-bold text-primary">Working Time Tracker</span>
        </div>
        <div className="navbar-end">
          <div className="badge badge-primary">Sunset Theme</div>
        </div>
      </div>

      {/* 表单 */}
      <div className="container mx-auto p-6">
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-primary mb-4">Configuration</h2>
            <form className="overflow-x-auto" onSubmit={handleCalculate}>
              {/* 所有输入框排成一行，均匀分布 */}
              <div className="flex justify-between items-start gap-4">
                <div className="form-control w-48">
                  <label className="label">
                    <span className="label-text font-semibold">Country</span>
                  </label>
                  <select 
                    className="select select-bordered w-full" 
                    value={country} 
                    onChange={e => setCountry(e.target.value)}
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>

                <div className="form-control w-48">
                  <label className="label">
                    <span className="label-text font-semibold">State/Province</span>
                  </label>
                  <select 
                    className="select select-bordered w-full" 
                    value={state} 
                    onChange={e => setState(e.target.value)}
                  >
                    {states[country]?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control w-32">
                  <label className="label">
                    <span className="label-text font-semibold">Gross Income</span>
                  </label>
                  <input 
                    className="input input-bordered w-full" 
                    type="number" 
                    value={gross} 
                    onChange={e => setGross(Number(e.target.value))} 
                  />
                </div>

                <div className="form-control w-32">
                  <label className="label">
                    <span className="label-text font-semibold">Net Income</span>
                  </label>
                  <input 
                    className="input input-bordered w-full" 
                    type="number" 
                    value={net} 
                    onChange={e => setNet(Number(e.target.value))} 
                  />
                </div>

                <div className="form-control w-32">
                  <label className="label">
                    <span className="label-text font-semibold">Start Time</span>
                  </label>
                  <input 
                    className="input input-bordered w-full" 
                    type="time" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                  />
                </div>

                <div className="form-control w-32">
                  <label className="label">
                    <span className="label-text font-semibold">End Time</span>
                  </label>
                  <input 
                    className="input input-bordered w-full" 
                    type="time" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                  />
                </div>

                <div className="form-control w-32">
                  <label className="label">
                    <span className="label-text font-semibold">Onboard Date</span>
                  </label>
                  <input 
                    className="input input-bordered w-full" 
                    type="date" 
                    value={onboardDate} 
                    onChange={e => setOnboardDate(e.target.value)} 
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Dashboard 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Workdays Completed This Month */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-primary">Workdays Completed This Month</h3>
              {/* ECharts 仪表盘 */}
              {ReactECharts ? (
                <ReactECharts option={gaugeOption} style={{ height: 180, width: '100%' }} />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-base-content">
                  [Please install <code>echarts-for-react</code>]
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Today's Working Time */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-primary">Today&apos;s Working Time</h3>
              {/* Pixel Progress Bar & 动态收入/周末提示 */}
              {/* 临时显示计算，无论是否周末 */}
              <PixelProgressBar percent={todayPercent} />
              <div className="mt-4 text-lg">
                <div className="flex justify-between">
                  <span>Gross: <span className="font-bold text-success">${todayEarnings.gross.toFixed(2)}</span></span>
                  <span>Net: <span className="font-bold text-success">${todayEarnings.net.toFixed(2)}</span></span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Progress: {todayPercent.toFixed(1)}% | Time: {startTime}-{endTime}
                  {isWeekend() && <span className="text-orange-500 ml-2">(Weekend)</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Box 3: Total Since Onboard */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-primary">Total Since Onboard</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Days Worked:</span>
                  <span className="font-bold text-accent">{onboardStats.days}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Gross:</span>
                  <span className="font-bold text-success">${onboardStats.gross}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Net:</span>
                  <span className="font-bold text-success">${onboardStats.net}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 4: Month Remaining */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-primary">Month Remaining</h3>
              <div className="text-base-content">[Workdays Left, Earnings Left]</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 