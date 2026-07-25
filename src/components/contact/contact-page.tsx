import { useState } from 'react';
import { sendContactMessage } from '../../services/admin-service';
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

function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setErrorMessage('Please fill all required fields.');
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await sendContactMessage({ name, email, message });

      setSuccessMessage('Thanks for reaching out. Our team will contact you soon.');
      setForm(initialFormState);
    } catch (error) {
      console.error('Unable to submit contact form:', error);
      setErrorMessage('Unable to send your message right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
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

          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            placeholder="you@example.com"
            maxLength={120}
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
    </main>
  );
}

export default ContactPage;
