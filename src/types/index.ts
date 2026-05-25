export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  user_id: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  payer_id: string;
  split_between: string[];
  created_by: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_member: string;
  to_member: string;
  amount: number;
  settled_at: string;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface GroupWithDetails extends Group {
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
}
