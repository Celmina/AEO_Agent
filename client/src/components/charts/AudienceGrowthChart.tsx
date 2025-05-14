import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AudienceDataPoint {
  name: string;
  subscribers: number;
  unsubscribes: number;
}

interface AudienceGrowthChartProps {
  data: AudienceDataPoint[];
}

export function AudienceGrowthChart({ data }: AudienceGrowthChartProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Audience Growth</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
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
            <Area type="monotone" dataKey="subscribers" stackId="1" stroke="#6366F1" fill="#6366F1" />
            <Area type="monotone" dataKey="unsubscribes" stackId="1" stroke="#F43F5E" fill="#F43F5E" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-500">Last 6 months</div>
        <div className="flex space-x-4">
          <span className="flex items-center text-primary">
            <i className="fas fa-circle text-xs mr-1"></i>
            New subscribers
          </span>
          <span className="flex items-center text-error">
            <i className="fas fa-circle text-xs mr-1"></i>
            Unsubscribes
          </span>
        </div>
      </div>
    </div>
  );
}
