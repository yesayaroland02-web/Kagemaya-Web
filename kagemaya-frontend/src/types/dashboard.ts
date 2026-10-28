export interface DashboardStats {
  metrics: {
    total_sales: number;
    tickets_sold: number;
    active_events: number;
    total_events: number;
  };
  chart_data: Array<{
    date: string;
    revenue: number;
    tickets: number;
    transactions: number;
  }>;
  recent_transactions: Array<{
    id: string;
    customer_name: string;
    event_title: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
}