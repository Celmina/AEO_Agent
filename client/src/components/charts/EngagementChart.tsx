import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EngagementDataPoint {
  name: string;
  opens: number;
  clicks: number;
  conversions: number;
}

interface EngagementChartProps {
  data: EngagementDataPoint[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="opens" stroke="#22C55E" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="clicks" stroke="#6366F1" />
            <Line type="monotone" dataKey="conversions" stroke="#F43F5E" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-500">Last 30 days</div>
        <div className="flex space-x-4">
          <span className="flex items-center text-success">
            <i className="fas fa-circle text-xs mr-1"></i>
            Opens
          </span>
          <span className="flex items-center text-primary">
            <i className="fas fa-circle text-xs mr-1"></i>
            Clicks
          </span>
          <span className="flex items-center text-accent">
            <i className="fas fa-circle text-xs mr-1"></i>
            Conversions
          </span>
        </div>
      </div>
    </div>
  );
}
