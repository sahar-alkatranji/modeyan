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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(formData);
    alert('Thank you for your message!');
  };

  return (
    <section className="py-20" id="contact">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-serif mb-4">{t('contact_title')}</h2>
        <p className="text-gray-600 mb-10">{t('contact_info')}</p>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto text-start">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <input type="text" name="firstName" placeholder={t('contact_form_firstName')} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
            <input type="text" name="lastName" placeholder={t('contact_form_lastName')} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div className="mb-6">
            <input type="email" name="email" placeholder={t('contact_form_email')} required onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div className="mb-6">
            <input type="text" name="subject" placeholder={t('contact_form_subject')} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div className="mb-8">
            <textarea name="message" placeholder={t('contact_form_message')} rows={5} onChange={handleChange} className="w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black"></textarea>
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