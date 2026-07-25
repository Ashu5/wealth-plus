import { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import './my-journey-page.css';

ChartJS.register(ArcElement, Tooltip, Legend);

type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: string;
  notes: string;
  createdAt: string;
};

type GoalForm = {
  title: string;
  targetAmount: string;
  currentAmount: string;
  category: string;
  targetDate: string;
  notes: string;
};

const emptyForm: GoalForm = {
  title: '',
  targetAmount: '',
  currentAmount: '',
  category: 'Savings',
  targetDate: '',
  notes: '',
};

const getStorageKey = () => {
  const email = localStorage.getItem('wealth-plus-email') || 'guest';
  return `wealth-plus-goals-${email}`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const getStatus = (goal: Goal) => {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  if (goal.currentAmount >= goal.targetAmount) {
    return 'Completed';
  }

  if (progress >= 75) {
    return 'On track';
  }

  if (progress >= 40) {
    return 'Building momentum';
  }

  return 'Getting started';
};

const MyJourneyPage = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [updateValues, setUpdateValues] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const storedGoals = localStorage.getItem(getStorageKey());
      if (storedGoals) {
        const parsed = JSON.parse(storedGoals) as Goal[];
        setGoals(parsed);
      }
    } catch (error) {
      console.error('Unable to load goals', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(getStorageKey(), JSON.stringify(goals));
    }
  }, [goals, loading]);

  const summary = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
    const inProgress = total - completed;

    return { total, completed, inProgress };
  }, [goals]);

  const handleInputChange = (field: keyof GoalForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.targetAmount) {
      return;
    }

    const nextGoal: Goal = {
      id: `${Date.now()}`,
      title: form.title.trim(),
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount || 0),
      category: form.category || 'Savings',
      targetDate: form.targetDate,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setGoals((prev) => [nextGoal, ...prev]);
    setForm(emptyForm);
  };

  const handleProgressUpdate = (goalId: string) => {
    const rawValue = updateValues[goalId];
    if (!rawValue) {
      return;
    }

    const nextAmount = Number(rawValue);
    if (Number.isNaN(nextAmount)) {
      return;
    }

    setGoals((prev) => prev.map((goal) => (goal.id === goalId ? { ...goal, currentAmount: nextAmount } : goal)));
    setUpdateValues((prev) => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="journey-page">
      <div className="journey-hero">
        <div>
          <p className="journey-eyebrow">My Journey</p>
          <h1>Plan your next financial milestone</h1>
          <p>Capture the goals you care about most and keep a simple view of your progress.</p>
        </div>
        <div className="journey-summary">
          <div>
            <strong>{summary.total}</strong>
            <span>Total goals</span>
          </div>
          <div>
            <strong>{summary.completed}</strong>
            <span>Completed</span>
          </div>
          <div>
            <strong>{summary.inProgress}</strong>
            <span>In progress</span>
          </div>
        </div>
      </div>

      <div className="journey-grid">
        <section className="journey-card">
          <div className="journey-card-header">
            <h2>Add a new goal</h2>
            <p>Set a target, current savings, and a finish date.</p>
          </div>

          <form className="journey-form" onSubmit={handleSubmit}>
            <label>
              Goal name
              <input value={form.title} onChange={(event) => handleInputChange('title', event.target.value)} placeholder="Build an emergency fund" />
            </label>

            <label>
              Category
              <select value={form.category} onChange={(event) => handleInputChange('category', event.target.value)}>
                <option value="Savings">Savings</option>
                <option value="Education">Education</option>
                <option value="Travel">Travel</option>
                <option value="Home">Home</option>
                <option value="Retirement">Retirement</option>
              </select>
            </label>

            <label>
              Target amount
              <input type="number" min="1" value={form.targetAmount} onChange={(event) => handleInputChange('targetAmount', event.target.value)} placeholder="50000" />
            </label>

            <label>
              Current amount
              <input type="number" min="0" value={form.currentAmount} onChange={(event) => handleInputChange('currentAmount', event.target.value)} placeholder="15000" />
            </label>

            <label>
              Target date
              <input type="date" value={form.targetDate} onChange={(event) => handleInputChange('targetDate', event.target.value)} />
            </label>

            <label>
              Notes
              <textarea value={form.notes} onChange={(event) => handleInputChange('notes', event.target.value)} placeholder="Add any detail you want to remember" rows={3} />
            </label>

            <button type="submit" className="journey-submit-btn">Save goal</button>
          </form>
        </section>

        <section className="journey-card">
          <div className="journey-card-header">
            <h2>Your goals</h2>
            <p>Update the amount you have saved to refresh the status instantly.</p>
          </div>

          {loading ? (
            <div className="journey-empty">Loading your goals...</div>
          ) : goals.length === 0 ? (
            <div className="journey-empty">No goals yet. Add your first one to get started.</div>
          ) : (
            <div className="journey-list">
              {goals.map((goal) => {
                const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                const status = getStatus(goal);

                return (
                  <article key={goal.id} className="journey-goal-card">
                    <div className="journey-goal-head">
                      <div>
                        <h3>{goal.title}</h3>
                        <p>{goal.category}</p>
                      </div>
                      <span className={`journey-badge ${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
                    </div>

                    <div className="journey-progress-row">
                      <div className="journey-chart-wrap">
                        <Doughnut
                          data={{
                            labels: ['Completed', 'Remaining'],
                            datasets: [
                              {
                                data: [progress, 100 - progress],
                                backgroundColor: ['#22c55e', '#e2e8f0'],
                                borderWidth: 0,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '70%',
                            plugins: {
                              legend: { display: false },
                              tooltip: { enabled: false },
                            },
                          }}
                        />
                      </div>
                      <div className="journey-progress-copy">
                        <strong>{Math.round(progress)}%</strong>
                        <span>Complete</span>
                      </div>
                    </div>

                    <div className="journey-metrics">
                      <div>
                        <span>Current</span>
                        <strong>{formatCurrency(goal.currentAmount)}</strong>
                      </div>
                      <div>
                        <span>Target</span>
                        <strong>{formatCurrency(goal.targetAmount)}</strong>
                      </div>
                    </div>

                    {goal.targetDate && (
                      <p className="journey-date">Target date: {new Date(goal.targetDate).toLocaleDateString('en-IN')}</p>
                    )}

                    {goal.notes && <p className="journey-notes">{goal.notes}</p>}

                    <div className="journey-update-row">
                      <input
                        type="number"
                        min="0"
                        value={updateValues[goal.id] ?? ''}
                        onChange={(event) => setUpdateValues((prev) => ({ ...prev, [goal.id]: event.target.value }))}
                        placeholder="Update saved amount"
                      />
                      <button type="button" onClick={() => handleProgressUpdate(goal.id)}>
                        Update
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyJourneyPage;
