import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface WinRateDataPoint {
  date: string;
  winRate: number;
  period: string;
  stakesWon: number;
  stakesTotal: number;
  examResult?: string; // 'WON' or 'LOST'
  examId?: string; // Short exam ID
}

interface WinRateChartProps {
  data: WinRateDataPoint[];
  className?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: WinRateDataPoint;
    value: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_#000]">
        <p className="font-bold text-lg mb-2">Exam: {data.examId}</p>
        <div className="space-y-1">
          <p className={`font-bold text-lg ${data.examResult === 'WON' ? 'text-green-600' : 'text-red-600'}`}>
            Result: {data.examResult} 🎯
          </p>
          <p className="text-blue-600 font-bold">
            Current Win Rate: {data.winRate}%
          </p>
          <p className="text-gray-600 font-bold">
            Total Wins: {data.stakesWon}
          </p>
          <p className="text-gray-600 font-bold">
            Total Losses: {data.stakesTotal - data.stakesWon}
          </p>
          <p className="text-gray-500 text-sm">
            Total Exams: {data.stakesTotal}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const WinRateChart: React.FC<WinRateChartProps> = ({ data, className = "" }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`border-4 border-black p-8 bg-white shadow-[8px_8px_0px_#000] ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-600 mb-2">No Win Rate History</h3>
          <p className="text-gray-500">
            Start participating in exams to see your win rate trends over time.
          </p>
        </div>
      </div>
    );
  }

  // Calculate trend
  const currentWinRate = data[data.length - 1]?.winRate || 0;
  const previousWinRate = data.length > 1 ? data[data.length - 2]?.winRate : currentWinRate;
  const trend = currentWinRate >= previousWinRate;
  const trendPercentage = data.length > 1 ? 
    Math.abs(currentWinRate - previousWinRate).toFixed(1) : '0.0';

  return (
    <div className={`border-4 border-black p-6 bg-white shadow-[8px_8px_0px_#000] ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Exam Results Timeline</h3>
          <p className="text-gray-600 text-sm">Each point = one exam • Line shows running win rate</p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            {trend ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-bold ${trend ? 'text-green-600' : 'text-red-600'}`}>
              {trend ? '+' : '-'}{trendPercentage}%
            </span>
          </div>
          <p className="text-xs text-gray-500">vs previous exam</p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="examId" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#666' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              label={{ 
                value: 'Running Win Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines */}
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label="50%" />
            <ReferenceLine y={75} stroke="#10b981" strokeDasharray="5 5" label="75%" />
            
            <Line
              type="linear"
              dataKey="winRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={(props: { cx: number; cy: number; index?: number; payload: WinRateDataPoint }) => {
  const { cx, cy, payload, index } = props;
  const isWin = payload.examResult === 'WON';
  return (
    <circle
      key={payload.examId || index}  
      cx={cx}
      cy={cy}
      r={6}
      fill={isWin ? '#10b981' : '#ef4444'}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}}

              activeDot={{ 
                r: 10, 
                fill: '#1d4ed8',
                stroke: '#fff',
                strokeWidth: 3
              }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
          <span className="text-sm text-gray-600">Won Exam</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
          <span className="text-sm text-gray-600">Lost Exam</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-blue-500"></div>
          <span className="text-sm text-gray-600">Running Win Rate</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center border-2 border-gray-200 p-3 bg-blue-50">
          <p className="text-2xl font-bold text-blue-600">{currentWinRate}%</p>
          <p className="text-xs text-gray-600 font-medium">Current Win Rate</p>
        </div>
        
        <div className="text-center border-2 border-gray-200 p-3 bg-green-50">
          <p className="text-2xl font-bold text-green-600">
            {Math.max(...data.map(d => d.winRate))}%
          </p>
          <p className="text-xs text-gray-600 font-medium">Best Performance</p>
        </div>
        
        <div className="text-center border-2 border-gray-200 p-3 bg-purple-50">
          <p className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, d) => sum + d.stakesTotal, 0)}
          </p>
          <p className="text-xs text-gray-600 font-medium">Total Stakes</p>
        </div>
      </div>
    </div>
  );
};

export default WinRateChart;