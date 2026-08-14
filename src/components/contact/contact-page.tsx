import { useEffect, useState } from 'react';
import { fetchSupportTickets, sendContactMessage, type SupportTicket } from '../../services/user-service';
import './contact-page.css';

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

const initialFormState: ContactFormState = {
  name: '',
  email: '',
  message: '',
};

const formatTicketDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const userEmail = localStorage.getItem('wealth-plus-email') || localStorage.getItem('wealth-plus-username') || '';

  const loadTickets = async () => {
    if (!userEmail) return;

    try {
      setTicketsLoading(true);
      setTicketsError(null);
      const data = await fetchSupportTickets(userEmail);
      setTickets(data);
    } catch (error) {
      console.error('Unable to load support requests:', error);
      setTicketsError('No Tickets Found.');
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = form.name.trim();
    const message = form.message.trim();
    const email = localStorage.getItem('wealth-plus-email') || localStorage.getItem('wealth-plus-username') || '';

    if (!name || !message) {
      setErrorMessage('Please fill all required fields.');
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await sendContactMessage({ name, email, message });
      const status: number = response.status;
      const srNumber: string = response.data?.serviceId;

      if (status === 400 && srNumber) {
        setSuccessMessage(`You already have an active support request. Your Ticket ID is: ${srNumber}`);
        setForm(initialFormState);
        return;
      }
      setSuccessMessage('Thanks for reaching out. Our team will contact you soon. Your Ticket ID is: ' + srNumber);
      setForm(initialFormState);
      loadTickets();
    } catch (error) {
      console.error('Unable to submit contact form:', error);
      setErrorMessage('Unable to submit your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <div className="contact-layout">
        <aside className="tickets-panel">
          <h2>My Support Requests</h2>
          {ticketsLoading && <p className="tickets-status">Loading...</p>}
          {ticketsError && <p className="tickets-status tickets-error">{ticketsError}</p>}
          {!ticketsLoading && !ticketsError && tickets.length === 0 && (
            <p className="tickets-status">No support requests yet.</p>
          )}
          {!ticketsLoading && !ticketsError && tickets.length > 0 && (
            <ul className="tickets-list">
              {tickets.map((ticket) => (
                <li key={ticket.serviceId} className="ticket-item">
                  <div className="ticket-id">{ticket.serviceId}</div>
                  {ticket.status && (
                    <span className={`ticket-status ticket-status-${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  )}
                  {ticket.createdAt && <div className="ticket-date">{formatTicketDate(ticket.createdAt)}</div>}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="contact-card">
          <div className="contact-head">
            <p className="contact-eyebrow">Contact Us</p>
            <h1>We would love to hear from you</h1>
            <p>Share your query and we will get back to you shortly.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Your name"
              maxLength={80}
            />

            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              value={form.message}
              onChange={(event) => handleChange('message', event.target.value)}
              placeholder="Type your message"
              rows={5}
              maxLength={1000}
            />

            {errorMessage && <p className="contact-feedback contact-error">{errorMessage}</p>}
            {successMessage && <p className="contact-feedback contact-success">{successMessage}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ContactPage;
