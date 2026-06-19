import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../api';
import { PDFDownloadLink, Font } from '@react-pdf/renderer';
import {
  Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Line, Cell
} from 'recharts';
import ReportPDF from '../../pdf/ReportPDF';

const OccupancyBar = ({ value }) => {
  const color = value >= 80 ? '#ef4444' : value >= 50 ? '#f59e0b' : '#22c55e';
  const bg = value >= 80 ? 'bg-red-100 text-red-700' : value >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} min-w-[46px] text-center`}>{value}%</span>
    </div>
  );
};

const CustomTick = ({ x, y, payload }) => {
  const num = (payload.value || '').split('|')[0];
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={4}
        transform="rotate(-45)"
        textAnchor="end"
        fill="#64748b"
        fontSize={11}
        fontWeight="600"
      >{num}</text>
    </g>
  );
};

const ReportsPage = () => {
  const [data, setData] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' });
    fetch(`${API_URL}/admin/airlines-list`).then(r => r.json()).then(setAirlines);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAirline) params.append('airline_id', selectedAirline);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    fetch(`${API_URL}/admin/report/occupancy?${params}`)
      .then(r => r.json()).then(setData).catch(() => toast.error('Ошибка загрузки отчёта'));
  }, [selectedAirline, dateFrom, dateTo]);

  const chartData = data.map(d => ({
    ...d,
    label: `${d.flight_number}|${d.destination_location}`,
  }));

  const getBarColor = (pct) => pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#2563eb';

  return (
    <div className="bg-white p-8 rounded-lg shadow border space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Загрузка рейсов</h2>
        {data.length > 0 ? (
          <PDFDownloadLink document={<ReportPDF data={data} />} fileName="flight_occupancy_report.pdf">
            {({ loading }) => (
              <button className="bg-red-600 text-white px-5 py-2 rounded-md font-bold hover:bg-red-700">
                {loading ? 'Генерация...' : 'Скачать PDF'}
              </button>
            )}
          </PDFDownloadLink>
        ) : <p className="text-sm text-slate-500">Нет данных для отчёта</p>}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm font-bold text-slate-500 uppercase">Авиакомпания:</label>
        <select value={selectedAirline} onChange={e => setSelectedAirline(e.target.value)}
          className="border p-2 rounded-lg outline-none focus:border-blue-500 bg-white min-w-48">
          <option value="">Все авиакомпании</option>
          {airlines.map(a => <option key={a.airline_id} value={a.airline_id}>{a.airline_name}</option>)}
        </select>
        <label className="text-sm font-bold text-slate-500 uppercase">Период вылета:</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border p-2 rounded-lg outline-none focus:border-blue-500" />
        <span className="text-slate-400">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border p-2 rounded-lg outline-none focus:border-blue-500" />
        {(selectedAirline || dateFrom || dateTo) && (
          <button onClick={() => { setSelectedAirline(''); setDateFrom(''); setDateTo(''); }}
            className="text-sm text-slate-400 hover:text-slate-700">Сбросить</button>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-center text-slate-400 py-12">Нет данных</p>
      ) : (
        <>
          <div style={{ height: 420 }} className="w-full mt-6">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={<CustomTick />} interval={0} height={70} />
                <YAxis yAxisId="left" orientation="left" allowDecimals={false} label={{ value: 'Пассажиров', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }} />
                <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} label={{ value: 'Загрузка', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }} />
                <Tooltip
                  formatter={(value, name) => name === 'Загрузка (%)' ? `${value}%` : value}
                  labelFormatter={(label) => {
                    const [num, dest] = label.split('|');
                    return `${num} → ${dest}`;
                  }}
                />
                <Bar yAxisId="left" dataKey="registered" radius={[4, 4, 0, 0]} name="Пассажиров">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.occupancy_percentage)} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="occupancy_percentage" stroke="#f59e0b" strokeWidth={2} dot={false} name="Загрузка (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> до 50%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> 50–80%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> свыше 80%</span>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-slate-500 border-b text-xs uppercase">
                <th className="text-left p-3">Рейс</th>
                <th className="text-left p-3">Направление</th>
                <th className="text-left p-3">Авиакомпания</th>
                <th className="text-left p-3">Самолёт</th>
                <th className="text-right p-3">Вместимость</th>
                <th className="text-right p-3">Зарег.</th>
                <th className="text-left p-3 w-48">Загрузка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(d => (
                <tr key={d.flight_id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-blue-600">{d.flight_number}</td>
                  <td className="p-3">{d.destination_location}</td>
                  <td className="p-3">{d.airline_name}</td>
                  <td className="p-3 text-slate-500">{d.plane_type}</td>
                  <td className="p-3 text-right">{d.capacity}</td>
                  <td className="p-3 text-right font-semibold">{d.registered}</td>
                  <td className="p-3"><OccupancyBar value={d.occupancy_percentage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
