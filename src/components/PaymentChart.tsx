import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import AutoSizer from 'react-virtualized-auto-sizer';

const PaymentLineChart = () => {
  // Generate random payment data for each month
  const data = [
    { month: 'January', payment: Math.floor(Math.random() * 1000) },
    { month: 'February', payment: Math.floor(Math.random() * 1000) },
    { month: 'March', payment: Math.floor(Math.random() * 1000) },
    { month: 'April', payment: Math.floor(Math.random() * 1000) },
    { month: 'May', payment: Math.floor(Math.random() * 1000) },
    { month: 'June', payment: Math.floor(Math.random() * 1000) },
    { month: 'July', payment: Math.floor(Math.random() * 1000) },
    { month: 'August', payment: Math.floor(Math.random() * 1000) },
    { month: 'September', payment: Math.floor(Math.random() * 1000) },
    { month: 'October', payment: Math.floor(Math.random() * 1000) },
  ];

  return (
      <AutoSizer>
        {({ width, height }) => (
          <LineChart
            width={width - 10}
            height={height - 10}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Payment Amount', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="payment" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        )}
      </AutoSizer>
  );
};

export default PaymentLineChart;
