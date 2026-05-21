import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  };

  return (
    <section className="py-20" id="contact">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-serif mb-2">{t('contact_title')}</h2>
        <div className="w-20 h-px bg-brand-gold mx-auto mb-4"></div>

        {/* Contact Info with WhatsApp */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <a
            href="mailto:bsaman710@gmail.com"
            className="text-gray-600 hover:text-black transition-colors"
          >
            bsaman710@gmail.com
          </a>
          <span className="hidden sm:block text-gray-300">|</span>
          <a
            href="tel:+963969656346"
            className="text-gray-600 hover:text-black transition-colors"
          >
            +963 969 656 346
          </a>
          <span className="hidden sm:block text-gray-300">|</span>
          <a
            href="https://wa.me/963969656346"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            واتساب
          </a>
        </div>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm max-w-xl mx-auto animate-fade-in">
            ✅ شكراً لتواصلك معنا! سنرد عليك في أقرب وقت ممكن.
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto text-start">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <input type="text" name="firstName" value={formData.firstName} placeholder={t('contact_form_firstName')} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
            <input type="text" name="lastName" value={formData.lastName} placeholder={t('contact_form_lastName')} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div className="mb-6">
            <input type="email" name="email" value={formData.email} placeholder={t('contact_form_email')} required onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div className="mb-6">
            <input type="text" name="subject" value={formData.subject} placeholder={t('contact_form_subject')} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div className="mb-8">
            <textarea name="message" value={formData.message} placeholder={t('contact_form_message')} rows={5} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black"></textarea>
          </div>
          <div className="text-center">
            <button type="submit" className="px-10 py-3 bg-black text-white font-semibold tracking-widest text-sm hover:bg-gray-800 transition duration-300">
              {t('contact_form_submit')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Contact;