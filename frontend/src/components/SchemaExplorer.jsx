import { useState } from 'react';

// User-friendly schema map — built for non-technical users.
// Each domain has: icon, accent color, one-line description,
// "what you can ask about", and clickable sample questions.
const DOMAINS = [
  {
    id: 'sales',
    icon: '💰',
    name: 'Sales & Revenue',
    color: '#10b981',
    blurb: 'Customer orders, invoices, and revenue performance',
    topics: [
      'Customer details and segments (Enterprise / Mid-market / SMB)',
      'Sales orders and their status (pending, shipped, delivered)',
      'Invoices and payment status (paid, pending, overdue)',
      'Revenue by salesperson, region, or customer',
    ],
    examples: [
      'Top 5 customers by total revenue',
      'How many invoices are overdue?',
      'Show daily sales for the last 30 days',
      'Revenue by region',
      'Which salesperson closed the most deals?',
    ],
  },
  {
    id: 'hr',
    icon: '👥',
    name: 'Human Resources',
    color: '#8b5cf6',
    blurb: 'Employees, attendance, leaves, and payroll',
    topics: [
      'Employee directory with department, role, hire date, salary',
      'Daily attendance (present / absent / WFH / half-day)',
      'Leave requests and approvals',
      'Monthly payroll figures',
    ],
    examples: [
      'List all employees in the Sales department',
      'Who is currently on leave?',
      'Average salary by department',
      'How many people were absent last week?',
      'Total payroll for last month',
    ],
  },
  {
    id: 'inventory',
    icon: '📦',
    name: 'Inventory & Stock',
    color: '#f59e0b',
    blurb: 'Products, warehouses, and stock movements',
    topics: [
      'Product catalog (raw material, components, finished goods, PPE)',
      'Stock quantity per warehouse',
      'Stock movements: incoming, outgoing, transfers',
      'Reorder levels and low-stock alerts',
    ],
    examples: [
      'Which products are below their reorder level?',
      'Stock quantity by warehouse',
      'Show stock movements in the last 7 days',
      'Total inventory value by category',
    ],
  },
  {
    id: 'purchase',
    icon: '🛒',
    name: 'Purchasing',
    color: '#3b82f6',
    blurb: 'Purchase orders, supplier spending, goods receipts',
    topics: [
      'Purchase orders and their status',
      'Spending broken down by supplier or buyer',
      'Goods receipt records',
    ],
    examples: [
      'List pending purchase orders',
      'Total purchase value by supplier this month',
      'Which supplier has the most orders?',
    ],
  },
  {
    id: 'manufacturing',
    icon: '🏭',
    name: 'Manufacturing',
    color: '#ec4899',
    blurb: 'Production output, defects, machines, operator shifts',
    topics: [
      'Units produced per machine, shift, or operator',
      'Defects: type, severity, blamed supplier',
      'Machine status (running, down, in maintenance)',
      'Shift records and hours worked',
    ],
    examples: [
      'Daily production trend for the last 15 days',
      'Which defect type is most common?',
      'How many machines are currently down?',
      'Top operators by total units produced',
    ],
  },
];

export default function SchemaExplorer({ open, onClose, onPickQuestion }) {
  const [expanded, setExpanded] = useState(DOMAINS[0].id);

  return (
    <>
      <div className={`schema-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`schema-panel ${open ? 'open' : ''}`}>
        <header className="schema-head">
          <div>
            <div className="schema-title">📚 What can I ask?</div>
            <div className="schema-sub">A guide to the data this app understands</div>
          </div>
          <button className="schema-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="schema-intro">
          The AI can answer questions about <b>five business areas</b>. Tap any
          example to run it instantly.
        </div>

        <div className="schema-domains">
          {DOMAINS.map((d) => {
            const isOpen = expanded === d.id;
            return (
              <div
                key={d.id}
                className={`schema-domain ${isOpen ? 'expanded' : ''}`}
                style={{ '--accent': d.color }}
              >
                <button className="schema-domain-head" onClick={() => setExpanded(isOpen ? null : d.id)}>
                  <span className="schema-domain-icon">{d.icon}</span>
                  <div className="schema-domain-text">
                    <div className="schema-domain-name">{d.name}</div>
                    <div className="schema-domain-blurb">{d.blurb}</div>
                  </div>
                  <span className="schema-chev">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="schema-domain-body">
                    <div className="schema-section-title">You can ask about</div>
                    <ul className="schema-topic-list">
                      {d.topics.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                    <div className="schema-section-title">Try these</div>
                    <div className="schema-examples">
                      {d.examples.map((q, i) => (
                        <button
                          key={i}
                          className="schema-example"
                          onClick={() => { onPickQuestion(q); onClose(); }}
                        >
                          {q} <span className="schema-example-arrow">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="schema-footer">
          💡 The AI only answers questions about these areas. Anything outside
          will return "No data available".
        </footer>
      </aside>
    </>
  );
}
