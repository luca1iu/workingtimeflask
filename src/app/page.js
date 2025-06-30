import './globals.css'

const currencySymbols = {
  US: '($)',
  AU: '(A$)',
  DE: '(€)',
  GB: '(£)',
  CA: '(C$)',
};

<form className="flex flex-row flex-wrap gap-2 items-center justify-center py-8 bg-black border-b-2 border-green-700 w-full max-w-5xl mx-auto px-4 overflow-x-auto" onSubmit={handleCalculate}>
  <label htmlFor="country" className="min-w-max">Country:</label>
  <select id="country" className="bg-black text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-36" value={country} onChange={e => setCountry(e.target.value)}>
    <option value="US">United States</option>
    <option value="AU">Australia</option>
    <option value="DE">Germany</option>
    <option value="GB">United Kingdom</option>
    <option value="CA">Canada</option>
  </select>
  <label htmlFor="state" className="min-w-max">State/Region:</label>
  <select
    id="state"
    className="bg-red-500 text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-24"
    style={{ border: '2px solid #22c55e' }}
    value={state}
    onChange={e => setState(e.target.value)}
  >
    {states[country]?.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
  <label htmlFor="gross" className="min-w-max">Gross{currencySymbols[country]}:</label>
  <input id="gross" className="bg-black text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-24" type="number" value={gross} onChange={e => setGross(Number(e.target.value))} placeholder="Gross Income" />
  <label htmlFor="net" className="min-w-max">Net{currencySymbols[country]}:</label>
  <input id="net" className="bg-black text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-24" type="number" value={net} onChange={e => setNet(Number(e.target.value))} placeholder="Net Income" />
  <label htmlFor="startTime" className="min-w-max">Start:</label>
  <input id="startTime" className="bg-black text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-20" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
  <label htmlFor="endTime" className="min-w-max">End:</label>
  <input id="endTime" className="bg-black text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-20" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
  <label htmlFor="onboardDate" className="min-w-max">Onboard Date:</label>
  <input id="onboardDate" className="bg-black text-green-400 border-2 border-green-500 rounded px-2 py-1 font-mono w-32" type="date" value={onboardDate} onChange={e => setOnboardDate(e.target.value)} />
  <button className="btn btn-success px-8 ml-2" type="submit">Calculate</button>
</form> 