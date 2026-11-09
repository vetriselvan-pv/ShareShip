export type ExpenseTabType = 'monthly' | 'events';

export type ExpenseCategory =
  | 'Gift'
  | 'Utilities'
  | 'Food'
  | 'Home Expenses'
  | 'Travel'
  | 'Cattle'
  | 'Lifestyle'
  | string;

export interface EventOption {
  id: string;
  title: string;
}

export interface NewExpensePayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: string;
  splitLabel: string;
  expenseType: 'monthly' | 'event';
  eventId?: string;
  eventTitle?: string;
}

export interface CategorySummaryItem {
  id: string;
  name: string;
  amount: string;
  subtitle: string;
  icon?: string;
  colorClass?: string;
}

export interface RecentTransactionItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  splitLabel: string;
  splitColor?: 'primary' | 'secondary' | 'neutral';
  iconType:
    | 'coffee'
    | 'bolt'
    | 'florist'
    | 'flight'
    | 'restaurant'
    | 'gift'
    | 'home'
    | 'cattle'
    | 'lifestyle'
    | string;
}

export interface EventExpenseMember {
  name: string;
  avatarUrl: string;
}

export interface EventExpenseCardItem {
  id: string;
  title: string;
  status: 'Active Trip' | 'Completed';
  spent: number;
  budget: number;
  bgImageUrl: string;
  members: EventExpenseMember[];
}

export interface SharedExpenseTx {
  id: string;
  title: string;
  author: string;
  authorInitial?: string;
  authorRole?: string;
  amount: number;
}
